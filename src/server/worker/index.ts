import { parentPort, workerData } from "node:worker_threads";
import { JobDescription, JobResult, worker_data_schema } from "../types";

export const worker_file = __filename;

const run_job = async (job: JobDescription): Promise<JobResult> => {
  console.log(`Running job: ${job.job_id}`);
};

export const run_worker = async () => {
  const worker_data: unknown = workerData;
  const data = await worker_data_schema.parseAsync(worker_data);

  switch (data.worker_type) {
    case "run_job": {
      parentPort?.postMessage(await run_job(data.job));
      break;
    }
  }
};
