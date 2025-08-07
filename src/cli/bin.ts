#!/usr/bin/env node

import { isMainThread } from "node:worker_threads";
import { run_worker } from "@/server/worker";
import { migrate_sqlite } from "@/server/db/migrations";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { run_server } from "@/server";

const main = async () => {
  if (!isMainThread) {
    await run_worker();
    process.exit(0);
  }

  await run_server();
};

main();
