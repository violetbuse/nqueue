#!/usr/bin/env node

import { run_server } from "./server";
import { isMainThread } from "node:worker_threads";
import { run_worker } from "./server/worker";

(async () => {
  if (!isMainThread) {
    await run_worker();
    process.exit(0);
  }

  await run_server();
})();
