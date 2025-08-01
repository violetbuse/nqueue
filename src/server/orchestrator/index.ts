import type { Express } from "express";
import * as z from "zod";

import type { OrchestratorStorage } from "./storage";
import type { JobDescription, JobResult } from "../types";
import { job_description_schema, job_result_schema } from "../types";
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
    const response = await fetch(`${address}orchestrator/jobs`);
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

const handle_cancel_aassignment = async (
  config: OrchestratorConfig,
  job_id: string,
): Promise<{ success: boolean }> => {
  return config.storage.cancel_assignment(job_id);
};

const cancel_assignment = async (
  address: string,
  job_id: string,
): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(
      `${address}/orchestrator/jobs/${job_id}/cancel`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to cancel assignment: ${response.statusText}`);
    }
    const data = await response.json();
    return await z.object({ success: z.boolean() }).parseAsync(data);
  } catch (error: any) {
    console.error(error);
    return { success: false };
  }
};

const handle_submit_job_result = async (
  config: OrchestratorConfig,
  body: unknown,
): Promise<{ success: boolean }> => {
  try {
    const job_result = await job_result_schema.parseAsync(body);

    return await config.storage.submit_job_result(job_result);
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
    const response = await fetch(`${address}/orchestrator/jobs/result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(job_result),
    });
    if (!response.ok) {
      throw new Error(`Failed to submit job result: ${response.statusText}`);
    }
    const data = await response.json();
    return z.object({ success: z.boolean() }).parse(data);
  } catch (error: any) {
    console.error(error);
    return { success: false };
  }
};

const handle_submit_job_results = async (
  config: OrchestratorConfig,
  body: unknown,
): Promise<{ success: boolean }> => {
  try {
    const job_results = await z.array(job_result_schema).parseAsync(body);

    return await config.storage.submit_job_results(job_results);
  } catch (error: any) {
    console.error(error);
    return { success: false };
  }
};

const submit_job_results = async (
  address: string,
  job_results: JobResult[],
): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(`${address}/orchestrator/jobs/result/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(job_results),
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

  app.post("/orchestrator/jobs/:job_id/cancel", async (req, res) => {
    try {
      if (!req.params.job_id) {
        throw new Error("Missing job ID");
      }

      const success = await handle_cancel_aassignment(
        config,
        req.params.job_id,
      );
      res.json(success);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Unknown error" });
    }
  });

  app.post("/orchestrator/jobs/result", async (req, res) => {
    try {
      const success = await handle_submit_job_result(config, req.body);
      res.json(success);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Unknown error" });
    }
  });

  app.post("/orchestrator/jobs/result/batch", async (req, res) => {
    try {
      const success = await handle_submit_job_results(config, req.body);
      res.json(success);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Unknown error" });
    }
  });
};

export const start_scheduler = (app: Express, config: OrchestratorConfig) => {
  register_scheduler_handlers(app, config);
};

export const create_client = (address: string) => {
  return {
    get_jobs: async () => await get_jobs(address),
    cancel_assignment: async (job_id: string) =>
      await cancel_assignment(address, job_id),
    submit_job_result: async (job_result: JobResult) =>
      await submit_job_result(address, job_result),
    submit_job_results: async (job_results: JobResult[]) =>
      await submit_job_results(address, job_results),
  };
};
