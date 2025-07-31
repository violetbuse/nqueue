import { JobDescription, JobResult } from "../types";

export interface OrchestratorStorage {
  get_jobs(): Promise<JobDescription[]>;
  submit_job_result(result: JobResult): Promise<{ success: boolean }>;
}
