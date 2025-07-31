import type { Express } from "express";
import type { RunnerCache, RunnerStorage } from "./storage";
import { job_result_schema, JobResult } from "../types";
import fetch from "node-fetch";
import _ from "lodash";

import { create_client as create_orchestrator_client } from "../orchestrator";

type RunnerConfig = {
  storage: RunnerStorage;
  cache: RunnerCache;
  orchestrator_address: string;
  job_result_invalidation_timeout: number;
  interval: number;
};

const handle_cache_job_result = async (config: RunnerConfig, body: unknown) => {
  try {
    const job_result = await job_result_schema.parseAsync(body);
    await config.cache.set(job_result.job_id, job_result, new Date());
  } catch (error: any) {
    console.error(`Error caching job result: ${error}`);
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
    console.error(`Error sending job result to cache ${address}: ${error}`);
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
    console.error(`Error clearing job result from cache ${job_id}: ${error}`);
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
    console.error(`Error clearing job result from cache ${address}: ${error}`);
    return false;
  }
};

const register_runner_handler = (app: Express, config: RunnerConfig) => {
  app.post("/runner/cache", async (req, res) => {
    try {
      await handle_cache_job_result(config, req.body);
      res.status(200).end();
    } catch (error: any) {
      console.error(`Error caching job result: ${error}`);
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
      console.error(`Error clearing job result from cache: ${error}`);
      res.status(500).send();
    }
  });
};

const submit_others_job_results = async (config: RunnerConfig) => {
  const to_submit = await config.cache.get_older_than(
    new Date(Date.now() - config.job_result_invalidation_timeout),
  );

  const orchestrator = create_orchestrator_client(config.orchestrator_address);

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
    const orchestrator = create_orchestrator_client(
      config.orchestrator_address,
    );

    const jobs = await orchestrator.get_jobs();

    console.log({ jobs });
  } catch (error) {
    console.error(`Error polling new jobs: ${error}`);
  }
};

const driver = async (config: RunnerConfig) => {
  await Promise.all([submit_others_job_results(config), poll_new_jobs(config)]);
};

let interval_id: NodeJS.Timeout | null = null;

export const start_runner = (app: Express, config: RunnerConfig) => {
  register_runner_handler(app, config);

  if (interval_id) {
    clearInterval(interval_id);
  }

  interval_id = setInterval(async () => {
    try {
      await driver(config);
    } catch (error) {
      console.error(`Error in runner driver: ${error}`);
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
