import { desc, eq, max, asc } from "drizzle-orm";
import { Scheduler } from "@/server/scheduler";
import { SqliteDB } from "@/server/db";
import { sqlite_schema } from "@/server/db/schemas";
import { CronExpressionParser } from "cron-parser";
import { nanoid } from "nanoid";
import { logger } from "@/server/logging";

export class SchedulerSqlite extends Scheduler {
  constructor(private db: SqliteDB) {
    super();
  }

  override async schedule_cron_job(cron_id: string): Promise<void> {
    const job = this.db
      .select()
      .from(sqlite_schema.cron_job)
      .where(eq(sqlite_schema.cron_job.id, cron_id))
      .get();

    if (!job) {
      throw new Error(`Job not found: ${cron_id}`);
    }

    const last_execution = this.db
      .select()
      .from(sqlite_schema.scheduled_job)
      .where(eq(sqlite_schema.scheduled_job.cron_job_id, cron_id))
      .orderBy(desc(sqlite_schema.scheduled_job.planned_at))
      .limit(1)
      .get();

    const last_execution_time = last_execution?.planned_at ?? new Date();
    const cron_iterator = CronExpressionParser.parse(job.expression, {
      currentDate: last_execution_time,
      strict: true,
    });

    const next_execution_time = cron_iterator.next().toDate();

    const new_scheduled_job = this.db
      .insert(sqlite_schema.scheduled_job)
      .values({
        id: "scheduled_" + nanoid(),
        assigned: false,
        planned_at: next_execution_time,
        url: job.url,
        method: job.method,
        body: job.body,
        headers: job.headers,
        metadata: job.metadata,
        timeout_ms: job.timeout_ms,
        cron_job_id: job.id,
      })
      .returning()
      .get();

    logger.info(
      `Scheduled cron job ${new_scheduled_job.id} for cron ${job.id}`,
    );
  }

  override async schedule_crons(): Promise<void> {
    try {
      const cron_jobs = this.db
        .select({
          cron_id: sqlite_schema.cron_job.id,
          planned_at_max: max(sqlite_schema.scheduled_job.planned_at),
        })
        .from(sqlite_schema.cron_job)
        .leftJoin(
          sqlite_schema.scheduled_job,
          eq(
            sqlite_schema.cron_job.id,
            sqlite_schema.scheduled_job.cron_job_id,
          ),
        )
        .groupBy(sqlite_schema.cron_job.id)
        .orderBy(({ planned_at_max }) => asc(planned_at_max))
        .limit(100)
        .all()
        .map((j) => j.cron_id);

      await Promise.all(cron_jobs.map(this.schedule_cron_job));
    } catch (error: any) {
      logger.error(`Error scheduling cron jobs: ${error.message || error}`);
    }
  }
}
