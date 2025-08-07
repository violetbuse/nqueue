import { drizzle } from "drizzle-orm/better-sqlite3";
import { sqlite_schema as schema } from "./schemas";
import { migrate_sqlite } from "./migrations";

export const create_sqlite_db = (db_url: string) => {
  const db = drizzle(db_url, {
    schema,
  });

  db.$client.pragma("journal_mode = WAL");

  migrate_sqlite(db);

  return db;
};
