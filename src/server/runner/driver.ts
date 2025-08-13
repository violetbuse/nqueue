import { Worker } from "node:worker_threads";
import { logger } from "../logging";
import {
  job_result_schema,
  JobDescription,
  JobResult,
  WorkerData,
} from "../types";
import { worker_file } from "../worker";
// import { Swim } from "../swim";
import { create_orchestrator_client } from "../orchestrator/client";
import { RPCHandler } from "@orpc/server/node";
import type { Express } from "express";
import { runner_contract } from "./contract";
import { StandardHandlerPlugin } from "@orpc/server/standard";
import { Config } from "../config";
import { create_swim_client } from "../swim/client";

export abstract class RunnerDriver {
  private runner_id: string = "local";

  constructor() {}

  abstract put_assigned_jobs(jobs: JobDescription[]): Promise<void>;

  private async poll_jobs() {
    try {
      const swim = create_swim_client(Config.getInstance().local_address());
      const orchestrator_node = await swim.get_node_of_tag({
        tag: "orchestrator",
      });

      if (!orchestrator_node) {
        throw new Error("Orchestrator node not found");
      }

      const runner_nodes = await swim.get_tagged_count({
        tag: "runner",
        restrict_alive: true,
      });

      const address = orchestrator_node.node_address;
      const orchestrator = create_orchestrator_client(address);

      const max_runner_period =
        Config.getInstance().get_runner_config().interval_ms + 10_000;
      const period_per_runner = max_runner_period / runner_nodes;

      const new_jobs = await orchestrator.request_job_assignments({
        runner_id: this.runner_id,
        period_ms: period_per_runner,
      });

      await this.put_assigned_jobs(new_jobs);
    } catch (error: any) {
      logger.error(
        `Failed to poll for job assignments: ${error ?? "Unknown error"}`
      );
    }
  }

  abstract get_assigned_jobs(
    after: Date,
    before: Date
  ): Promise<JobDescription[]>;
  abstract remove_assigned_jobs(job_ids: string[]): Promise<void>;

  private _assigned_jobs_cursor: Date = new Date(Date.now() - 20 * 1000);

  private async execute_assigned_jobs() {
    return new Promise<void>(async (resolve) => {
      try {
        const next_cursor = new Date(
          Date.now() + Config.getInstance().get_runner_config().interval_ms
        );
        const previous_cursor = this._assigned_jobs_cursor;
        this._assigned_jobs_cursor = next_cursor;

        const jobs = await this.get_assigned_jobs(previous_cursor, next_cursor);
        await this.remove_assigned_jobs(jobs.map((j) => j.job_id));

        const swim = create_swim_client(Config.getInstance().local_address());
        const orchestrator_node = await swim.get_node_of_tag({
          tag: "orchestrator",
        });

        if (!orchestrator_node) {
          throw new Error("Orchestrator node not found");
        }

        const orchestrator = create_orchestrator_client(
          orchestrator_node.node_address
        );

        const result_promises = jobs.map(this.execute_job);

        const promise_is_resolved = <T>(
          promise: Promise<T>
        ): Promise<boolean> =>
          Promise.race([
            new Promise<boolean>((resolve) =>
              setTimeout(() => resolve(false), 0)
            ),
            promise.then(
              () => true,
              () => false
            ),
          ]);

        const interval_id = setInterval(async () => {
          let results: JobResult[] = [];

          if (result_promises.length === 0) {
            clearInterval(interval_id);
            resolve();
            return;
          }

          await Promise.all(
            result_promises.map(async (promise, idx) => {
              const is_resolved = await promise_is_resolved(promise);

              if (is_resolved) {
                result_promises.splice(idx, 1);
                const result = await promise;
                results.push(result);
              }
            })
          );

          await orchestrator.submit_job_results(results);
        }, 500);
      } catch (error: any) {
        logger.error(
          `Failed to execute assigned jobs: ${error.message ?? "Unknown error"}`
        );
        resolve();
      }
    });
  }

