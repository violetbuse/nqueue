import { Database } from ".";
import { OrchestratorStorage } from "../orchestrator/storage";
import { InMemoryOrchestratorStorage } from "../orchestrator/storage/in-memory";
import { RunnerStorage, RunnerCache } from "../runner/storage";
import {
  InMemoryRunnerStorage,
  InMemoryRunnerCache,
} from "../runner/storage/in-memory";

export class InMemoryDB implements Database {
  private orchestrator_storage: InMemoryOrchestratorStorage;
  private runner_storage: InMemoryRunnerStorage;
  private runner_cache: InMemoryRunnerCache;

  constructor() {
    this.orchestrator_storage = new InMemoryOrchestratorStorage();
    this.runner_storage = new InMemoryRunnerStorage();
    this.runner_cache = new InMemoryRunnerCache();
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
}
