import { eq, and, gte, lt } from "drizzle-orm";
import { RunnerCache, RunnerStorage } from "@/server/runner/storage";
import { SqliteDB } from "@/server/db";
import { sqlite_schema } from "@/server/db/schemas";
import { JobDescription, JobResult } from "@/server/types";

export class RunnerStorageSqlite implements RunnerStorage {
  constructor(private db: SqliteDB) {}

  async put_job(job: JobDescription): Promise<void> {
    await this.db
      .insert(sqlite_schema.runner_jobs)
      .values({
        job_id: job.job_id,
        planned_at: new Date(job.planned_at),
        url: job.data.url,
        method: job.data.method,
        headers: job.data.headers,
        body: job.data.body,
        timeout_ms: job.timeout_ms,
      })
      .execute();
  }

  async get_jobs([after, before]: [Date, Date]): Promise<JobDescription[]> {
    const data = this.db
      .select()
      .from(sqlite_schema.runner_jobs)
      .where(
        and(
          gte(sqlite_schema.runner_jobs.planned_at, after),
          lt(sqlite_schema.runner_jobs.planned_at, before),
        ),
      )
      .all();

    return data.map(
      (row): JobDescription => ({
        job_id: row.job_id,
        planned_at: row.planned_at.getTime(),
        data: {
          url: row.url,
          method: row.method,
          headers: row.headers,
          body: row.body,
        },
        timeout_ms: row.timeout_ms,
      }),
    );
  }

  async delete_job(job_id: string): Promise<void> {
    await this.db
      .delete(sqlite_schema.runner_jobs)
      .where(eq(sqlite_schema.runner_jobs.job_id, job_id))
      .execute();
  }
}

export class RunnerCacheSqlite implements RunnerCache {
  constructor(private db: SqliteDB) {}

  async set(job_result: JobResult, inserted_at: Date): Promise<void> {
    await this.db
      .insert(sqlite_schema.runner_results_cache)
      .values({
        job_id: job_result.job_id,
        inserted_at: inserted_at,
        planned_at: new Date(job_result.planned_at),
        attempted_at: new Date(job_result.attempted_at),
        duration_ms: job_result.duration_ms,
        status_code: job_result.data?.status_code,
        headers: job_result.data?.headers,
        body: job_result.data?.body,
        timed_out: job_result.timed_out,
        error: job_result.error,
      })
      .execute();
  }

  async get(job_id: string): Promise<JobResult | null> {
    const data = this.db
      .select()
      .from(sqlite_schema.runner_results_cache)
      .where(eq(sqlite_schema.runner_results_cache.job_id, job_id))
      .get();

    const request_data_present =
      data &&
      data.status_code !== null &&
      data.headers !== null &&
      data.body !== null;

    return data
      ? {
          job_id: data.job_id,
          planned_at: data.planned_at.getTime(),
          attempted_at: data.attempted_at.getTime(),
          duration_ms: data.duration_ms,
          data: request_data_present
            ? {
                status_code: data.status_code!,
                headers: data.headers!,
                body: data.body!,
              }
            : null,
          timed_out: data.timed_out,
          error: data.error,
        }
      : null;
  }

  async get_older_than(older_than: Date): Promise<string[]> {
    return this.db
      .select({ id: sqlite_schema.runner_results_cache.job_id })
      .from(sqlite_schema.runner_results_cache)
      .where(lt(sqlite_schema.runner_results_cache.inserted_at, older_than))
      .all()
      .map(({ id }) => id);
  }

  async delete(job_id: string): Promise<void> {
    await this.db
      .delete(sqlite_schema.runner_results_cache)
      .where(eq(sqlite_schema.runner_results_cache.job_id, job_id))
      .execute();
  }
}
