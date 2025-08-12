import { api_contract } from "./api/contract";
import { open_api_spec } from "./api/openapi";
import { ApiDriver } from "./api/driver";
import { OrchestratorDriver } from "./orchestrator/driver";
import { SchedulerDriver } from "./scheduler";
import { RunnerDriver } from "./runner/driver";
import { Config, ConfigOptions } from "./config";
import { dirname, resolve } from "path";
import { ensureDir } from "fs-extra";
import express from "express";
import { SwimSqlite } from "./swim/sqlite";
import {
  create_runner_db,
  create_sqlite_db,
  create_swim_db,
} from "./db/sqlite";
import { SqliteRunner } from "./runner/sqlite";
import { SqliteScheduler } from "./scheduler/sqlite";
import { SqliteOrchestrator } from "./orchestrator/sqlite";
import { SqliteApi } from "./api/sqlite";
import morgan from "morgan";
import { logger } from "./logging";

interface ServerExecutionBuilder {
  setOptions(options: {
    hostname: string;
    port: number;
    cluster_bootstrap_nodes: string[];
    swim_data_directory: string;
  }): ServerExecutionBuilder;
  setDataBackend(options: {
    sqlite_data_directory: string;
    automatically_migrate?: boolean;
  }): ServerExecutionBuilder;
  enableApi(options: {
    open_api_docsite_enabled?: boolean;
  }): ServerExecutionBuilder;
  enableOrchestrator(): ServerExecutionBuilder;
  enableRunner(options: {
    interval_ms: number;
    job_cache_timeout_ms: number;
    runner_data_directory: string;
  }): ServerExecutionBuilder;
  enableScheduler(options: { interval_ms: number }): ServerExecutionBuilder;
  run(): Promise<void>;
}

class ServerExecutor implements ServerExecutionBuilder {
  constructor() {}

  hostname: string | null = null;
  port: number | null = null;
  cluster_bootstrap_nodes: string[] = [];
  swim_data_directory: string | null = null;

  data_backend_type: "sqlite" | null = null;
  automatically_migrate: boolean = false;
  sqlite_data_directory: string | null = null;

  api_enabled: boolean = false;
  open_api_docsite_enabled: boolean = false;

  orchestrator_enabled: boolean = false;

  runner_enabled: boolean = false;
  runner_interval_ms: number = 5000;
  runner_job_cache_timeout_ms: number = 60000;
  runner_data_directory: string | null = null;

  scheduler_enabled: boolean = false;
  scheduler_interval_ms: number = 5000;

  setOptions(options: {
    hostname: string;
    port: number;
    cluster_bootstrap_nodes: string[];
    swim_data_directory: string;
  }): ServerExecutionBuilder {
    this.hostname = options.hostname;
    this.port = options.port;
    this.cluster_bootstrap_nodes = options.cluster_bootstrap_nodes;
    this.swim_data_directory = options.swim_data_directory;
    return this;
  }

  setDataBackend(options: {
    sqlite_data_directory: string;
    automatically_migrate?: boolean;
  }): ServerExecutionBuilder {
    this.data_backend_type = "sqlite";
    this.sqlite_data_directory = options.sqlite_data_directory;
    this.automatically_migrate = options.automatically_migrate ?? false;
    return this;
  }

  enableApi(options: {
    open_api_docsite_enabled?: boolean;
  }): ServerExecutionBuilder {
    this.api_enabled = true;
    this.open_api_docsite_enabled = options.open_api_docsite_enabled || false;
    return this;
  }

  enableOrchestrator(): ServerExecutionBuilder {
    this.orchestrator_enabled = true;
    return this;
  }

  enableRunner(options: {
    interval_ms: number;
    job_cache_timeout_ms: number;
    runner_data_directory: string;
  }): ServerExecutionBuilder {
    this.runner_enabled = true;
    this.runner_interval_ms = options.interval_ms;
    this.runner_job_cache_timeout_ms = options.job_cache_timeout_ms;
    this.runner_data_directory = options.runner_data_directory;
    return this;
  }

