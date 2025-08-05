import { SchedulerDriver } from ".";
import { SqliteDB } from "../db";
import { logger } from "../logging";
import { sqlite_schema as schema } from "../db";
import { and, asc, eq, gt, isNotNull, isNull, lt, min } from "drizzle-orm";
import { nanoid } from "nanoid";
import CronExpressionParser from "cron-parser";
import { compute_next_invocation_at } from "@/utils/rate-limit";

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
          message_id: data.messages.id,
        }));

      await txn.insert(schema.scheduled_jobs).values(new_scheduled_jobs);
    });
  }

  override async schedule_queues(): Promise<void> {
    await this.db.transaction(async (txn) => {
      const queues = await txn
        .select({
          id: schema.queues.id,
          index: min(schema.messages.queue_index),
          next_invocation_at: schema.queues.next_invocation_at,
          requests_per_period: schema.queues.requests_per_period,
          period_length_seconds: schema.queues.period_length_seconds,
        })
        .from(schema.queues)
        .innerJoin(
          schema.messages,
          eq(schema.messages.queue_id, schema.queues.id),
        )
        .leftJoin(
          schema.scheduled_jobs,
          eq(schema.scheduled_jobs.message_id, schema.messages.id),
        )
        .where(and(isNull(schema.scheduled_jobs.id)))
        .orderBy(asc(schema.queues.next_invocation_at))
        .groupBy(schema.queues.id)
        .limit(30);

      let scheduled_jobs: (typeof schema.scheduled_jobs.$inferInsert)[] = [];

      await Promise.all(
        queues.map(async (queue) => {
          const scheduled_most_recently = await txn
            .select({
              id: schema.scheduled_jobs.id,
              planned_at: schema.scheduled_jobs.planned_at,
            })
            .from(schema.scheduled_jobs)
            .where(
              and(
                eq(schema.scheduled_jobs.queue_id, queue.id),
                gt(
                  schema.scheduled_jobs.planned_at,
                  new Date(
                    queue.next_invocation_at.getTime() -
                      queue.period_length_seconds * 2 * 1000,
                  ),
                ),
              ),
            )
            .orderBy(asc(schema.scheduled_jobs.planned_at));

          const waiting_messages = await txn
            .select()
            .from(schema.messages)
            .leftJoin(
              schema.scheduled_jobs,
              eq(schema.messages.id, schema.scheduled_jobs.message_id),
            )
            .where(
              and(
                isNull(schema.scheduled_jobs.id),
                eq(schema.messages.queue_id, queue.id),
              ),
            )
            .orderBy(asc(schema.messages.queue_index))
            .limit(10);

          let invocations = scheduled_most_recently
            .map((j) => j.planned_at)
            .filter(
              (d) =>
                d > new Date(Date.now() - queue.period_length_seconds * 1000),
            );

          for (const { messages: message } of waiting_messages) {
            const next_invocation_at = compute_next_invocation_at(
              {
                requests_per_period: queue.requests_per_period,
                period_in_seconds: queue.period_length_seconds,
              },
              invocations,
              invocations[0] ?? new Date(),
            );

            const new_scheduled_job: typeof schema.scheduled_jobs.$inferInsert =
              {
                id: "scheduled_" + nanoid(),
                queue_id: queue.id,
                message_id: message.id,
                planned_at: next_invocation_at,
              };

            scheduled_jobs.push(new_scheduled_job);
            invocations.push(next_invocation_at);
          }
        }),
      );

      await txn.insert(schema.scheduled_jobs).values(scheduled_jobs);
    });
  }
}
