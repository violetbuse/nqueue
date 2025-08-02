import type { Express } from "express";
import * as z from "zod";
import { logger } from "@/server/logging";

export abstract class Scheduler {
  abstract schedule_cron_job(cron_id: string): Promise<void>;

  abstract schedule_crons(): Promise<void>;

  private async schedule_job(job_id: string): Promise<void> {
    const [job_type] = job_id.split("_", 1);

    switch (job_type!) {
      case "cron": {
        await this.schedule_cron_job(job_id);
        break;
      }
      default: {
        throw new Error(`Unknown job type: ${job_type}`);
      }
    }
  }

  private async drive(): Promise<void> {
    await Promise.all([this.schedule_crons()]);
    return;
  }

  private register_scheduler_handlers(app: Express) {
    app.post("/scheduler/process/:job_id", async (req, res) => {
      try {
        if (typeof req.params.job_id !== "string") {
          throw new Error("Invalid job_id");
        }

        const job_id = req.params.job_id;
        await this.schedule_job(job_id);

        res.status(200).send({ success: true });
      } catch (error: any) {
        logger.error(
          `Error in scheduler process: ${error?.message ?? "<unknown_error>"}`,
        );
        res.status(500).send({ error: error?.message ?? "<unknown_error>" });
      }
    });
  }

  private driver_interval_id: NodeJS.Timeout | null = null;

  start_scheduler(app: Express): void {
    this.register_scheduler_handlers(app);

    if (this.driver_interval_id) {
      clearInterval(this.driver_interval_id);
    }

    this.driver_interval_id = setInterval(async () => {
      try {
        await this.drive();
      } catch (error: any) {
        logger.error(
          `Error in scheduler driver: ${error?.message ?? "<unknown_error>"}`,
        );
      }
    });
  }
}

const schedule_job = async (address: string, job_id: string) => {
  try {
    const response = await fetch(`${address}/scheduler/process/${job_id}`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`Failed to schedule job: ${response.statusText}`);
    }

    const data = await response.json();
    return z.object({ success: z.boolean() }).parseAsync(data);
  } catch (error: any) {
    logger.error(
      `Error in scheduling job ${job_id} on ${address}: ${error?.message ?? "<unknown_error>"}`,
    );

    return { success: false };
  }
};

export const create_client = async (
  address: string | (() => string) | (() => Promise<string>),
) => {
  const addr = typeof address === "string" ? () => address : address;

  return {
    schedule_job: async (job_id: string) =>
      await schedule_job(await addr(), job_id),
  };
};
