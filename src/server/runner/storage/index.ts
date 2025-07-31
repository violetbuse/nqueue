import { JobResult } from "../../types";

export interface RunnerStorage {}

export interface RunnerCache {
  set: (
    job_id: string,
    job_result: JobResult,
    inserted_at: Date,
  ) => Promise<void>;
  get_older_than: (older_than: Date) => Promise<string[]>;
  get: (job_id: string) => Promise<JobResult | null>;
  delete: (job_id: string) => Promise<void>;
}
