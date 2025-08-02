import { ApiCronStorage, SharedJobSchema } from "@/server/api/db";
import { SqliteDB } from "@/server/db";
import { sqlite_schema } from "@/server/db/schemas";
import { nanoid } from "nanoid";
import { validateCronExpression } from "@/utils/validate-cron";
import * as z from "zod";
import { logger } from "@/server/logging";

export class ApiCronStorageSqlite implements ApiCronStorage {
  constructor(private db: SqliteDB) {}

  async create(
    expression: string,
    job: SharedJobSchema,
  ): Promise<[string, null] | [null, string]> {
    try {
      if (!validateCronExpression(expression)) {
        return [null, "Invalid cron expression"];
      }

      if (!z.url().safeParse(job.url).success) {
        return [null, "Invalid job URL"];
      }

      const result = this.db
        .insert(sqlite_schema.cron_job)
        .values({
          id: "cron_" + nanoid(),
          expression: expression,
          url: job.url,
          method: job.method,
          headers: job.headers,
          body: job.body,
          timeout_ms: job.timeout_ms,
          metadata: job.metadata,
        })
        .returning({ id: sqlite_schema.cron_job.id })
        .get();

      if (!result) {
        return [null, "Failed to create cron job"];
      }

      return [result.id, null];
    } catch (error: any) {
      logger.error(`Error creating cron job: ${error.message}`);
      return [null, error.message ?? "Unknown error"];
    }
  }
}
