import { fmt_addr } from "@/utils/fmt-addr";
import { NodeTag } from "../swim/contract";

export type ConfigOptions = {
  swim: {
    hostname: string;
    port: number;
    cluster_bootstrap_nodes: string[];
  };
  api: {
    open_api_docsite_enabled: boolean;
  } | null;
  orchestrator: {} | null;
  runner: {
    interval_ms: number;
    job_cache_timeout_ms: number;
  } | null;
  scheduler: {
    interval_ms: number;
  } | null;
  sqlite: {
    data_directory: string;
  } | null;
};

export class Config {
  public static instance: Config | null = null;
  private config: ConfigOptions;

  private constructor(options: ConfigOptions) {
    this.config = options;
  }

  public static init(config: ConfigOptions): Config {
    if (Config.instance) {
      Config.instance.write(() => config);
      return Config.instance;
    }
    Config.instance = new Config(config);
    return Config.instance;
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      throw new Error("Config instance not initialized");
    }
    return Config.instance;
  }

  write(write_fn: (current: ConfigOptions) => ConfigOptions): void {
    this.config = write_fn(this.config);
  }

  local_address(): string {
    // return `http://${this.config.swim.hostname}:${this.config.swim.port}`;
    return fmt_addr(this.config.swim.hostname, this.config.swim.port);
  }

  get_tags(): NodeTag[] {
    return [
      this.config.api !== null ? "api" : null,
      this.config.orchestrator !== null ? "orchestrator" : null,
      this.config.runner !== null ? "runner" : null,
      this.config.scheduler !== null ? "scheduler" : null,
    ].filter((tag): tag is NodeTag => tag !== null);
  }

  get_swim_config(): NonNullable<ConfigOptions["swim"]> {
    return this.config.swim;
  }

  get_runner_config(): NonNullable<ConfigOptions["runner"]> {
    if (!this.config.runner) {
      throw new Error("Runner configuration is not initialized");
    }

    return this.config.runner;
  }

  get_scheduler_config(): NonNullable<ConfigOptions["scheduler"]> {
    if (!this.config.scheduler) {
      throw new Error("Scheduler configuration is not initialized");
    }

    return this.config.scheduler;
  }

  get_api_config(): NonNullable<ConfigOptions["api"]> {
    if (!this.config.api) {
      throw new Error("API configuration is not initialized");
    }

    return this.config.api;
  }

  get_orchestrator_config(): NonNullable<ConfigOptions["orchestrator"]> {
    if (!this.config.orchestrator) {
      throw new Error("Orchestrator configuration is not initialized");
    }

    return this.config.orchestrator;
  }

  get_sqlite_config(): NonNullable<ConfigOptions["sqlite"]> {
    if (!this.config.sqlite) {
      throw new Error("SQLite configuration is not initialized");
    }

    return this.config.sqlite;
  }
}
