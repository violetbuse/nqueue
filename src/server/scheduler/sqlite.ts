import { SchedulerDriver } from ".";
import { SqliteDB } from "../db";
import { logger } from "../logging";
import { sqlite_schema as schema } from "../db";
import {
  and,
  asc,
  count,
  eq,
  exists,
  gt,
  isNotNull,
  isNull,
  lt,
  min,
  max,
  sql,
} from "drizzle-orm";
import { nanoid } from "nanoid";
import CronExpressionParser from "cron-parser";
import { scheduled_jobs } from "../db/schemas/sqlite";

export class SqliteScheduler extends SchedulerDriver {
  constructor(private db: SqliteDB) {
    super();
  }

  override async schedule_crons(): Promise<void> {
    await this.db.transaction(async (txn) => {
      const three_minutes_from_now = new Date(Date.now() + 3 * 60 * 1000);
      const upcoming_crons = await txn
        .select()
        .from(schema.cron_jobs)
        .where(lt(schema.cron_jobs.next_invocation_at, three_minutes_from_now))
        .limit(100);

      const new_scheduled_jobs = upcoming_crons.map(
        (cron): typeof schema.scheduled_jobs.$inferInsert => ({
          id: "scheduled_" + nanoid(),
          planned_at: cron.next_invocation_at,
          url: cron.url,
          method: cron.method,
          headers: cron.headers,
          metadata: cron.metadata,
          body: cron.body,
          timeout_ms: cron.timeout_ms,
          cron_id: cron.id,
        }),
      );

      await txn.insert(schema.scheduled_jobs).values(new_scheduled_jobs);

      await Promise.all(
        upcoming_crons.map(async (cron) => {
          const cron_iter = CronExpressionParser.parse(cron.expression, {
            strict: true,
            startDate: cron.next_invocation_at,
            currentDate: cron.next_invocation_at.getTime() + 5,
          });

          let next = cron_iter.next().toDate();

          if (next.getTime() === cron.next_invocation_at.getTime()) {
            next = cron_iter.next().toDate();
          }

          await txn
            .update(schema.cron_jobs)
            .set({
              next_invocation_at: next,
            })
            .where(eq(schema.cron_jobs.id, cron.id));
        }),
      );
    });
    try {
    } catch (err: any) {
      logger.error(`Error scheduling cron jobs.`);
    }
  }

  override async schedule_messages(): Promise<void> {
    await this.db.transaction(async (txn) => {
      const unscheduled_messages = await txn
        .select()
        .from(schema.messages)
        .leftJoin(
          schema.scheduled_jobs,
          eq(schema.scheduled_jobs.message_id, schema.messages.id),
        )
        .where(
          and(
            isNotNull(schema.messages.scheduled_at),
            isNull(schema.scheduled_jobs.id),
          ),
        )
        .limit(100);

      const new_scheduled_jobs = unscheduled_messages
        .filter((d) => !!d.messages.scheduled_at)
        .map((data): typeof schema.scheduled_jobs.$inferInsert => ({
          id: "scheduled_" + nanoid(),
          planned_at: data.messages.scheduled_at!,
          url: data.messages.url,
          method: data.messages.method,
          headers: data.messages.headers,
          body: data.messages.body,
          metadata: data.messages.metadata,
          timeout_ms: data.messages.timeout_ms,
          message_id: data.messages.id,
        }));

      await txn.insert(schema.scheduled_jobs).values(new_scheduled_jobs);
    });
  }

  override async schedule_queues(): Promise<void> {
    await this.db.transaction(async (txn) => {
      const most_recent_scheduled = txn
        .select({
          queue_id: schema.scheduled_jobs.queue_id,
          scheduled_at: max(schema.scheduled_jobs.planned_at),
        })
        .from(schema.scheduled_jobs)
        .where(isNotNull(schema.scheduled_jobs.queue_id))
        .groupBy(schema.scheduled_jobs.queue_id)
        .as("most_recently_scheduled");

      const recently_scheduled = txn
        .select({
          queue_id: schema.queues.id,
          scheduled_recently: count(),
          earliest_scheduled_at: min(schema.scheduled_jobs.planned_at),
        })
        .from(schema.scheduled_jobs)
        .innerJoin(
          schema.queues,
          eq(schema.queues.id, schema.scheduled_jobs.queue_id),
        )
        .leftJoin(
          most_recent_scheduled,
          eq(schema.queues.id, most_recent_scheduled.queue_id),
        )
        .where(
          // planned at is greater than now minus period length, to get all scheduled jobs within the queue period
          gt(
            schema.scheduled_jobs.planned_at,
            sql`COALESCE(${most_recent_scheduled.scheduled_at}, ${Date.now()}) - (${schema.queues.period_length_seconds} * 1000)`,
          ),
        )
        .groupBy(schema.queues.id)
        .as("recently_scheduled");

      const data = await txn
        .select({
          queue_id: schema.queues.id,
          message_id: schema.messages.id,

          next_eligible_time: sql<number>`
            CASE
              WHEN COALESCE(${recently_scheduled.scheduled_recently}, 0) < ${schema.queues.requests_per_period}
                THEN ${most_recent_scheduled.scheduled_at}
              ELSE ${recently_scheduled.earliest_scheduled_at} + (${schema.queues.period_length_seconds} * 1000)
            END`,
        })
        .from(schema.messages)
        .leftJoin(
          schema.scheduled_jobs,
          eq(schema.scheduled_jobs.message_id, schema.messages.id),
        )
        .innerJoin(
          schema.queues,
          eq(schema.queues.id, schema.messages.queue_id),
        )
        .leftJoin(
          recently_scheduled,
          eq(recently_scheduled.queue_id, schema.queues.id),
        )
        .leftJoin(
          most_recent_scheduled,
          eq(most_recent_scheduled.queue_id, schema.queues.id),
        )
        .where(and(isNull(schema.scheduled_jobs.id)))
        .orderBy((query) => asc(query.next_eligible_time))
        .limit(100);
    });
  }
}
