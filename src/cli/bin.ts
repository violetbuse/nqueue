#!/usr/bin/env node

import { isMainThread } from "node:worker_threads";
import { run_worker } from "@/server/worker/index.ts";
import { sqlite_migrations } from "@/server/db/migrations/read_migrations.ts";
import { migrate_sqlite } from "@/server/db/migrations/index.ts";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { logger } from "@/server/logging/index.ts";
import { render_app } from "./app.ts";

logger.info(JSON.stringify(sqlite_migrations, null, 2));
migrate_sqlite(drizzle("./.sqlite/db.db"));

const main = async () => {
  if (!isMainThread) {
    await run_worker();
    process.exit(0);
  }

  render_app();
};

main();
