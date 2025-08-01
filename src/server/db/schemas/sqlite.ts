import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const cron_job = sqliteTable("cron_jobs", {
  id: text("id").primaryKey(),
  expression: text("cron_expression").notNull(),
  url: text("url").notNull(),
  method: text("method", {
    enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  }).notNull(),
  headers: text("headers", { mode: "json" })
    .$type<{ [key: string]: string }>()
    .notNull(),
  body: text("body").notNull(),
  metadata: text("metadata", { mode: "json" })
    .$type<{ [key: string]: string | number | boolean }>()
    .notNull(),
});
