import { parentPort, workerData } from "node:worker_threads";
import { JobDescription, JobResult, worker_data_schema } from "@/server/types";
import fetch, { AbortError, RequestInit } from "node-fetch";
import { logger } from "@/server/logging";

export const worker_file = __filename;

const run_job = async (job: JobDescription): Promise<JobResult> => {
  logger.info(`Running job: ${job.job_id}`);
  try {
    const attempted_at = new Date();
    const timeout = job.timeout_ms;

    console.log(job);

    const request_init: RequestInit = {
      method: job.data.method,
      headers: job.data.headers,
      signal: AbortSignal.timeout(timeout),
    };

    if (job.data.body !== null) {
      request_init.body = job.data.body;
    }

    const fetch_request = await fetch(job.data.url, request_init);

    const completed = Date.now();
    const duration = completed - attempted_at.getTime();

    try {
      const response = await fetch_request.text();

      const headers = Object.fromEntries(fetch_request.headers.entries());

      return {
        job_id: job.job_id,
        planned_at: job.planned_at,
        attempted_at,
        duration_ms: duration,
        data: {
          status_code: fetch_request.status,
          headers,
          body: response,
        },
        timed_out: false,
        error: null,
      };
    } catch (error: any) {
      if (error instanceof AbortError) {
        return {
          job_id: job.job_id,
          planned_at: job.planned_at,
          attempted_at,
          duration_ms: duration,
          data: null,
          timed_out: true,
          error: null,
        };
      } else {
        const error_message =
          typeof error?.message === "string" ? error.message : "Unknown error";

        return {
          job_id: job.job_id,
          planned_at: job.planned_at,
          attempted_at,
          duration_ms: duration,
          data: null,
          timed_out: false,
          error: error_message,
        };
      }
    }
  } catch (error: any) {
    logger.error(`Error running job ${job.job_id}: ${error.message}`);
    return {
      job_id: job.job_id,
      planned_at: job.planned_at,
      attempted_at: new Date(),
      duration_ms: 0,
      data: null,
      timed_out: false,
      error:
        error instanceof Error ||
        ("message" in error && typeof error.message === "string")
          ? error.message
          : "Unknown error",
    };
  }
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
