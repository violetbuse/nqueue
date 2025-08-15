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
      .env("NQUEUE_PORT")
      .argParser(parseInt)
  )
  .addOption(
    new Option("-a, --address <string>", "address to advertise to the cluster")
      .env("NQUEUE_ADDRESS")
      .default(public_ip || "localhost")
  )
  .addOption(
    new Option(
      "-b, --bootstrap-nodes <nodes...>",
      "swim cluster bootstrap nodes to connect to"
    )
      .env("NQUEUE_BOOTSTRAP_NODES")
      .default([])
  )
  .addOption(
    new Option("--swim-data-directory <path>", "directory to store swim data")
      .env("NQUEUE_SWIM_DATA_DIRECTORY")
      .default("./.nqueue")
  )
  .addOption(
    new Option("-s, --data-store [type]", "what data store to use")
      .choices(["sqlite"])
      .env("NQUEUE_DATA_STORE")
      .default("sqlite")
  )
  .addOption(
    new Option(
      "-d, --sqlite-data-directory <path>",
      "directory to store sqlite data"
    )
      .env("NQUEUE_SQLITE_DATA_DIRECTORY")
      .default("./.nqueue")
  )
  .addOption(
    new Option(
      "--automatically-migrate",
      "automatically migrate the database schema"
    )
      .env("NQUEUE_AUTOMATICALLY_MIGRATE")
      .default(false)
  )
  .addOption(new Option("--api", "run the api server").default(false))
  .addOption(
    new Option("--open-api-docsite", "enable the OpenAPI docsite")
      .env("NQUEUE_OPEN_API_DOCSITE")
      .default(false)
  )
  .addOption(
    new Option("--studio", "enable the studio")
      .env("NQUEUE_STUDIO")
      .default(false)
  )
  .addOption(
    new Option("--orchestrator", "enable the orchestrator")
      .env("NQUEUE_ORCHESTRATOR")
      .default(false)
  )
  .addOption(
    new Option("--runner", "enable the runner")
      .env("NQUEUE_RUNNER")
      .default(false)
  )
  .addOption(
    new Option(
      "--runner-interval-ms <number>",
      "runner interval in milliseconds"
    )
      .env("NQUEUE_RUNNER_INTERVAL_MS")
      .default(5000)
      .argParser(parseInt)
  )
  .addOption(
    new Option(
      "--runner-job-cache-timeout-ms <number>",
      "runner job cache timeout in milliseconds"
    )
      .env("NQUEUE_RUNNER_JOB_CACHE_TIMEOUT_MS")
      .default(60000)
      .argParser(parseInt)
  )
  .addOption(
    new Option(
      "--runner-data-directory <path>",
      "directory to store runner data"
    )
      .env("NQUEUE_RUNNER_DATA_DIRECTORY")
      .default("./.nqueue")
  )
  .addOption(
    new Option("--scheduler", "enable the scheduler")
      .env("NQUEUE_SCHEDULER")
      .default(false)
  )
  .addOption(
    new Option(
      "--scheduler-interval-ms <number>",
      "scheduler interval in milliseconds"
    )
      .env("NQUEUE_SCHEDULER_INTERVAL_MS")
      .default(5000)
      .argParser(parseInt)
  )
  .addOption(
    new Option("--all-components", "run all components")
      .env("NQUEUE_ALL_COMPONENTS")
      .default(false)
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
        studio_enabled: options.studio,
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
