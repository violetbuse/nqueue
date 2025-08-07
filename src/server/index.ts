import { api_contract } from "./api/contract";
import { open_api_spec } from "./api/openapi";
import { ApiDriver } from "./api/driver";
import { OrchestratorDriver } from "./orchestrator/driver";
import { SchedulerDriver } from "./scheduler";
import { RunnerDriver } from "./runner/driver";
import { Config } from "./config";
import { join } from "path";
import { ensureDir } from "fs-extra";
import express from "express";
import { SwimSqlite } from "./swim/sqlite";
import { create_sqlite_db } from "./db/sqlite";
import { SqliteRunner } from "./runner/sqlite";
import { SqliteScheduler } from "./scheduler/sqlite";
import { SqliteOrchestrator } from "./orchestrator/sqlite";
import { SqliteApi } from "./api/sqlite";
import morgan from "morgan";
import { logger } from "./logging";

const run_server = async () => {
  Config.init({
    hostname: "localhost",
    port: 1337,
    cluster_bootstrap_nodes: [],
    run_scheduler: true,
    run_orchestrator: true,
    run_api: true,
    run_runner: true,
    runner: {
      interval_ms: 20_000,
      job_cache_timeout_ms: 60_000,
    },
    scheduler: {
      interval_ms: 10_000,
    },
    sqlite: {
      data_directory: join(process.cwd(), ".nqueue"),
    },
  });

  const config = Config.getInstance().read();

  await ensureDir(config.sqlite.data_directory);

  const app = express();
  app.use(morgan("tiny"));

  const swim_database = join(config.sqlite.data_directory, "swim.db");
  const runner_database = join(config.sqlite.data_directory, "runner.db");
  const main_database = join(config.sqlite.data_directory, "main.db");

  const main_db = create_sqlite_db(main_database);

  const swim = new SwimSqlite(swim_database);
  const runner = new SqliteRunner(runner_database);

  const scheduler = new SqliteScheduler(main_db);
  const orchestrator = new SqliteOrchestrator(main_db);
  const api = new SqliteApi(main_db);

  swim.start(app);
  runner.start(app);
  api.start(app);
  scheduler.start(app);
  orchestrator.start(app);

  app.listen(config.port, () => {
    logger.info(`Server started: http://localhost:${config.port}`);
  });
};

export {
  run_server,
  open_api_spec,
  api_contract,
  ApiDriver,
  OrchestratorDriver,
  SchedulerDriver,
  RunnerDriver,
};
