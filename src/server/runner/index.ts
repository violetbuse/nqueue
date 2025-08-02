import type { Express } from "express";
import type { RunnerCache, RunnerStorage } from "./storage";
import {
  job_result_schema,
  JobDescription,
  JobResult,
  WorkerData,
} from "../types";
import fetch from "node-fetch";
import _ from "lodash";

import { create_client as create_orchestrator_client } from "../orchestrator";
import { Worker } from "node:worker_threads";
import { worker_file } from "../worker";
import { Swim } from "../swim";
import { logger } from "../logging";

type RunnerConfig = {
  storage: RunnerStorage;
  cache: RunnerCache;
  swim: Swim | null;
  orchestrator_address: string | (() => string) | (() => Promise<string>);
  job_result_invalidation_timeout: number;
  interval: number;
};

const handle_cache_job_result = async (config: RunnerConfig, body: unknown) => {
  try {
    const job_result = await job_result_schema.parseAsync(body);
    await config.cache.set(job_result, new Date());
  } catch (error: any) {
    logger.error(`Error caching job result: ${error}`);
  }
};

const cache_job_result = async (
  address: string,
  job_result: JobResult,
): Promise<boolean> => {
  try {
    const result = await fetch(`${address}/runner/cache`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(job_result),
    });
    return result.ok;
  } catch (error) {
    logger.error(`Error sending job result to cache ${address}: ${error}`);
    return false;
  }
};

const handle_clear_job_result_from_cache = async (
  config: RunnerConfig,
  job_id: string,
) => {
  try {
    await config.cache.delete(job_id);
  } catch (error) {
    logger.error(`Error clearing job result from cache ${job_id}: ${error}`);
  }
};

const clear_job_result_from_cache = async (
  address: string,
  job_id: string,
): Promise<boolean> => {
  try {
    const result = await fetch(`${address}/runner/cache/${job_id}`, {
      method: "DELETE",
    });
    return result.ok;
  } catch (error) {
    logger.error(`Error clearing job result from cache ${address}: ${error}`);
    return false;
  }
};

const register_runner_handlers = (app: Express, config: RunnerConfig) => {
  app.post("/runner/cache", async (req, res) => {
    try {
      await handle_cache_job_result(config, req.body);
      res.status(200).end();
    } catch (error: any) {
      logger.error(`Error caching job result: ${error}`);
      res.status(500).send();
    }
  });

  app.delete("/runner/cache/:job_id", async (req, res) => {
    try {
      if (typeof req.params.job_id !== "string") {
        throw new Error("Invalid job ID");
      }

      await handle_clear_job_result_from_cache(config, req.params.job_id);
      res.status(200).end();
    } catch (error: any) {
      logger.error(`Error clearing job result from cache: ${error}`);
      res.status(500).send();
    }
  });
};

const submit_others_job_results = async (config: RunnerConfig) => {
  const to_submit = await config.cache.get_older_than(
    new Date(Date.now() - config.job_result_invalidation_timeout),
  );

  const orchestrator = await create_orchestrator_client(
    config.orchestrator_address,
  );

  if (to_submit.length === 0) {
    return;
  }

  if (to_submit.length === 1) {
    const job_id = to_submit[0];

    if (!job_id) {
      throw new Error("Invalid job ID");
    }

    const job_result = await config.cache.get(job_id);

    if (!job_result) {
      throw new Error("Job result not found");
    }

    const { success } = await orchestrator.submit_job_result(job_result);

    if (success) {
      await config.cache.delete(job_id);
    }
  } else {
    const results = (await Promise.all(to_submit.map(config.cache.get))).filter(
      (r) => !!r,
    );

    const batch_size = 20;
    const batches = _.chunk(results, batch_size);

    await Promise.all(
      batches.map(async (batch) => {
        const { success } = await orchestrator.submit_job_results(batch);

        if (success) {
          await Promise.all(
            batch.map(async (job_result) => {
              await config.cache.delete(job_result.job_id);
            }),
          );
        }
      }),
    );
  }
};

