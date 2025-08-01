import { isMainThread } from "node:worker_threads";
import { run_worker } from "./worker";
import express from "express";
import { Swim } from "./swim";
import { Database } from "./db";
import { start_orchestrator } from "./orchestrator";
import { start_runner } from "./runner";

type ServerConfig = {
  hostname: string;
  port: number;
  run_swim: boolean;
  orchestrator_address?: string | null;
  run_orchestrator: boolean;
  run_runner: boolean;
  run_scheduler: boolean;
  swim_bootstrap_addresses?: string[];
  database: Database;
};

export const run_server = async (config: ServerConfig) => {
  if (!isMainThread) {
    await run_worker();
    return;
  }

  const app = express();

  let swim_tags: string[] = [];

  if (config.run_swim) {
    swim_tags.push("swim");
  }

  if (config.run_orchestrator) {
    swim_tags.push("orchestrator");
  }

  if (config.run_runner) {
    swim_tags.push("runner");
  }

  if (config.run_scheduler) {
    swim_tags.push("scheduler");
  }

  const swim: Swim | null = config.run_swim
    ? Swim.start_swim(app, {
        local_node: `http://${config.hostname}:${config.port}`,
        nodes: config.swim_bootstrap_addresses ?? [],
        tags: swim_tags,
        interval: 1000,
      })
    : null;

  const get_orchestrator_address = async (): Promise<string> => {
    if (swim) {
      const swim_orchestrator = swim
        .get_alive_nodes()
        .filter((n) => n.tags.includes("orchestrator"))[0];
      if (swim_orchestrator) {
        return swim_orchestrator.address;
      } else if (config.orchestrator_address) {
        return config.orchestrator_address;
      } else if (config.run_orchestrator) {
        return `http://${config.hostname}:${config.port}`;
      } else {
        return new Promise<string>((resolve) => {
          setTimeout(async () => {
            const addr = await get_orchestrator_address();
            resolve(addr);
          }, 1000);
        });
      }
    } else if (config.run_orchestrator) {
      return `http://${config.hostname}:${config.port}`;
    } else if (config.orchestrator_address) {
      return config.orchestrator_address;
    } else {
      throw new Error("No orchestrator address found");
    }
  };

  if (config.run_orchestrator) {
    start_orchestrator(app, {
      storage: config.database.get_orchestrator_storage(),
      swim,
    });
  }

  if (config.run_runner) {
    start_runner(app, {
      storage: config.database.get_runner_storage(),
      cache: config.database.get_runner_cache(),
      swim,
      orchestrator_address: get_orchestrator_address,
      // thirty seconds
      job_result_invalidation_timeout: 30 * 1000,
      // drive every ten seconds
      interval: 1000 * 10,
    });
  }

  if (config.run_scheduler) {
    config.database.get_scheduler().start_scheduler(app);
  }

  app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
  });
};
