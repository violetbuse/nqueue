import type { Express } from "express";
import { logger } from "@/server/logging";

export abstract class SchedulerDriver {
  abstract schedule_crons(): Promise<void>;
  abstract schedule_queues(): Promise<void>;
  abstract schedule_messages(): Promise<void>;

  private async drive(): Promise<void> {
    await Promise.all([
      this.schedule_crons(),
      this.schedule_queues(),
      this.schedule_messages(),
    ]);
    return;
  }

  private driver_interval_id: NodeJS.Timeout | null = null;

  start_scheduler(app: Express): void {
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
