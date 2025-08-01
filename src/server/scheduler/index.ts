import type { Express } from "express";

export abstract class Scheduler {
  abstract drive(): Promise<void>;

  private driver_interval_id: NodeJS.Timeout | null = null;

  start_scheduler(_app: Express): void {
    if (this.driver_interval_id) {
      clearInterval(this.driver_interval_id);
    }

    this.driver_interval_id = setInterval(async () => {
      try {
        await this.drive();
      } catch (error: any) {
        console.error(
          `Error in scheduler driver: ${error?.message ?? "<unknown_error>"}`,
        );
      }
    });
  }
}
