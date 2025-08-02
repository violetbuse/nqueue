import "better-sqlite3/build/Release/better-sqlite3.node";
import { ApiStorage } from "@/server/api/db/index.ts";
import { OrchestratorStorage } from "@/server/orchestrator/storage/index.ts";
import { RunnerCache, RunnerStorage } from "@/server/runner/storage/index.ts";
import { Scheduler } from "@/server/scheduler/index.ts";
import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { Database as SqliteDatabase } from "better-sqlite3";
import { sqlite_schema, postgres_schema } from "@/server/db/schemas/index.ts";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { Sql } from "postgres";

export type SqliteDB = BetterSQLite3Database<typeof sqlite_schema> & {
  $client: SqliteDatabase;
};

export type PostgresDB = PostgresJsDatabase<typeof postgres_schema> & {
  $client: Sql<{}>;
};

export interface Database {
  get_orchestrator_storage(): OrchestratorStorage;
  get_runner_storage(): RunnerStorage;
  get_runner_cache(): RunnerCache;
  get_scheduler(): Scheduler;
  get_api_storage(): ApiStorage;
}
