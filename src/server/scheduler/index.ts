import type { Express } from "express";
import { logger } from "@/server/logging";
import { Config } from "../config";

export abstract class SchedulerDriver {
  abstract schedule_crons(): Promise<void>;
  abstract schedule_queues(): Promise<void>;
  abstract schedule_messages(): Promise<void>;

  abstract drive_in_parallel(): boolean;

  private async drive(): Promise<void> {
    if (this.drive_in_parallel()) {
      await Promise.all([
        this.schedule_crons(),
        this.schedule_queues(),
        this.schedule_messages(),
      ]);
    } else {
      await this.schedule_crons();
      await this.schedule_queues();
      await this.schedule_messages();
    }

    return;
  }

  private driver_interval_id: NodeJS.Timeout | null = null;

  start(_app: Express): void {
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
    }, Config.getInstance().read().scheduler.interval_ms);
  }
}
