import { ServerExecutor } from "@/server";
import { Command, Option } from "commander";
import { publicIpv4 } from "public-ip";

const public_ip = await publicIpv4();

export const server_command = new Command()
  .name("server")
  .description("Run the nqueue server.")
  .addOption(
    new Option("-p, --port <number>", "port to run the server on")
      .default(3000)
      .argParser(parseInt)
  )
  .addOption(
    new Option(
      "-a, --address <string>",
      "address to advertise to the cluster"
    ).default(public_ip || "localhost")
  )
  .addOption(
    new Option(
      "-b, --bootstrap-nodes <nodes...>",
      "swim cluster bootstrap nodes to connect to"
    ).default([])
  )
  .addOption(
    new Option(
      "--swim-data-directory <path>",
      "directory to store swim data"
    ).default("./.nqueue")
  )
  .addOption(
    new Option("-s, --data-store [type]", "what data store to use")
      .choices(["sqlite"])
      .default("sqlite")
  )
  .addOption(
    new Option(
      "-d, --sqlite-data-directory <path>",
      "directory to store sqlite data"
    ).default("./.nqueue")
  )
  .addOption(
    new Option(
      "--automatically-migrate",
      "automatically migrate the database schema"
    ).default(false)
  )
  .addOption(new Option("--api", "run the api server").default(false))
  .addOption(
    new Option("--open-api-docsite", "enable the OpenAPI docsite").default(true)
  )
  .addOption(
    new Option("--orchestrator", "enable the orchestrator").default(false)
  )
  .addOption(new Option("--runner", "enable the runner").default(false))
  .addOption(
    new Option(
      "--runner-interval-ms <number>",
      "runner interval in milliseconds"
    )
      .default(5000)
      .argParser(parseInt)
  )
  .addOption(
    new Option(
      "--runner-job-cache-timeout-ms <number>",
      "runner job cache timeout in milliseconds"
    )
      .default(60000)
      .argParser(parseInt)
  )
  .addOption(
    new Option(
      "--runner-data-directory <path>",
      "directory to store runner data"
    ).default("./.nqueue")
  )
  .addOption(new Option("--scheduler", "enable the scheduler").default(false))
  .addOption(
    new Option(
      "--scheduler-interval-ms <number>",
      "scheduler interval in milliseconds"
    )
      .default(5000)
      .argParser(parseInt)
  )
  .addOption(
    new Option("--all-components", "run all components").default(false)
  )
  .action(async (options) => {
    if (options.dataStore === "sqlite") {
      //options validation:

      // when running with the sqlite datastore, api, orchestrator, and scheduler must either run *all* or *none* of them.
      const running_all_or_none =
        // running all
        (options.api && options.orchestrator && options.scheduler) ||
        options.allComponents ||
        // running none
        (!options.api && !options.orchestrator && !options.scheduler);

      if (!running_all_or_none) {
        console.error(
          "When using the sqlite data store, you must either run all of api, orchestrator, and scheduler, or none of them."
        );
        process.exit(1);
      }
    }

    let server_executor = new ServerExecutor();

    server_executor.setOptions({
      hostname: options.address,
      port: options.port,
      cluster_bootstrap_nodes: options.bootstrapNodes as string[],
      swim_data_directory: options.swimDataDirectory,
    });

    if (options.dataStore === "sqlite") {
      server_executor.setDataBackend({
        sqlite_data_directory: options.sqliteDataDirectory,
        automatically_migrate: options.automaticallyMigrate,
      });
    }

    if (options.api || options.allComponents) {
      server_executor.enableApi({
        open_api_docsite_enabled: options.openApiDocsite,
      });
    }

    if (options.orchestrator || options.allComponents) {
      server_executor.enableOrchestrator();
    }

    if (options.runner || options.allComponents) {
      server_executor.enableRunner({
        interval_ms: options.runnerIntervalMs,
        job_cache_timeout_ms: options.runnerJobCacheTimeoutMs,
        runner_data_directory: options.runnerDataDirectory,
      });
    }

    if (options.scheduler || options.allComponents) {
      server_executor.enableScheduler({
        interval_ms: options.schedulerIntervalMs,
      });
    }

    await server_executor.run();
  });
