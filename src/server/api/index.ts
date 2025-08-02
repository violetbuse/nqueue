import type { Express } from "express";
import { ApiStorage } from "@/server/api/db";
import { Swim } from "@/server/swim";
import { register_cron_api_handlers } from "@/server/api/cron";

export type ApiOptions = {
  storage: ApiStorage;
  scheduler_address: string | (() => string) | (() => Promise<string>);
  swim: Swim | null;
};

export const register_api_handlers = (app: Express, options: ApiOptions) => {
  register_cron_api_handlers(app, options);
};
