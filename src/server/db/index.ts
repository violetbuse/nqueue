import { OrchestratorStorage } from "../orchestrator/storage";
import { RunnerCache, RunnerStorage } from "../runner/storage";
import { Scheduler } from "../scheduler";

export interface Database {
  get_orchestrator_storage(): OrchestratorStorage;
  get_runner_storage(): RunnerStorage;
  get_runner_cache(): RunnerCache;
  get_scheduler(): Scheduler;
}
