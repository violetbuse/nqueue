import { SchedulerDriver } from ".";
import { SqliteDB } from "../db";
import { logger } from "../logging";
import { sqlite_schema as schema } from "../db";
import {
  and,
  asc,
  count,
  eq,
  or,
  gt,
  lt,
  isNotNull,
  isNull,
  min,
} from "drizzle-orm";
import { nanoid } from "nanoid";
import { CronExpressionParser } from "cron-parser";
import { compute_next_invocation_at } from "@/utils/rate-limit";

export class SqliteScheduler extends SchedulerDriver {
  constructor(private db: SqliteDB) {
    super();
  }

  override drive_in_parallel(): boolean {
    return false;
  }

  override async schedule_crons(): Promise<void> {
    try {
      this.db.transaction((txn) => {
        const upcoming_scheduled_jobs = txn
          .select({
            cron_id: schema.scheduled_jobs.cron_id,
            scheduled_jobs: count(schema.scheduled_jobs.id).as(
              "scheduled_jobs_count"
            ),
          })
          .from(schema.scheduled_jobs)
          .where(
            and(
              isNull(schema.scheduled_jobs.assigned_to),
              isNotNull(schema.scheduled_jobs.cron_id)
            )
          )
          .groupBy(schema.scheduled_jobs.cron_id)
          .as("upcoming_scheduled_jobs");

        const upcoming_crons = txn
          .select({
            id: schema.cron_jobs.id,
            next_invocation_at: schema.cron_jobs.next_invocation_at,
            upcoming_scheduled_jobs: upcoming_scheduled_jobs.scheduled_jobs,
            expression: schema.cron_jobs.expression,
          })
          .from(schema.cron_jobs)
          .orderBy(asc(schema.cron_jobs.next_invocation_at))
          .leftJoin(
            upcoming_scheduled_jobs,
            eq(schema.cron_jobs.id, upcoming_scheduled_jobs.cron_id)
          )
          .where(
            or(
              lt(upcoming_scheduled_jobs.scheduled_jobs, 5),
              isNull(upcoming_scheduled_jobs.scheduled_jobs)
            )
          )
          .all();

        const new_scheduled_jobs = upcoming_crons.map(
          (cron): typeof schema.scheduled_jobs.$inferInsert => ({
            id: "scheduled_" + nanoid(),
            planned_at: cron.next_invocation_at,
            cron_id: cron.id,
          })
        );

        if (new_scheduled_jobs.length === 0) {
          return;
        }

        txn.insert(schema.scheduled_jobs).values(new_scheduled_jobs).execute();

        upcoming_crons.map((cron) => {
          const cron_iter = CronExpressionParser.parse(cron.expression, {
            startDate: cron.next_invocation_at,
            currentDate: cron.next_invocation_at.getTime() + 5,
          });

          let next = cron_iter.next().toDate();

          if (next.getTime() === cron.next_invocation_at.getTime()) {
            next = cron_iter.next().toDate();
          }

          txn
            .update(schema.cron_jobs)
            .set({
              next_invocation_at: next,
            })
            .where(eq(schema.cron_jobs.id, cron.id))
            .execute();
        });
      });
    } catch (err: any) {
      logger.error(`Error scheduling cron jobs: ${err.message}`);
    }
  }

  override async schedule_messages(): Promise<void> {
    this.db.transaction((txn) => {
      const unscheduled_messages = txn
        .select()
        .from(schema.messages)
        .leftJoin(
          schema.scheduled_jobs,
          eq(schema.scheduled_jobs.message_id, schema.messages.id)
        )
        .where(
          and(
            isNotNull(schema.messages.scheduled_at),
            isNull(schema.scheduled_jobs.id)
          )
        )
        .all();

      const new_scheduled_jobs = unscheduled_messages
        .filter((d) => !!d.messages.scheduled_at)
        .map((data): typeof schema.scheduled_jobs.$inferInsert => ({
          id: "scheduled_" + nanoid(),
          planned_at: data.messages.scheduled_at!,
          message_id: data.messages.id,
        }));

      if (new_scheduled_jobs.length === 0) {
        return;
      }

      txn.insert(schema.scheduled_jobs).values(new_scheduled_jobs).execute();
    });
  }

  override async schedule_queues(): Promise<void> {
    this.db.transaction((txn) => {
      const queues = txn
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
          eq(schema.messages.queue_id, schema.queues.id)
        )
        .leftJoin(
          schema.scheduled_jobs,
          eq(schema.scheduled_jobs.message_id, schema.messages.id)
        )
        .where(and(isNull(schema.scheduled_jobs.id)))
        .orderBy(asc(schema.queues.next_invocation_at))
        .groupBy(schema.queues.id)
        .all();

      if (queues.length === 0) {
        return;
      }

      let scheduled_jobs: (typeof schema.scheduled_jobs.$inferInsert)[] = [];

      queues.map((queue) => {
        const scheduled_most_recently = txn
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
                    queue.period_length_seconds * 2 * 1000
                )
              )
            )
          )
          .orderBy(asc(schema.scheduled_jobs.planned_at))
          .all();

        const waiting_messages = txn
          .select()
          .from(schema.messages)
          .leftJoin(
            schema.scheduled_jobs,
            eq(schema.messages.id, schema.scheduled_jobs.message_id)
          )
          .where(
            and(
              isNull(schema.scheduled_jobs.id),
              eq(schema.messages.queue_id, queue.id)
            )
          )
          .orderBy(asc(schema.messages.queue_index))
          .limit(10)
          .all();

        let invocations = scheduled_most_recently
          .map((j) => j.planned_at)
          .filter(
            (d) => d > new Date(Date.now() - queue.period_length_seconds * 1000)
          );

        for (const { messages: message } of waiting_messages) {
          const next_invocation_at = compute_next_invocation_at(
            {
              requests_per_period: queue.requests_per_period,
              period_in_seconds: queue.period_length_seconds,
            },
            invocations,
            invocations[0] ?? new Date()
          );

          const new_scheduled_job: typeof schema.scheduled_jobs.$inferInsert = {
            id: "scheduled_" + nanoid(),
            queue_id: queue.id,
            message_id: message.id,
            planned_at: next_invocation_at,
          };

          scheduled_jobs.push(new_scheduled_job);
          invocations.push(next_invocation_at);
        }
      });

      if (scheduled_jobs.length === 0) {
        return;
      }

      txn.insert(schema.scheduled_jobs).values(scheduled_jobs).execute();
    });
  }
}
