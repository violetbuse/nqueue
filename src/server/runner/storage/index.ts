import { JobDescription, JobResult } from "@/server/types.ts";

export interface RunnerStorage {
  put_job(job: JobDescription): Promise<void>;
  get_jobs(between: [Date, Date]): Promise<JobDescription[]>;
  delete_job(job_id: string): Promise<void>;
}

export interface RunnerCache {
  set(job_result: JobResult, inserted_at: Date): Promise<void>;
  get_older_than(older_than: Date): Promise<string[]>;
  get(job_id: string): Promise<JobResult | null>;
  delete(job_id: string): Promise<void>;
}
