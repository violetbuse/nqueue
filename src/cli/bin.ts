#!/usr/bin/env node

import { isMainThread } from "node:worker_threads";
import { run_worker } from "../server/worker";
import { sqlite_migrations } from "../server/db/migrations/read_migrations";
import { migrate_sqlite } from "../server/db/migrations";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { logger } from "../server/logging";

logger.info(JSON.stringify(sqlite_migrations, null, 2));
migrate_sqlite(drizzle("./.sqlite/db.db"));

const main = async () => {
  if (!isMainThread) {
    await run_worker();
    process.exit(0);
  }
};

main();