  enableScheduler(options: { interval_ms: number }): ServerExecutionBuilder {
    this.scheduler_enabled = true;
    this.scheduler_interval_ms = options.interval_ms;
    return this;
  }

  private create_config(): ConfigOptions {
    if (!this.hostname || !this.port || !this.swim_data_directory) {
      throw new Error("Hostname and port must be set");
    }

    if (this.data_backend_type === "sqlite" && !this.sqlite_data_directory) {
      throw new Error("SQLite data directory must be set");
    }

    if (
      this.runner_enabled &&
      (!this.runner_interval_ms ||
        !this.runner_job_cache_timeout_ms ||
        !this.runner_data_directory)
    ) {
      throw new Error(
        "Runner interval and job cache timeout must be set when enabling runner"
      );
    }

    if (this.scheduler_enabled && !this.scheduler_interval_ms) {
      throw new Error("Scheduler interval must be set when enabling scheduler");
    }

    return {
      swim: {
        hostname: this.hostname,
        port: this.port,
        cluster_bootstrap_nodes: this.cluster_bootstrap_nodes ?? [],
      },
      api: this.api_enabled
        ? {
            open_api_docsite_enabled: this.open_api_docsite_enabled,
          }
        : null,
      orchestrator: this.orchestrator_enabled ? {} : null,
      runner: this.runner_enabled
        ? {
            interval_ms: this.runner_interval_ms,
            job_cache_timeout_ms: this.runner_job_cache_timeout_ms,
          }
        : null,
      scheduler: this.scheduler_enabled
        ? { interval_ms: this.scheduler_interval_ms }
        : null,
      sqlite:
        this.data_backend_type === "sqlite"
          ? {
              data_directory: resolve(
                process.cwd(),
                this.sqlite_data_directory ?? ".nqueue"
              ),
            }
          : null,
    };
  }

  async run(): Promise<void> {
    const config = this.create_config();
    Config.init(config);

    const app = express();

    app.use("/api/*splat", morgan("tiny"));

    const swim_db_url = resolve(
      process.cwd(),
      this.swim_data_directory ?? "./.nqueue",
      "swim.db"
    );

    await ensureDir(dirname(swim_db_url));

    const swim_db = create_swim_db(swim_db_url, this.automatically_migrate);

    new SwimSqlite(swim_db).start(app);

    if (this.runner_enabled) {
      const runner_db_url = resolve(
        process.cwd(),
        this.runner_data_directory ?? ".nqueue",
        "runner.db"
      );

      await ensureDir(dirname(runner_db_url));
      const runner_db = create_runner_db(
        runner_db_url,
        this.automatically_migrate
      );

      new SqliteRunner(runner_db).start(app);
    }

    if (this.data_backend_type === "sqlite") {
      const sqlite_db_url = resolve(
        process.cwd(),
        this.sqlite_data_directory ?? ".nqueue",
        "nqueue.db"
      );

      await ensureDir(dirname(sqlite_db_url));
      const sqlite_db = create_sqlite_db(
        sqlite_db_url,
        this.automatically_migrate
      );

      if (this.api_enabled) {
        new SqliteApi(sqlite_db).start(app);
      }

      if (this.orchestrator_enabled) {
        new SqliteOrchestrator(sqlite_db).start(app);
      }

      if (this.scheduler_enabled) {
        new SqliteScheduler(sqlite_db).start(app);
      }
    }

    app.listen(this.port!, () => {
      let message = `Server started at http://${this.hostname}:${this.port}`;

      if (this.open_api_docsite_enabled) {
        message += `\nOpenAPI documentation available at http://${this.hostname}:${this.port}/openapi/docs`;
      }

      logger.info(message);
    });
  }
}

export {
  ServerExecutor,
  open_api_spec,
  api_contract,
  ApiDriver,
  OrchestratorDriver,
  SchedulerDriver,
  RunnerDriver,
};
