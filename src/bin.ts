#!/usr/bin/env node

import { run_server } from "./server";
import { isMainThread } from "node:worker_threads";
import { run_worker } from "./server/worker";
import {
  postgres_migrations,
  sqlite_migrations,
} from "./server/db/migrations/read_migrations";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate_sqlite } from "./server/db/migrations";
import { sqlite_schema } from "./server/db/schemas";

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

const db = drizzle("./db.db", { schema: sqlite_schema });
migrate_sqlite(db);

(async () => {
  if (!isMainThread) {
    await run_worker();
    process.exit(0);
  }
})();
