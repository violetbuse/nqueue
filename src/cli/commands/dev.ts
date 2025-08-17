import { ServerExecutor } from "@/server";
import { logger } from "@/server/logging";
import { Command, Option } from "commander";
import open from "open";

export const dev_command = new Command()
  .name("dev")
  .description("Run nqueue in development mode.")
  .addOption(
    new Option("-p, --port <number>", "port to run the server on")
      .default(3000)
      .argParser(parseInt)
  )
  .addOption(
    new Option("-r, --live-reload", "enable live reload")
      .default(false)
      .hideHelp()
  )
  .addOption(
    new Option("-o, --open", "open the studio in the browser").default(true)
  )
  .addOption(
    new Option("--sql-logger", "enable SQL logging").default(false).hideHelp()
  )
  .addOption(new Option("--no-open", "do not open the studio in the browser"))
  .action(async ({ port, liveReload, open: open_studio, sqlLogger }) => {
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
        logger: sqlLogger,
      })
      .enableApi({
        open_api_docsite_enabled: true,
        studio_enabled: true,
        live_reload: liveReload,
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

    if (open_studio) {
      const studio_url = `http://localhost:${port}/`;
      logger.info(`Studio is available at ${studio_url}`);
      open(studio_url);
    }
  });
