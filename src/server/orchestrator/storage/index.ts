import { JobDescription, JobResult } from "../../types";

export interface OrchestratorStorage {
  get_jobs(): Promise<JobDescription[]>;
  cancel_assignment(job_id: string): Promise<{ success: boolean }>;
  report_error(job_id: string, error: string): Promise<{ success: boolean }>;
  submit_job_result(result: JobResult): Promise<{ success: boolean }>;
  submit_job_results(results: JobResult[]): Promise<{ success: boolean }>;
}
