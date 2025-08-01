import { json, pgTable, text, varchar } from "drizzle-orm/pg-core";

export const cron_job = pgTable("cron_jobs", {
  id: varchar("id", { length: 255 }).primaryKey(),
  expression: varchar("expression", { length: 255 }).notNull(),
  url: text("url").notNull(),
  method: varchar("method", {
    length: 16,
    enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  }).notNull(),
  headers: json().$type<{ [key: string]: string }>().notNull(),
  body: text("body").notNull(),
  metadata: json()
    .$type<{ [key: string]: string | number | boolean }>()
    .notNull(),
});
