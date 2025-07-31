import type { Express } from "express";
import * as z from "zod";

import type { OrchestratorStorage } from "./storage";
import type { JobDescription, JobResult } from "./types";
import { job_description_schema, job_result_schema } from "./types";
import { Swim } from "../swim/swim";

type OrchestratorConfig = {
  storage: OrchestratorStorage;
  swim: Swim | null;
};

const handle_get_jobs = async (
  config: OrchestratorConfig,
  _body: unknown,
): Promise<JobDescription[]> => {
  return config.storage.get_jobs();
};

const get_jobs = async (address: string): Promise<JobDescription[] | null> => {
  try {
    const response = await fetch(`${address}/jobs`);
    if (!response.ok) {
      throw new Error(`Failed to fetch jobs: ${response.statusText}`);
    }
    const data = await response.json();
    const jobs = await z.array(job_description_schema).parseAsync(data);

    return jobs;
  } catch (error: any) {
    console.error(error);
    return null;
  }
};

const handle_submit_job_result = async (
  config: OrchestratorConfig,
  body: unknown,
): Promise<{ success: boolean }> => {
  try {
    const result = await job_result_schema.parseAsync(body);

    return await config.storage.submit_job_result(result);
  } catch (error: any) {
    console.error(error);
    return { success: false };
  }
};

const submit_job_result = async (
  address: string,
  job_result: JobResult,
): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(`${address}/job-result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(job_result),
    });
    if (!response.ok) {
      throw new Error(`Failed to submit job result: ${response.statusText}`);
    }
    const data = await response.json();
    return z.object({ success: z.boolean() }).parseAsync(data);
  } catch (error: any) {
    console.error(error);
    return { success: false };
  }
};

const register_scheduler_handlers = (
  app: Express,
  config: OrchestratorConfig,
) => {
  app.get("/orchestrator/jobs", async (req, res) => {
    try {
      const jobs = await handle_get_jobs(config, req.body);
      res.json(jobs);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Unknown error" });
    }
  });

  app.post("/orchestrator/job-result", async (req, res) => {
    try {
      const job_result = await handle_submit_job_result(config, req.body);
      res.json(job_result);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Unknown error" });
    }
  });
};

export const start_scheduler = (app: Express, config: OrchestratorConfig) => {
  register_scheduler_handlers(app, config);
};

export const create_client = async (address: string) => {
  return {
    get_jobs: async () => await get_jobs(address),
    submit_job_result: async (job_result: JobResult) =>
      await submit_job_result(address, job_result),
  };
};
