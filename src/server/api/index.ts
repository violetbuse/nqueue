import type { Express } from "express";
import { ApiStorage } from "./db";
import { Swim } from "../swim";

export type ApiOptions = {
  storage: ApiStorage;
  swim: Swim | null;
};

export const register_api_handlers = (app: Express, options: ApiOptions) => {
  register_api_handlers(app, options);
};
