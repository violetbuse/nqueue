import { and, isNull, isNotNull, or, sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const assigned_jobs = sqliteTable("assigned_jobs", {
  id: text("id").notNull().primaryKey(),
  planned_at: integer("planned_at", { mode: "timestamp_ms" }).notNull(),
  request_url: text("request_url").notNull(),
  request_method: text("request_method", {
    enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  }).notNull(),
  request_headers: text("request_headers", { mode: "json" })
    .$type<Record<string, string>>()
    .notNull(),
  request_body: text("request_body").notNull(),
  timeout_ms: integer("timeout_ms").notNull(),
});

export const cached_job_results = sqliteTable(
  "cached_job_results",
  {
    id: text("id").notNull().primaryKey(),
    planned_at: integer("planned_at", { mode: "timestamp_ms" }).notNull(),
    attempted_at: integer("attempted_at", { mode: "timestamp_ms" }).notNull(),
    duration_ms: integer("duration_ms").notNull(),
    result_status_code: integer("result_status_code"),
    result_headers: text("result_headers", { mode: "json" }).$type<
      Record<string, string>
    >(),
    result_body: text("result_body", { mode: "json" }).$type<
      Record<string, string>
    >(),
    timed_out: integer("timed_out", { mode: "boolean" }).notNull(),
    error: text("error"),
    cached_at: integer("cached_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    check(
      "cached_job_results_status_headers_body_all_null_or_none_null",
      sql`${or(
        and(
          isNull(table.result_status_code),
          isNull(table.result_headers),
          isNull(table.result_body),
        ),
        and(
          isNotNull(table.result_status_code),
          isNotNull(table.result_headers),
          isNotNull(table.result_body),
        ),
      )}`,
    ),
  ],
);
