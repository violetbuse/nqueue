import { OrchestratorStorage } from "../orchestrator/storage";
import { RunnerCache, RunnerStorage } from "../runner/storage";

export interface Database {
  get_orchestrator_storage(): OrchestratorStorage;
  get_runner_storage(): RunnerStorage;
  get_runner_cache(): RunnerCache;
}
