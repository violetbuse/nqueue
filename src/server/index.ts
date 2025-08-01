import { isMainThread } from "node:worker_threads";
import { run_worker } from "./worker";

type ServerConfig = {};

export const run_server = async () => {
  if (!isMainThread) {
    await run_worker();
    return;
  }
};
