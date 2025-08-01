import type { Express } from "express";
import * as z from "zod";

import type { OrchestratorStorage } from "./storage";
import type { JobDescription, JobResult } from "../types";
import { job_description_schema, job_result_schema } from "../types";
import { Swim } from "../swim";

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

const handle_report_error = async (
  config: OrchestratorConfig,
  job_id: string,
  body: unknown,
): Promise<{ success: boolean }> => {
  try {
    let error: string;
    switch (typeof body) {
      case "bigint":
      case "number":
      case "boolean":
      case "symbol":
      case "function": {
        error = body.toString();
        break;
      }
      case "undefined": {
        error = "undefined";
        break;
      }
      case "string": {
        try {
          const json_maybe = JSON.parse(body);
          error = json_maybe;
        } catch (_error) {
          error = body;
        }
        break;
      }
      case "object": {
        error = JSON.stringify(body);
        break;
      }
      default: {
        error = "unknown";
        break;
      }
    }

    return await config.storage.report_error(job_id, error);
  } catch (error: any) {
    console.error(
      `Error handling reported error for job ${job_id}: ${error?.message ?? "Unknown error"}`,
    );
    return { success: false };
  }
};

const report_error = async (
  address: string,
  job_id: string,
  error: string | object,
): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(
      `${address}/orchestrator/jobs/${job_id}/report-error`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: typeof error === "string" ? error : JSON.stringify(error),
      },
    );
    if (!response.ok) {
      throw new Error(`Failed to report error: ${response.statusText}`);
    }
    const data = await response.json();
    return z.object({ success: z.boolean() }).parse(data);
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

  app.post("/orchestrator/jobs/:job_id/report-error", async (req, res) => {
    try {
      if (!req.params.job_id) {
        throw new Error("Missing job ID");
      }

      const success = await handle_report_error(
        config,
        req.params.job_id,
        req.body.error,
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

export const create_client = async (
  address: string | (() => string) | (() => Promise<string>),
) => {
  const addr = typeof address === "string" ? address : await address();

  return {
    get_jobs: async () => await get_jobs(addr),
    cancel_assignment: async (job_id: string) =>
      await cancel_assignment(addr, job_id),
    report_error: async (job_id: string, error: string | object) =>
      await report_error(addr, job_id, error),
    submit_job_result: async (job_result: JobResult) =>
      await submit_job_result(addr, job_result),
    submit_job_results: async (job_results: JobResult[]) =>
      await submit_job_results(addr, job_results),
  };
};
