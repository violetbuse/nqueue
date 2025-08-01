import { OrchestratorStorage } from ".";
import { JobDescription, JobResult } from "../../types";

export class InMemoryOrchestratorStorage implements OrchestratorStorage {
  async get_jobs(): Promise<JobDescription[]> {
    //todo
  }

  async cancel_assignment(job_id: string): Promise<{ success: boolean }> {
    //todo
  }

  async report_error(
    job_id: string,
    error: string,
  ): Promise<{ success: boolean }> {
    //todo
  }

  async submit_job_result(result: JobResult): Promise<{ success: boolean }> {
    //todo
  }

  async submit_job_results(
    results: JobResult[],
  ): Promise<{ success: boolean }> {
    //todo
  }
}
