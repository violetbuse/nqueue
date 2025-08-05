import { RPCHandler } from "@orpc/server/node";
import { StandardHandlerPlugin } from "@orpc/server/standard";
import { SqliteDB } from "../db";
import { orchestrator_contract } from "./contract";
import { OrchestratorDriver } from "./driver";
import { implement } from "@orpc/server";
import { sqlite_schema as schema } from "../db";
import { isNull, lt, and, eq, inArray, sql } from "drizzle-orm";
import type { http_method_schema, JobDescription } from "../types";
import { logger } from "../logging";
import { z } from "zod";

export class SqliteOrchestrator extends OrchestratorDriver {
  constructor(private db: SqliteDB) {
    super();
  }

  override implement_routes(
    contract: typeof orchestrator_contract,
    plugins: StandardHandlerPlugin<{}>[],
  ): RPCHandler<{}> {
    const os = implement(contract);

    const request_job_assignments = os.request_job_assignments.handler(
      async ({ input }) => {
        const { runner_id } = input;
        const jobs = await this.db
          .update(schema.scheduled_jobs)
          .set({ assigned_to: runner_id })
          .where(
            and(
              isNull(schema.scheduled_jobs.assigned_to),
              eq(schema.scheduled_jobs.disabled, false),
              lt(
                schema.scheduled_jobs.planned_at,
                new Date(Date.now() + 30_000),
              ),
            ),
          )
          .returning({ id: schema.scheduled_jobs.id });

        const data = await this.db
          .select({
            id: schema.scheduled_jobs.id,
            planned_at: schema.scheduled_jobs.planned_at,
            timeout_ms: sql<
              number | null
            >`COALESCE(${schema.messages.timeout_ms}, ${schema.cron_jobs.timeout_ms})`,
            url: sql<
              string | null
            >`COALESCE(${schema.messages.url}, ${schema.cron_jobs.url})`,
            method: sql<z.infer<
              typeof http_method_schema
            > | null>`COALESCE(${schema.messages.method}, ${schema.cron_jobs.method})`,
            headers: sql<Record<
              string,
              string
            > | null>`COALESCE(${schema.messages.headers}, ${schema.cron_jobs.headers})`,
            body: sql<
              string | null
            >`COALESCE(${schema.messages.body}, ${schema.cron_jobs.body})`,
          })
          .from(schema.scheduled_jobs)
          .leftJoin(
            schema.messages,
            eq(schema.scheduled_jobs.message_id, schema.messages.id),
          )
          .leftJoin(
            schema.cron_jobs,
            eq(schema.scheduled_jobs.cron_id, schema.cron_jobs.id),
          )
          .where(
            inArray(
              schema.scheduled_jobs.id,
              jobs.map((j) => j.id),
            ),
          );

        return data
          .filter((j) => !!j.url && !!j.method && !!j.timeout_ms)
          .map(
            (job): JobDescription => ({
              job_id: job.id,
              planned_at: job.planned_at,
              data: {
                url: job.url!,
                method: job.method!,
                headers: job.headers ?? {},
                body: job.body ?? "",
              },
              timeout_ms: job.timeout_ms!,
            }),
          );
      },
    );

    const reject_job_assignment = os.reject_job_assignment.handler(
      async ({ input }) => {
        try {
          const { job_id } = input;
          await this.db
            .update(schema.scheduled_jobs)
            .set({ assigned_to: null })
            .where(eq(schema.scheduled_jobs.id, job_id))
            .execute();

          return { success: true };
        } catch (error) {
          logger.error(`Error rejecting job assignment: ${error}`);

          return { success: false };
        }
      },
    );

    const submit_job_result = os.submit_job_result.handler(
      async ({ input }) => {
        await this.db
          .insert(schema.job_results)
          .values({
            id: input.job_id,
            status_code: input.data?.status_code,
            response_headers: input.data?.headers,
            response_body: input.data?.body,
            executed_at: input.attempted_at,
            duration_ms: input.duration_ms,
            error: input.error,
            timed_out: input.timed_out,
          })
          .onConflictDoUpdate({
            target: schema.job_results.id,
            set: {
              status_code: input.data?.status_code,
              response_headers: input.data?.headers,
              response_body: input.data?.body,
              executed_at: input.attempted_at,
              duration_ms: input.duration_ms,
              error: input.error,
              timed_out: input.timed_out,
            },
          });

        return { success: true };
      },
    );

    const submit_job_results = os.submit_job_results.handler(
      async ({ input }) => {
        await Promise.all(
          input.map(async (result) => {
            await this.db
              .insert(schema.job_results)
              .values({
                id: result.job_id,
                status_code: result.data?.status_code,
                response_headers: result.data?.headers,
                response_body: result.data?.body,
                executed_at: result.attempted_at,
                duration_ms: result.duration_ms,
                error: result.error,
                timed_out: result.timed_out,
              })
              .onConflictDoUpdate({
                target: schema.job_results.id,
                set: {
                  status_code: result.data?.status_code,
                  response_headers: result.data?.headers,
                  response_body: result.data?.body,
                  executed_at: result.attempted_at,
                  duration_ms: result.duration_ms,
                  error: result.error,
                  timed_out: result.timed_out,
                },
              });
          }),
        );

        return { success: true };
      },
    );

    const router = os.router({
      request_job_assignments,
      reject_job_assignment,
      submit_job_result,
      submit_job_results,
    });

    return new RPCHandler(router, {
      plugins,
    });
  }
}
