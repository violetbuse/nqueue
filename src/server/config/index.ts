type ConfigOptions = {
  hostname: string;
  port: number;
  cluster_bootstrap_nodes: string[];
  run_scheduler: boolean;
  run_orchestrator: boolean;
  run_api: boolean;
  run_runner: boolean;
  runner: {
    interval_ms: number;
    job_cache_timeout_ms: number;
  };
};

export class Config {
  public static instance: Config | null = null;
  private config: ConfigOptions;

  private constructor(options: ConfigOptions) {
    this.config = options;
  }

  public static init(config: ConfigOptions): Config {
    if (Config.instance) {
      Config.instance.write(config);
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

  write(config: ConfigOptions): void {
    this.config = config;
  }

  read(): ConfigOptions {
    return this.config;
  }

  local_address(): string {
    return `${this.config.hostname}:${this.config.port}`;
  }
}
