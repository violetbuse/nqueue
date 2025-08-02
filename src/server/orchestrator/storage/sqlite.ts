import { and, eq, lte } from "drizzle-orm";
import { OrchestratorStorage } from "@/server/orchestrator/storage/index.ts";
import { SqliteDB } from "@/server/db/index.ts";
import { sqlite_schema } from "@/server/db/schemas/index.ts";
import { JobDescription, JobResult } from "@/server/types.ts";

export class OrchestratorStorageSqlite implements OrchestratorStorage {
  constructor(private db: SqliteDB) {}

  async assign_jobs(): Promise<JobDescription[]> {
    const minute_from_now = new Date(Date.now() + 60 * 1000);

    return this.db
      .select()
      .from(sqlite_schema.scheduled_job)
      .where(
        and(
          eq(sqlite_schema.scheduled_job.assigned, false),
          lte(sqlite_schema.scheduled_job.planned_at, minute_from_now),
        ),
      )
      .all()
      .map(
        (job): JobDescription => ({
          job_id: job.id,
          planned_at: job.planned_at.getTime(),
          data: {
            url: job.url,
            method: job.method,
            headers: job.headers,
            body: job.body,
          },
          timeout_ms: job.timeout_ms,
        }),
      );
  }

  async cancel_assignment(job_id: string): Promise<{ success: boolean }> {
    try {
      const result = await this.db
        .update(sqlite_schema.scheduled_job)
        .set({ assigned: false })
        .where(eq(sqlite_schema.scheduled_job.id, job_id));
      return { success: result.changes > 0 };
    } catch (error) {
      return { success: false };
    }
  }

  async report_error(
    job_id: string,
    error: string,
  ): Promise<{ success: boolean }> {
    try {
      const result = await this.db.insert(sqlite_schema.job_result).values({
        job_id,
        error,
        timed_out: false,
      });
      return { success: result.changes > 0 };
    } catch (error) {
      return { success: false };
    }
  }

  async submit_job_result(
    job_result: JobResult,
  ): Promise<{ success: boolean }> {
    try {
      const result = await this.db.insert(sqlite_schema.job_result).values({
        job_id: job_result.job_id,
        planned_at: new Date(job_result.planned_at),
        attempted_at: new Date(job_result.attempted_at),
        duration_ms: job_result.duration_ms,
        response_status_code: job_result.data?.status_code,
        response_body: job_result.data?.body,
        response_headers: job_result.data?.headers,
        timed_out: job_result.timed_out,
        error: job_result.error,
      });
      return { success: result.changes > 0 };
    } catch (error) {
      return { success: false };
    }
  }

  async submit_job_results(
    job_results: JobResult[],
  ): Promise<{ success: boolean }> {
    const promises = job_results.map(async (job_result) => {
      const {
        job_id,
        planned_at,
        attempted_at,
        duration_ms,
        data,
        timed_out,
        error,
      } = job_result;
      const response_status_code = data?.status_code;
      const response_body = data?.body;
      const response_headers = data?.headers;

      const result = await this.db.insert(sqlite_schema.job_result).values({
        job_id,
        planned_at: new Date(planned_at),
        attempted_at: new Date(attempted_at),
        duration_ms,
        response_status_code,
        response_body,
        response_headers,
        timed_out,
        error,
      });

      return result.changes > 0;
    });

    const results = await Promise.all(promises);
    return { success: results.every((success) => success) };
  }
}
