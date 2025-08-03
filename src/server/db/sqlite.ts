import { Database, SqliteDB } from "@/server/db";
import { ApiStorage } from "@/server/api/db";
import { ApiStorageSqlite } from "@/server/api/db/sqlite";
import { OrchestratorStorage } from "@/server/orchestrator/storage";
import { OrchestratorStorageSqlite } from "@/server/orchestrator/storage/sqlite";
import { RunnerCache, RunnerStorage } from "@/server/runner/storage";
import {
  RunnerCacheSqlite,
  RunnerStorageSqlite,
} from "@/server/runner/storage/sqlite";
import { SchedulerDriver } from "@/server/scheduler";
import { SchedulerSqlite } from "@/server/scheduler/sqlite";

export class DatabaseSqlite implements Database {
  orchestrator_storage: OrchestratorStorage;
  runner_storage: RunnerStorage;
  runner_cache: RunnerCache;
  scheduler: SchedulerDriver;
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

  get_scheduler(): SchedulerDriver {
    return this.scheduler;
  }

  get_api_storage(): ApiStorage {
    return this.api_storage;
  }
}
