#!/usr/bin/env node

import { isMainThread } from "node:worker_threads";
import { run_worker } from "@/server/worker";
import { run_server } from "@/server";
import { render_app } from "@/cli/app";

const main = async () => {
  if (!isMainThread) {
    await run_worker();
    process.exit(0);
  }

  const args = new Set(process.argv.slice(2));
  const getArg = (name: string): string | undefined => {
    const prefix = `${name}=`;
    const found = process.argv.slice(2).find((a) => a.startsWith(prefix));
    return found ? found.slice(prefix.length) : undefined;
  };

  if (args.has("--client")) {
    const address = getArg("--address") ?? process.env["NQUEUE_ADDRESS"] ?? "http://localhost:1337";
    render_app({ address });
    return;
  }

  await run_server();
};

main();