const poll_new_jobs = async (config: RunnerConfig) => {
  try {
    const orchestrator = await create_orchestrator_client(
      config.orchestrator_address,
    );

    const jobs = await orchestrator.assign_jobs();

    if (jobs) {
      await Promise.all(
        jobs.map(async (j) => {
          await config.storage.put_job(j);
        }),
      );
    }

    logger.info(`Polled ${jobs?.length ?? 0} new jobs`);
  } catch (error) {
    logger.error(`Error polling new jobs: ${error}`);
  }
};

let last_execution: Date = new Date(0);

const execute_jobs = async (config: RunnerConfig) => {
  const orchestrator = await create_orchestrator_client(
    config.orchestrator_address,
  );

  try {
    const current_execution = new Date();
    const jobs = await config.storage.get_jobs([
      last_execution,
      current_execution,
    ]);
    last_execution = current_execution;

    for (const job of jobs) {
      const time_until_execution = Math.max(job.planned_at - Date.now(), 0);

      setTimeout(async (job) => {
        try {
          const result = await execute_job(job, config);
          await config.storage.delete_job(job.job_id);

          let replica_runners: string[] = [];

          if (config.swim) {
            const nodes = config.swim
              .get_alive_nodes()
              .filter((n) => n.tags.includes("runner"))
              .map((n) => n.address)
              .slice(0, 3);

            replica_runners = nodes;
          }

          await Promise.all(
            replica_runners.map(async (n) => {
              try {
                const runner = await create_client(n);
                await runner.cache_job_result(result);
              } catch (error) {
                logger.error(`Error caching job result on ${n}: ${error}`);
              }
            }),
          );

          const { success } = await orchestrator.submit_job_result(result);

          if (success) {
            await Promise.all(
              replica_runners.map(async (n) => {
                try {
                  const runner = await create_client(n);
                  await runner.invalidate_job_result(job.job_id);
                } catch (error) {
                  logger.error(
                    `Error invalidating job result on ${n}: ${error}`,
                  );
                }
              }),
            );
          } else {
            logger.error(`Error submitting job result ${job.job_id}`);
          }
        } catch (error: any) {
          logger.error(
            `Error executing job ${job.job_id}: ${error?.message ?? "<unknown error>"}`,
          );

          await orchestrator.report_error(
            job.job_id,
            error?.message ?? "<unknown error>",
          );
        }
      }, time_until_execution);
    }
  } catch (error: any) {
    logger.error(`Error executing jobs: ${error}`);
  }
};

const execute_job = async (
  job: JobDescription,
  _config: RunnerConfig,
): Promise<JobResult> => {
  const worker_data: WorkerData = {
    worker_type: "run_job",
    job,
  };
  const worker = new Worker(worker_file, {
    workerData: worker_data,
  });

  return new Promise<JobResult>((resolve, reject) => {
    worker.on("message", (message) => {
      const worker_result = job_result_schema.safeParse(message);

      if (worker_result.success) {
        resolve(worker_result.data);
      } else {
        reject(new Error(`Invalid job result: ${worker_result.error}`));
      }
    });

    worker.on("error", (error) => {
      logger.error(`Error executing job ${job.job_id}: ${error}`);
      reject(new Error(`Error executing job ${job.job_id}: ${error}`));
    });

    worker.on("messageerror", (error) => {
      logger.error(`Error receiving job_result ${job.job_id}: ${error}`);
      reject(new Error(`Error receiving job_result ${job.job_id}: ${error}`));
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        logger.error(`Error executing job ${job.job_id}`);
        reject(new Error(`Worker exited with code ${code}`));
      }
    });
  });
};

const driver = async (config: RunnerConfig) => {
  await Promise.all([
    submit_others_job_results(config),
    poll_new_jobs(config),
    execute_jobs(config),
  ]);
};

let interval_id: NodeJS.Timeout | null = null;

export const start_runner = (app: Express, config: RunnerConfig) => {
  register_runner_handlers(app, config);

  if (interval_id) {
    clearInterval(interval_id);
  }

  interval_id = setInterval(async () => {
    try {
      await driver(config);
    } catch (error) {
      logger.error(`Error in runner driver: ${error}`);
    }
  }, config.interval);
};

export const create_client = async (address: string) => {
  return {
    cache_job_result: async (job_result: JobResult) =>
      cache_job_result(address, job_result),
    invalidate_job_result: async (job_id: string) =>
      await clear_job_result_from_cache(address, job_id),
  };
};
