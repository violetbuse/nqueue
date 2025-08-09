import { OpenAPIHandler } from "@orpc/openapi/node";
import { StandardHandlerPlugin } from "@orpc/server/standard";
import z from "zod";
import { api_contract } from "./contract";
import { ApiDriver } from "./driver";
import { SqliteDB } from "../db";
import { implement } from "@orpc/server";
import { sqlite_schema as schema } from "../db";
import { nanoid } from "nanoid";
import { validate_cron_expression } from "@/utils/validate-cron";
import { and, eq, gt, lt, max, notExists, sql } from "drizzle-orm";
import { http_method_schema } from "../types";
import { logger } from "../logging";

export class SqliteApi extends ApiDriver {
  constructor(private db: SqliteDB) {
    super();
  }

  override implement_routes(
    contract: typeof api_contract,
    plugins: StandardHandlerPlugin<{}>[],
  ): OpenAPIHandler<{}> {
    try {
      const os = implement(contract);

      const create_cron_job = os.create_cron_job.handler(async ({ input }) => {
        try {
          let next_run = new Date();
          const result = validate_cron_expression(input.expression);

          if (result[0]) {
            next_run = result[1].next().toDate();
          } else {
            throw new Error("Invalid cron expression: " + result[1]);
          }

          const new_cron_job = this.db
            .insert(schema.cron_jobs)
            .values({
              id: "cron_" + nanoid(),
              expression: input.expression,
              next_invocation_at: next_run,
              url: input.url,
              method: input.method,
              headers: input.headers,
              body: input.body,
              timeout_ms: input.timeout_ms,
            })
            .returning()
            .get();

          return {
            id: new_cron_job.id,
            expression: new_cron_job.expression,
            url: new_cron_job.url,
            method: new_cron_job.method,
            headers: new_cron_job.headers ?? {},
            body: new_cron_job.body,
            timeout_ms: new_cron_job.timeout_ms,
          };
        } catch (err: any) {
          logger.error(`Failed to create cron job: ${err.message}`);
          throw err;
        }
      });

      const update_cron_job = os.update_cron_job.handler(async ({ input }) => {
        let new_expression: string | undefined = undefined;
        let new_next_invocation_at: Date | undefined = undefined;

        if (input.expression) {
          const result = validate_cron_expression(input.expression);

          if (result[0]) {
            new_expression = input.expression;
            new_next_invocation_at = result[1].next().toDate();
          } else {
            throw new Error(`Invalid cron expression: ${input.expression}`);
          }
        }

        const cron_job = this.db
          .update(schema.cron_jobs)
          .set({
            expression: new_expression,
            next_invocation_at: new_next_invocation_at,
            url: input.url,
            method: input.method,
            headers: input.headers,
            body: input.body,
            timeout_ms: input.timeout_ms,
          })
          .where(eq(schema.cron_jobs.id, input.cron_id))
          .returning()
          .get();

        return {
          id: cron_job.id,
          expression: cron_job.expression,
          url: cron_job.url,
          method: cron_job.method,
          headers: cron_job.headers ?? {},
          body: cron_job.body,
          timeout_ms: cron_job.timeout_ms,
        };
      });

      const delete_cron_job = os.delete_cron_job.handler(async ({ input }) => {
        const job = await this.db.transaction(async (txn) => {
          await txn
            .delete(schema.scheduled_jobs)
            .where(
              and(
                eq(schema.scheduled_jobs.cron_id, input.cron_id),
                gt(
                  schema.scheduled_jobs.planned_at,
                  new Date(Date.now() + 60_000),
                ),
              ),
            );

          return txn
            .update(schema.cron_jobs)
            .set({
              disabled: true,
            })
            .where(eq(schema.cron_jobs.id, input.cron_id))
            .returning()
            .get();
        });

        return {
          id: job.id,
          expression: job.expression,
          url: job.url,
          method: job.method,
          headers: job.headers ?? {},
          body: job.body,
          timeout_ms: job.timeout_ms,
        };
      });

      const list_cron_jobs = os.list_cron_jobs.handler(async ({ input }) => {
        const limit = input.limit ?? 50;
        const offset = input.offset ?? 0;
        const totalRow = this.db
          .select({ count: sql`count(*)`.as("count") })
          .from(schema.cron_jobs)
          .get();
        const total = totalRow?.count !== undefined ? Number(totalRow.count as any) : 0;
        const rows = this.db
          .select()
          .from(schema.cron_jobs)
          .limit(limit)
          .offset(offset)
          .all();
        return {
          items: rows.map((job) => ({
            id: job.id,
            expression: job.expression,
            url: job.url,
            method: job.method,
            headers: job.headers ?? {},
            body: job.body,
            timeout_ms: job.timeout_ms,
          })),
          total,
          limit,
          offset,
        };
      });

      const get_cron_job = os.get_cron_job.handler(async ({ input }) => {
        const job = this.db
          .select()
          .from(schema.cron_jobs)
          .where(eq(schema.cron_jobs.id, input.cron_id))
          .get();

        if (!job) {
          return null;
        }

        return {
          id: job.id,
          expression: job.expression,
          url: job.url,
          method: job.method,
          headers: job.headers ?? {},
          body: job.body,
          timeout_ms: job.timeout_ms,
        };
      });

      const create_queue = os.create_queue.handler(async ({ input }) => {
        const queue = this.db
          .insert(schema.queues)
          .values({
            id: "queue_" + nanoid(),
            name: input.name,
            description: input.description,
            requests_per_period: input.request_count,
            period_length_seconds: input.time_period_seconds,
            next_invocation_at: new Date(),
          })
          .returning()
          .get();

        return {
          id: queue.id,
          name: queue.name,
          description: queue.description,
          requests_per_period: queue.requests_per_period,
          period_length_secs: queue.period_length_seconds,
          next_invocation_at: queue.next_invocation_at,
        };
      });

      const list_queues = os.list_queues.handler(async ({ input }) => {
        const limit = input.limit ?? 50;
        const offset = input.offset ?? 0;
        const totalRow = this.db
          .select({ count: sql`count(*)`.as("count") })
          .from(schema.queues)
          .get();
        const total = totalRow?.count !== undefined ? Number(totalRow.count as any) : 0;
        const rows = this.db
          .select()
          .from(schema.queues)
          .limit(limit)
          .offset(offset)
          .all();
        return {
          items: rows.map((queue) => ({
            id: queue.id,
            name: queue.name,
            description: queue.description,
            requests_per_period: queue.requests_per_period,
            period_length_secs: queue.period_length_seconds,
            next_invocation_at: queue.next_invocation_at,
          })),
          total,
          limit,
          offset,
        };
      });

      const get_queue = os.get_queue.handler(async ({ input }) => {
        const queue = this.db
          .select()
          .from(schema.queues)
          .where(eq(schema.queues.id, input.queue_id))
          .get();

        if (!queue) return null;

        return {
          id: queue.id,
          name: queue.name,
          description: queue.description,
          requests_per_period: queue.requests_per_period,
          period_length_secs: queue.period_length_seconds,
          next_invocation_at: queue.next_invocation_at,
        };
      });

      const update_queue = os.update_queue.handler(async ({ input }) => {
        const queue = this.db
          .update(schema.queues)
          .set({
            name: input.name,
            description: input.description,
            requests_per_period: input.request_count,
            period_length_seconds: input.time_period_seconds,
          })
          .where(eq(schema.queues.id, input.queue_id))
          .returning()
          .get();

        if (!queue) throw new Error("Queue not found.");

        return {
          id: queue.id,
          name: queue.name,
          description: queue.description,
          requests_per_period: queue.requests_per_period,
          period_length_secs: queue.period_length_seconds,
          next_invocation_at: queue.next_invocation_at,
        };
      });

      const delete_queue = os.delete_queue.handler(async ({ input }) => {
        const queue = await this.db.transaction(async (txn) => {
          await txn
            .delete(schema.scheduled_jobs)
            .where(
              and(
                eq(schema.scheduled_jobs.queue_id, input.queue_id),
                gt(
                  schema.scheduled_jobs.planned_at,
                  new Date(Date.now() + 60_000),
                ),
              ),
            );

          await txn
            .update(schema.messages)
            .set({ disabled: true })
            .where(
              and(
                eq(schema.messages.queue_id, input.queue_id),
                notExists(
                  txn
                    .select()
                    .from(schema.scheduled_jobs)
                    .where(
                      eq(schema.scheduled_jobs.message_id, schema.messages.id),
                    ),
                ),
              ),
            );

          return txn
            .update(schema.queues)
            .set({ disabled: true })
            .where(eq(schema.queues.id, input.queue_id))
            .returning()
            .get();
        });

        return {
          id: queue.id,
          name: queue.name,
          description: queue.description,
          requests_per_period: queue.requests_per_period,
          period_length_secs: queue.period_length_seconds,
          next_invocation_at: queue.next_invocation_at,
        };
      });

      const create_message = os.create_message.handler(async ({ input }) => {
        let scheduled_at: Date | undefined;
        let queue_id: string | undefined;

        if ("wait_seconds" in input.scheduling) {
          scheduled_at = new Date(
            Date.now() + input.scheduling.wait_seconds * 1000,
          );
        } else if ("wait_until" in input.scheduling) {
          scheduled_at = new Date(input.scheduling.wait_until * 1000);
        } else {
          queue_id = input.scheduling.queue_id;
        }

        const new_index = this.db.$with("current_index").as(
          this.db
            .select({
              value: sql`COALESCE(${max(schema.messages.queue_index)}, 0)`,
            })
            .from(schema.messages)
            .where(eq(schema.messages.queue_id, queue_id ?? "")),
        );

        const new_message = this.db
          .insert(schema.messages)
          .values({
            id: "message_" + nanoid(),
            url: input.url,
            method: input.method,
            headers: input.headers,
            body: input.body,
            timeout_ms: input.timeout_ms,
            scheduled_at: scheduled_at,
            queue_id: queue_id,
            queue_index: queue_id ? sql`(${new_index} + 1)` : undefined,
          })
          .returning()
          .get();

        return {
          id: new_message.id,
          url: new_message.url,
          method: new_message.method,
          headers: new_message.headers ?? {},
          body: new_message.body,
          timeout_ms: new_message.timeout_ms,
          scheduling: queue_id
            ? {
              queue_id,
            }
            : {
              wait_until: Math.floor(scheduled_at!.getTime() / 1000),
            },
        };
      });

      const list_messages = os.list_messages.handler(async ({ input }) => {
        const limit = input.limit ?? 50;
        const offset = input.offset ?? 0;
        const totalRow = this.db
          .select({ count: sql`count(*)`.as("count") })
          .from(schema.messages)
          .get();
        const total = totalRow?.count !== undefined ? Number(totalRow.count as any) : 0;
        const rows = this.db
          .select()
          .from(schema.messages)
          .limit(limit)
          .offset(offset)
          .all();
        return {
          items: rows.map((message) => ({
            id: message.id,
            url: message.url,
            method: message.method,
            headers: message.headers ?? {},
            body: message.body,
            timeout_ms: message.timeout_ms,
            scheduling: message.queue_id
              ? { queue_id: message.queue_id }
              : { wait_until: Math.floor(message.scheduled_at?.getTime()! / 1000) },
          })),
          total,
          limit,
          offset,
        };
      });

      const get_message = os.get_message.handler(async ({ input }) => {
        const message = this.db
          .select()
          .from(schema.messages)
          .where(eq(schema.messages.id, input.message_id))
          .get();

        if (!message) return null;

        return {
          id: message.id,
          url: message.url,
          method: message.method,
          headers: message.headers ?? {},
          body: message.body,
          timeout_ms: message.timeout_ms,
          scheduling: message.queue_id
            ? {
              queue_id: message.queue_id,
            }
            : {
              wait_until: message.scheduled_at?.getTime()! / 1000,
            },
        };
      });

      const get_scheduled_jobs = os.get_scheduled_jobs.handler(
        async ({ input: { planned_before, planned_after } }) => {
          const scheduled_jobs = await this.db
            .select({
              job_id: schema.scheduled_jobs.id,
              planned_at: schema.scheduled_jobs.planned_at,
              executed_at: schema.job_results.executed_at,
              timed_out: schema.job_results.timed_out,
              error: schema.job_results.error,
              response_status_code: schema.job_results.status_code,
              response_headers: schema.job_results.response_headers,
              response_body: schema.job_results.response_body,
              request_timeout_ms: sql<
                number | null
              >`COALESCE(${schema.cron_jobs.timeout_ms}, ${schema.messages.timeout_ms})`,
              request_url: sql<
                string | null
              >`COALESCE(${schema.cron_jobs.url}, ${schema.messages.url})`,
              request_method: sql<z.infer<
                typeof http_method_schema
              > | null>`COALESCE(${schema.cron_jobs.method}, ${schema.messages.method})`,
              request_headers: sql<string | null>`COALESCE(${schema.cron_jobs.headers}, ${schema.messages.headers})`,
              request_body: sql<
                string | null
              >`COALESCE(${schema.cron_jobs.body}, ${schema.messages.body})`,
            })
            .from(schema.scheduled_jobs)
            .leftJoin(
              schema.cron_jobs,
              eq(schema.cron_jobs.id, schema.scheduled_jobs.cron_id),
            )
            .leftJoin(
              schema.messages,
              eq(schema.messages.id, schema.scheduled_jobs.message_id),
            )
            .leftJoin(
              schema.job_results,
              eq(schema.job_results.id, schema.scheduled_jobs.id),
            )
            .where(
              and(
                planned_after
                  ? gt(
                    schema.scheduled_jobs.planned_at,
                    new Date(planned_after),
                  )
                  : undefined,
                planned_before
                  ? lt(
                    schema.scheduled_jobs.planned_at,
                    new Date(planned_before),
                  )
                  : undefined,
              ),
            );

          const result = scheduled_jobs.map((scheduled_job) => ({
            id: scheduled_job.job_id,
            planned_at: Math.floor(scheduled_job.planned_at.getTime() / 1000),
            timeout_ms: scheduled_job.request_timeout_ms!,
            request: {
              url: scheduled_job.request_url!,
              method: scheduled_job.request_method!,
              headers: JSON.parse(scheduled_job.request_headers ?? "{}"),
              body: scheduled_job.request_body,
            },
            response:
              scheduled_job.response_status_code !== null &&
                scheduled_job.response_headers !== null &&
                scheduled_job.executed_at !== null &&
                scheduled_job.timed_out !== null
                ? {
                  status_code: scheduled_job.response_status_code,
                  headers: scheduled_job.response_headers ?? {},
                  body: scheduled_job.response_body,
                  executed_at: Math.floor(scheduled_job.executed_at.getTime() / 1000),
                  timed_out: scheduled_job.timed_out,
                  error: scheduled_job.error,
                }
                : null,
          }));

          // logger.info(JSON.stringify(result, null, 2));

          return result;
        },
      );

      const get_scheduled_job = os.get_scheduled_job.handler(
        async ({ input }) => {
          const scheduled_job = this.db
            .select({
              job_id: schema.scheduled_jobs.id,
              planned_at: schema.scheduled_jobs.planned_at,
              executed_at: schema.job_results.executed_at,
              timed_out: schema.job_results.timed_out,
              error: schema.job_results.error,
              response_status_code: schema.job_results.status_code,
              response_headers: schema.job_results.response_headers,
              response_body: schema.job_results.response_body,
              request_timeout_ms: sql<
                number | null
              >`COALESCE(${schema.cron_jobs.timeout_ms}, ${schema.messages.timeout_ms})`,
              request_url: sql<
                string | null
              >`COALESCE(${schema.cron_jobs.url}, ${schema.messages.url})`,
              request_method: sql<z.infer<
                typeof http_method_schema
              > | null>`COALESCE(${schema.cron_jobs.method}, ${schema.messages.method})`,
              request_headers: sql<string | null>`COALESCE(${schema.cron_jobs.headers}, ${schema.messages.headers})`,
              request_body: sql<
                string | null
              >`COALESCE(${schema.cron_jobs.body}, ${schema.messages.body})`,
            })
            .from(schema.scheduled_jobs)
            .where(eq(schema.scheduled_jobs.id, input.job_id))
            .leftJoin(
              schema.cron_jobs,
              eq(schema.cron_jobs.id, schema.scheduled_jobs.cron_id),
            )
            .leftJoin(
              schema.messages,
              eq(schema.messages.id, schema.scheduled_jobs.message_id),
            )
            .leftJoin(
              schema.job_results,
              eq(schema.job_results.id, schema.scheduled_jobs.id),
            )
            .get();

          if (
            !scheduled_job ||
            !scheduled_job.request_url ||
            !scheduled_job.request_method ||
            !scheduled_job.request_timeout_ms
          ) {
            return null;
          }

          const result = {
            id: scheduled_job.job_id,
            planned_at: Math.floor(scheduled_job.planned_at.getTime() / 1000),
            timeout_ms: scheduled_job.request_timeout_ms,
            request: {
              url: scheduled_job.request_url,
              method: scheduled_job.request_method,
              headers: JSON.parse(scheduled_job.request_headers ?? "{}"),
              body: scheduled_job.request_body,
            },
            response:
              scheduled_job.response_status_code !== null &&
                scheduled_job.response_headers !== null &&
                scheduled_job.executed_at !== null &&
                scheduled_job.timed_out !== null
                ? {
                  status_code: scheduled_job.response_status_code,
                  headers: scheduled_job.response_headers ?? {},
                  body: scheduled_job.response_body,
                  executed_at: Math.floor(scheduled_job.executed_at.getTime() / 1000),
                  timed_out: scheduled_job.timed_out,
                  error: scheduled_job.error,
                }
                : null,
          };

          // logger.info(JSON.stringify(result, null, 2));

          return result;
        },
      );

      const router = os.router({
        create_cron_job,
        list_cron_jobs,
        update_cron_job,
        delete_cron_job,
        get_cron_job,
        create_queue,
        list_queues,
        get_queue,
        update_queue,
        delete_queue,
        create_message,
        list_messages,
        get_message,
        get_scheduled_jobs,
        get_scheduled_job,
      });

      return new OpenAPIHandler(router, {
        plugins,
      });
    } catch (err: any) {
      logger.error(
        `Error implementing routes for api: ${err.message ?? "unknown error"}`,
      );
      throw err;
    }
  }
}
