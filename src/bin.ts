#!/usr/bin/env node

import { run_server } from "./server";
import { isMainThread } from "node:worker_threads";
import { run_worker } from "./server/worker";
import {
  postgres_migrations,
  sqlite_migrations,
} from "./server/db/migrations/read_migrations";

console.log(
  JSON.stringify(
    {
      postgres_migrations,
      sqlite_migrations,
    },
    null,
    2,
  ),
);

(async () => {
  if (!isMainThread) {
    await run_worker();
    process.exit(0);
  }
})();
