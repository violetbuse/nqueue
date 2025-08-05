import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const assigned_jobs = sqliteTable("assigned_jobs", {
  id: text("id").notNull().primaryKey(),
});
