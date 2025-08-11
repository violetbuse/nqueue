import { ServerExecutor } from "@/server";
import { Command, Option } from "commander";

export const dev_command = new Command()
  .name("dev")
  .description("Run nqueue in development mode.")
  .addOption(
    new Option("-p, --port <number>", "port to run the server on")
      .default(3000)
      .argParser(parseInt)
  )
  .action(async ({ port }) => {
    await new ServerExecutor()
      .setOptions({
        hostname: "localhost",
        port: port,
        cluster_bootstrap_nodes: [],
        swim_data_directory: "./.nqueue",
      })
      .setDataBackend({
        sqlite_data_directory: "./.nqueue",
        automatically_migrate: true,
      })
      .enableApi({
        open_api_docsite_enabled: true,
      })
      .enableOrchestrator()
      .enableRunner({
        interval_ms: 5_000,
        job_cache_timeout_ms: 120_000,
        runner_data_directory: "./.nqueue",
      })
      .enableScheduler({
        interval_ms: 3_000,
      })
      .run();
  });
