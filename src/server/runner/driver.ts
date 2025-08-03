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

export abstract class RunnerDriver {
  constructor(
    private orchestrator_address: () => Promise<string>,
    private interval: number = 20_000,
    private job_cache_timeout: number = 120_000,
    // private _swim: Swim | null = null,
  ) {}

  abstract put_assigned_jobs(jobs: JobDescription[]): Promise<void>;

  private async poll_jobs() {
    try {
      const address = await this.orchestrator_address();
      const orchestrator = create_orchestrator_client(address);

      const new_jobs = await orchestrator.request_job_assignments();

      await this.put_assigned_jobs(new_jobs);
    } catch (error: any) {
      logger.error(
        `Failed to poll for job assignments: ${error.message ?? "Unknown error"}`,
      );
    }
  }

  abstract get_assigned_jobs(
    after: Date,
    before: Date,
  ): Promise<JobDescription[]>;
  abstract remove_assigned_jobs(job_ids: string[]): Promise<void>;

  private _assigned_jobs_cursor: Date = new Date(Date.now() - 20 * 1000);

  private async execute_assigned_jobs() {
    return new Promise<void>(async (resolve) => {
      try {
        const next_cursor = new Date(Date.now() + this.interval);
        const previous_cursor = this._assigned_jobs_cursor;
        this._assigned_jobs_cursor = next_cursor;

        const jobs = await this.get_assigned_jobs(previous_cursor, next_cursor);
        await this.remove_assigned_jobs(jobs.map((j) => j.job_id));

        const address = await this.orchestrator_address();
        const orchestrator = create_orchestrator_client(address);

        const result_promises = jobs.map(this.execute_job);

        const promise_is_resolved = <T>(
          promise: Promise<T>,
        ): Promise<boolean> =>
          Promise.race([
            new Promise<boolean>((resolve) =>
              setTimeout(() => resolve(false), 0),
            ),
            promise.then(
              () => true,
              () => false,
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
            }),
          );

          await orchestrator.submit_job_results(results);
        }, 500);
      } catch (error: any) {
        logger.error(
          `Failed to execute assigned jobs: ${error.message ?? "Unknown error"}`,
        );
        resolve();
      }
    });
  }

  private async execute_job(
    job_description: JobDescription,
  ): Promise<JobResult> {
    return new Promise<JobResult>((resolve) => {
      const time_to_execute = Math.max(
        0,
        job_description.planned_at.getTime() - Date.now(),
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
            `Error executing job ${job_description.job_id}: ${error.message ?? "Unknown error"}`,
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
        new Date(Date.now() - this.job_cache_timeout),
      );

      const orchestrator_address = await this.orchestrator_address();
      const orchestrator = create_orchestrator_client(orchestrator_address);
      await orchestrator.submit_job_results(results);
    } catch (error: any) {
      logger.error(
        `Error submitting cached job results: ${error.message ?? "Unknown error"}`,
      );
    }
  }

  private async driver(): Promise<void> {
    await Promise.all([
      this.submit_cached_job_results(),
      this.poll_jobs(),
      this.execute_assigned_jobs(),
    ]);
  }

  abstract implement_routes(
    contract: typeof runner_contract,
    plugins: StandardHandlerPlugin<{}>[],
  ): RPCHandler<{}>;

  private register_routes(app: Express) {
    const router = this.implement_routes(runner_contract, []);
    app.use("/runner*", async (req, res, next) => {
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

    this._interval = setInterval(async () => {
      try {
        await this.driver();
      } catch (error: any) {
        logger.error(
          `Error in driver loop: ${error.message ?? "Unknown error"}`,
        );
      }
    }, this.interval);
  }
}
