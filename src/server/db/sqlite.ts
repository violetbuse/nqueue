import { Database, SqliteDB } from "@/server/db/index.ts";
import { ApiStorage } from "@/server/api/db/index.ts";
import { ApiStorageSqlite } from "@/server/api/db/sqlite/index.ts";
import { OrchestratorStorage } from "@/server/orchestrator/storage/index.ts";
import { OrchestratorStorageSqlite } from "@/server/orchestrator/storage/sqlite.ts";
import { RunnerCache, RunnerStorage } from "@/server/runner/storage/index.ts";
import {
  RunnerCacheSqlite,
  RunnerStorageSqlite,
} from "@/server/runner/storage/sqlite.ts";
import { Scheduler } from "@/server/scheduler/index.ts";
import { SchedulerSqlite } from "@/server/scheduler/sqlite.ts";

export class DatabaseSqlite implements Database {
  orchestrator_storage: OrchestratorStorage;
  runner_storage: RunnerStorage;
  runner_cache: RunnerCache;
  scheduler: Scheduler;
  api_storage: ApiStorage;

  constructor(db: SqliteDB) {
    this.orchestrator_storage = new OrchestratorStorageSqlite(db);
    this.runner_storage = new RunnerStorageSqlite(db);
    this.runner_cache = new RunnerCacheSqlite(db);
    this.scheduler = new SchedulerSqlite(db);
    this.api_storage = new ApiStorageSqlite(db);
  }

  get_orchestrator_storage(): OrchestratorStorage {
    return this.orchestrator_storage;
  }

  get_runner_storage(): RunnerStorage {
    return this.runner_storage;
  }

  get_runner_cache(): RunnerCache {
    return this.runner_cache;
  }

  get_scheduler(): Scheduler {
    return this.scheduler;
  }

  get_api_storage(): ApiStorage {
    return this.api_storage;
  }
}
