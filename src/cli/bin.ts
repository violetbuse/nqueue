#!/usr/bin/env node

import { program } from "commander";
import package_json from "../../package.json";
import { docs_command } from "./commands/docs";
import { dev_command } from "./commands/dev";
import { server_command } from "./commands/server";
import { isMainThread } from "worker_threads";
import { run_worker } from "@/server/worker";

if (isMainThread) {
  program
    .name("nqueue")
    .description("Easy to self host and run message queue for serverless.")
    .version(package_json.version)
    .addCommand(server_command)
    .addCommand(docs_command)
    .addCommand(dev_command);

  program.parse();
} else {
  run_worker();
}
