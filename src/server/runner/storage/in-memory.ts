import { RunnerStorage, RunnerCache } from ".";
import { JobDescription, JobResult } from "../../types";

export class InMemoryRunnerStorage implements RunnerStorage {
  jobs: Map<string, [Date, JobDescription]> = new Map();
  execution_date_index: Map<Date, Set<string>> = new Map();

  async put_job(execute_at: Date, job: JobDescription): Promise<void> {
    this.jobs.set(job.job_id, [execute_at, job]);

    let set = this.execution_date_index.get(execute_at);

    if (!set) {
      set = new Set();
      this.execution_date_index.set(execute_at, set);
    }

    set.add(job.job_id);
  }

  async get_jobs([after, before]: [Date, Date]): Promise<JobDescription[]> {
    let jobs: JobDescription[] = [];

    for (const [
      execution_date,
      job_id_set,
    ] of this.execution_date_index.entries()) {
      if (execution_date > after && execution_date <= before) {
        const job_ids = Array.from(job_id_set);
        for (const job_id of job_ids) {
          const [_, job] = this.jobs.get(job_id) ?? [null, null];
          if (job) {
            jobs.push(job);
          }
        }
      }
    }

    return jobs;
  }

  async delete_job(job_id: string): Promise<void> {
    const [execute_at, _job] = this.jobs.get(job_id) ?? [null, null];

    this.jobs.delete(job_id);
    if (execute_at) {
      this.execution_date_index.get(execute_at)?.delete(job_id);
    }
  }
}

export class InMemoryRunnerCache implements RunnerCache {
  cache: Map<string, [Date, JobResult]> = new Map();
  inserted_date_idx: Map<Date, Set<string>> = new Map();

  async set(
    job_id: string,
    job_result: JobResult,
    inserted_at: Date,
  ): Promise<void> {
    this.cache.set(job_id, [inserted_at, job_result]);

    let set = this.inserted_date_idx.get(inserted_at);

    if (!set) {
      set = new Set();
      this.inserted_date_idx.set(inserted_at, set);
    }

    set.add(job_id);
  }

  async get_older_than(older_than: Date): Promise<string[]> {
    const job_ids: string[] = [];

    for (const [inserted_at, job_ids_set] of this.inserted_date_idx.entries()) {
      if (inserted_at < older_than) {
        job_ids.push(...Array.from(job_ids_set));
      }
    }

    return job_ids;
  }

  async get(job_id: string): Promise<JobResult | null> {
    const [_, job_result] = this.cache.get(job_id) ?? [null, null];
    return job_result;
  }

  async delete(job_id: string): Promise<void> {
    const [execute_at, _job] = this.cache.get(job_id) ?? [null, null];

    this.cache.delete(job_id);
    if (execute_at) {
      this.inserted_date_idx.get(execute_at)?.delete(job_id);
    }
  }
}
