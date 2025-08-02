import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const request_method = text("method", {
  enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
}).notNull();

const headers = text("headers", { mode: "json" }).$type<{
  [key: string]: string;
}>();
const metadata = text("metadata", { mode: "json" }).$type<{
  [key: string]: string | number | boolean;
}>();

export const cron_job = sqliteTable("cron_jobs", {
  id: text("id").primaryKey(),
  expression: text("cron_expression").notNull(),
  url: text("url").notNull(),
  method: request_method.notNull(),
  headers: headers.notNull(),
  body: text("body").notNull(),
  metadata: metadata.notNull(),
});

export const runner_jobs = sqliteTable(
  "runner_jobs",
  {
    job_id: text("job_id").primaryKey(),
    planned_at: integer("planned_at", { mode: "timestamp_ms" }).notNull(),
    url: text("url").notNull(),
    method: request_method.notNull(),
    headers: headers.notNull(),
    body: text("body").notNull(),
    timeout_ms: integer("timeout_ms").notNull(),
  },
  (table) => [index("runner_jobs_planned_at_idx").on(table.planned_at)],
);

export const runner_results_cache = sqliteTable(
  "runner_results_cache",
  {
    job_id: text("job_id").primaryKey(),
    inserted_at: integer("inserted_at", { mode: "timestamp_ms" }).notNull(),
    planned_at: integer("planned_at", { mode: "timestamp_ms" }).notNull(),
    attempted_at: integer("attempted_at", { mode: "timestamp_ms" }).notNull(),
    duration_ms: integer("duration_ms").notNull(),
    status_code: integer("status_code"),
    headers: headers,
    body: text("body"),
    timed_out: integer("timed_out", { mode: "boolean" })
      .notNull()
      .default(false),
    error: text("error"),
  },
  (table) => [
    index("runner_results_cache_inserted_at_idx").on(table.inserted_at),
    index("runner_results_cache_planned_at_idx").on(table.planned_at),
    index("runner_results_cache_attempted_at_idx").on(table.attempted_at),
  ],
);
