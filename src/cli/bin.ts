#!/usr/bin/env node

import { isMainThread } from "node:worker_threads";
import { run_worker } from "@/server/worker";
import { migrate_sqlite } from "@/server/db/migrations";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { docs_page } from "./docs";

migrate_sqlite(drizzle("./.sqlite/db.db"));

const main = async () => {
  if (!isMainThread) {
    await run_worker();
    process.exit(0);
  }

  docs_page(3000);
};

main();
