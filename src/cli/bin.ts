#!/usr/bin/env node

import { isMainThread } from "node:worker_threads";
import { run_worker } from "@/server/worker";
import { migrate_sqlite } from "@/server/db/migrations";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { render_app } from "./app";

migrate_sqlite(drizzle("./.sqlite/db.db"));

const main = async () => {
  if (!isMainThread) {
    await run_worker();
    process.exit(0);
  }

  render_app();
};

main();
