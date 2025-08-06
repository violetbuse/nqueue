import { RPCHandler } from "@orpc/server/node";
import { StandardHandlerPlugin } from "@orpc/server/standard";
import { JobDescription, JobResult } from "../types";
import { migrate_runner_sqlite, runner_sqlite_schema as schema } from "../db";
import { runner_contract } from "./contract";
import { RunnerDriver } from "./driver";
import { BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";
import { Database as SqliteDatabase } from "better-sqlite3";

export class SqliteRunner extends RunnerDriver {
  private db: BetterSQLite3Database<typeof schema> & {
    $client: SqliteDatabase;
  };

  constructor(runner_db_url: string) {
    super();

    this.db = drizzle(runner_db_url, { schema });

    migrate_runner_sqlite(this.db);

    this.db.$client.pragma("journal_mode = WAL");
  }

  override async put_assigned_jobs(jobs: JobDescription[]): Promise<void> {}

  override async get_assigned_jobs(): Promise<JobDescription[]> {}

  override async remove_assigned_jobs(job_ids: string[]): Promise<void> {}

  override async get_cached_job_results(
    older_than: Date,
  ): Promise<JobResult[]> {}

  override implement_routes(
    contract: runner_contract,
    plugins: StandardHandlerPlugin<{}>[],
  ): RPCHandler<{}> {}
}
