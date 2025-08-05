import "better-sqlite3/build/Release/better-sqlite3.node";
import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { Database as SqliteDatabase } from "better-sqlite3";
import {
  sqlite_schema,
  postgres_schema,
  swim_sqlite_schema,
  runner_sqlite_schema,
} from "@/server/db/schemas";
import {
  migrate_postgres,
  migrate_sqlite,
  migrate_swim_sqlite,
  migrate_runner_sqlite,
} from "./migrations";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { Sql } from "postgres";

export type SqliteDB = BetterSQLite3Database<typeof sqlite_schema> & {
  $client: SqliteDatabase;
};

export type PostgresDB = PostgresJsDatabase<typeof postgres_schema> & {
  $client: Sql<{}>;
};

export {
  sqlite_schema,
  postgres_schema,
  swim_sqlite_schema,
  runner_sqlite_schema,
  migrate_postgres,
  migrate_sqlite,
  migrate_swim_sqlite,
  migrate_runner_sqlite,
};
