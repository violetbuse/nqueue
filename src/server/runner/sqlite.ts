import { RPCHandler } from "@orpc/server/node";
import { StandardHandlerPlugin } from "@orpc/server/standard";
import { JobDescription, JobResult } from "../types";
import { migrate_runner_sqlite, runner_sqlite_schema as schema } from "../db";
import { runner_contract } from "./contract";
import { RunnerDriver } from "./driver";
import { BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";
import { Database as SqliteDatabase } from "better-sqlite3";
import { logger } from "../logging";
import { eq, inArray, lt } from "drizzle-orm";
import { implement } from "@orpc/server";

export class SqliteRunner extends RunnerDriver {
  private db: BetterSQLite3Database<typeof schema> & {
    $client: SqliteDatabase;
  };

  constructor(runner_db_url: string) {
    super();

    this.db = drizzle(runner_db_url, { schema });

    migrate_runner_sqlite(this.db);

    this.db.$client.pragma("journal_mode = WAL");
  }

  override async put_assigned_jobs(jobs: JobDescription[]): Promise<void> {
    try {
      for (const job of jobs) {
        this.db
          .insert(schema.assigned_jobs)
          .values({
            id: job.job_id,
            planned_at: job.planned_at,
            request_url: job.data.url,
            request_method: job.data.method,
            request_headers: job.data.headers,
            request_body: job.data.body,
            timeout_ms: job.timeout_ms,
          })
          .onConflictDoUpdate({
            target: schema.assigned_jobs.id,
            set: {
              planned_at: job.planned_at,
              request_url: job.data.url,
              request_method: job.data.method,
              request_headers: job.data.headers,
              request_body: job.data.body,
              timeout_ms: job.timeout_ms,
            },
          })
          .execute();
      }
    } catch (error: any) {
      logger.error(`Error putting assigned jobs: ${error.message}`);
    }
  }

  override async get_assigned_jobs(): Promise<JobDescription[]> {
    return this.db
      .select()
      .from(schema.assigned_jobs)
      .all()
      .map((job_data) => ({
        job_id: job_data.id,
        planned_at: job_data.planned_at,
        data: {
          url: job_data.request_url,
          method: job_data.request_method,
          headers: job_data.request_headers,
          body: job_data.request_body,
        },
        timeout_ms: job_data.timeout_ms,
      }));
  }

  override async remove_assigned_jobs(job_ids: string[]): Promise<void> {
    this.db
      .delete(schema.assigned_jobs)
      .where(inArray(schema.assigned_jobs.id, job_ids))
      .execute();
  }

  override async get_cached_job_results(
    older_than: Date,
  ): Promise<JobResult[]> {
    return this.db
      .select()
      .from(schema.cached_job_results)
      .where(lt(schema.cached_job_results.cached_at, older_than))
      .all()
      .map(
        (result): JobResult => ({
          job_id: result.id,
          planned_at: result.planned_at,
          attempted_at: result.attempted_at,
          duration_ms: result.duration_ms,
          timed_out: result.timed_out,
          error: result.error,
          data:
            result.result_status_code !== null &&
            result.result_headers !== null &&
            result.result_body !== null
              ? {
                  status_code: result.result_status_code,
                  headers: result.result_headers,
                  body: result.result_body,
                }
              : null,
        }),
      );
  }

  override implement_routes(
    contract: typeof runner_contract,
    plugins: StandardHandlerPlugin<{}>[],
  ): RPCHandler<{}> {
    try {
      const os = implement(contract);

      const cache_job_result = os.cache_job_result.handler(
        async ({ input }) => {
          this.db
            .insert(schema.cached_job_results)
            .values({
              id: input.job_id,
              planned_at: input.planned_at,
              attempted_at: input.attempted_at,
              duration_ms: input.duration_ms,
              result_status_code: input.data?.status_code,
              result_headers: input.data?.headers,
              result_body: input.data?.body,
              timed_out: input.timed_out,
              error: input.error,
            })
            .onConflictDoUpdate({
              target: schema.cached_job_results.id,
              set: {
                planned_at: input.planned_at,
                attempted_at: input.attempted_at,
                duration_ms: input.duration_ms,
                result_status_code: input.data?.status_code,
                result_headers: input.data?.headers,
                result_body: input.data?.body,
                timed_out: input.timed_out,
                error: input.error,
              },
            })
            .execute();

          return null;
        },
      );

      const remove_job = os.remove_job.handler(async ({ input }) => {
        this.db
          .delete(schema.cached_job_results)
          .where(eq(schema.cached_job_results.id, input.job_id))
          .execute();

        return null;
      });

      const router = os.router({
        cache_job_result,
        remove_job,
      });

      return new RPCHandler(router, { plugins });
    } catch (err: any) {
      logger.error(
        `Error implementing runner routes ${err.message ?? "unknown error"}`,
      );
      throw err;
    }
  }
}
