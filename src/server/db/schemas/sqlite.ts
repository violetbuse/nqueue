import { and, isNotNull, isNull, or, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

const request_method = text("method", {
  enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
}).notNull();

const headers = text("headers", { mode: "json" }).$type<{
  [key: string]: string;
}>();
const metadata = text("metadata", { mode: "json" }).$type<{
  [key: string]: string | number | boolean;
}>();

export const cron_jobs = sqliteTable(
  "cron_jobs",
  {
    id: text("id").notNull().primaryKey(),
    expression: text("expression").notNull(),
    url: text("url").notNull(),
    method: request_method.notNull(),
    headers: headers,
    body: text("body"),
    metadata: metadata,
    timeout_ms: integer("timeout_ms").notNull(),
    next_invocation_at: integer("next_invocation_at", {
      mode: "timestamp_ms",
    }).notNull(),
  },
  (table) => [
    index("cron_jobs_next_invocation_at_idx").on(table.next_invocation_at),
  ],
);

export const queues = sqliteTable("queues", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  description: text("description"),
  requests_per_period: integer("requests_per_period").notNull(),
  period_length_seconds: integer("period_length_seconds").notNull(),
});

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").notNull().primaryKey(),
    url: text("url").notNull(),
    method: request_method.notNull(),
    headers: headers,
    metadata: metadata,
    body: text("body"),
    timeout_ms: integer("timeout_ms").notNull(),
    queue_id: text("queue_id").references(() => queues.id),
    queue_index: integer("queue_index"),
    scheduled_at: integer("scheduled_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    unique("messages_queue_id_queue_index_unique_idx").on(
      table.queue_id,
      table.queue_index,
    ),
    index("messages_scheduled_at_idx").on(table.scheduled_at),
    check(
      "valid_scheduling",
      sql`${or(
        and(
          isNull(table.scheduled_at),
          isNotNull(table.queue_id),
          isNotNull(table.queue_index),
        ),
        and(
          isNotNull(table.scheduled_at),
          isNull(table.queue_id),
          isNull(table.queue_index),
        ),
      )}`,
    ),
  ],
);

export const scheduled_jobs = sqliteTable("scheduled_jobs", {
  id: text("id").notNull().primaryKey(),
  planned_at: integer("planned_at", { mode: "timestamp_ms" }).notNull(),
  url: text("url").notNull(),
  method: request_method.notNull(),
  headers: headers,
  metadata: metadata,
  body: text("body"),
  cron_id: text("cron_id").references(() => cron_jobs.id),
  message_id: text("message_id").references(() => messages.id),
  queue_id: text("queue_id").references(() => queues.id),
});

export const job_result = sqliteTable("job_results", {
  id: text("id")
    .notNull()
    .primaryKey()
    .references(() => scheduled_jobs.id),
  status_code: integer("status_code"),
  response_headers: headers,
  response_body: text("response_body"),
  executed_at: integer("executed_at", { mode: "timestamp_ms" }),
  duration_ms: integer("duration_ms"),
  error: text("error"),
  timed_out: integer("timed_out", { mode: "boolean" }).default(false),
});