  private async execute_job(
    job_description: JobDescription
  ): Promise<JobResult> {
    return new Promise<JobResult>((resolve) => {
      const time_to_execute = Math.max(
        0,
        job_description.planned_at.getTime() - Date.now()
      );

      const result_default: JobResult = {
        job_id: job_description.job_id,
        planned_at: job_description.planned_at,
        attempted_at: new Date(),
        duration_ms: Date.now() - job_description.planned_at.getTime(),
        data: null,
        timed_out: false,
        error: null,
      };

      let resolved = false;

      setTimeout(() => {
        try {
          const worker_data: WorkerData = {
            worker_type: "run_job",
            job: job_description,
          };

          const worker = new Worker(worker_file, {
            workerData: worker_data,
          });

          worker.on("message", (message) => {
            const result = job_result_schema.safeParse(message);

            if (result.success) {
              resolve(result.data);
            } else {
              resolve({
                ...result_default,
                error: "Worker returned incorrect data.",
              });
            }

            resolved = true;
          });

          worker.on("messageerror", (_) => {
            resolve({
              ...result_default,
              error: "Worker message error, did not receive a message",
            });

            resolved = true;
          });

          worker.on("error", (error) => {
            resolve({
              ...result_default,
              error: `Worker error: ${error.message}`,
            });

            resolved = true;
          });

          worker.on("exit", (code) => {
            if (code !== 0) {
              resolve({
                ...result_default,
                error: `Worker exited with code ${code}`,
              });

              resolved = true;
            } else if (!resolved) {
              resolve({
                ...result_default,
                error: "Worker exited without but did not return data.",
              });

              resolved = true;
            }
          });
        } catch (error: any) {
          logger.error(
            `Error executing job ${job_description.job_id}: ${
              error.message ?? "Unknown error"
            }`
          );
          resolve({
            ...result_default,
            error: error.message ?? "Unknown error executing job",
          });

          resolved = true;
        }
      }, time_to_execute);
    });
  }

  abstract get_cached_job_results(older_than: Date): Promise<JobResult[]>;

  private async submit_cached_job_results(): Promise<void> {
    try {
      const results = await this.get_cached_job_results(
        new Date(
          Date.now() -
            Config.getInstance().get_runner_config().job_cache_timeout_ms
        )
      );

      const swim = create_swim_client(Config.getInstance().local_address());
      const orchestrator_node = await swim.get_node_of_tag({
        tag: "orchestrator",
      });

      if (!orchestrator_node) {
        throw new Error("Orchestrator node not found");
      }

      const orchestrator_address = orchestrator_node.node_address;
      const orchestrator = create_orchestrator_client(orchestrator_address);
      await orchestrator.submit_job_results(results);
    } catch (error: any) {
      logger.error(
        `Error submitting cached job results: ${
          error.message ?? "Unknown error"
        }`
      );
    }
  }

  private async poll_swim_self(): Promise<void> {
    try {
      const swim = create_swim_client(Config.getInstance().local_address());
      const self = await swim.get_self();

      this.runner_id = self.node_id;
    } catch (error: any) {
      logger.error(
        `Error polling swim self: ${error.message ?? "Unknown error"}`
      );
    }
  }

  private async drive(): Promise<void> {
    await Promise.all([
      this.submit_cached_job_results(),
      this.poll_jobs(),
      this.execute_assigned_jobs(),
      this.poll_swim_self(),
    ]);
  }

  abstract implement_routes(
    contract: typeof runner_contract,
    plugins: StandardHandlerPlugin<{}>[]
  ): RPCHandler<{}>;

  private register_routes(app: Express) {
    const router = this.implement_routes(runner_contract, []);
    app.use("/runner/*splat", async (req, res, next) => {
      const { matched } = await router.handle(req, res, {
        prefix: "/runner",
        context: {},
      });

      if (matched) {
        return;
      }

      next();
    });
  }

  private _interval: NodeJS.Timeout | null = null;

  async start(app: Express) {
    this.register_routes(app);

    if (this._interval) {
      clearInterval(this._interval);
    }

    const runner_interval_ms =
      Config.getInstance().get_runner_config().interval_ms;
    const max_jitter_ms = Math.min(
      Math.max(Math.round(runner_interval_ms / 2), 1_000),
      30_000
    );

    this._interval = setInterval(() => {
      const current_jitter = Math.random() * max_jitter_ms;
      setTimeout(async () => {
        try {
          await this.drive();
        } catch (error: any) {
          logger.error(
            `Error in runner driver: ${error.message ?? "Unknown error"}`
          );
        }
      }, current_jitter);
    }, runner_interval_ms);
  }
}
