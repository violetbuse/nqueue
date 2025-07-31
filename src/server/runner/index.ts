import express from "express";
import { Swim, SwimOptions } from "./swim";

const app = express();

app.use(express.json());

export const run_server = (port: number) => {
  app.listen(port);
};

let swim_timer_instance: NodeJS.Timeout | undefined = undefined;

export const run_swim = (options: SwimOptions) => {
  const swim = new Swim(options);
  swim.register_handlers(app);

  if (swim_timer_instance) {
    clearInterval(swim_timer_instance);
  }

  swim_timer_instance = setInterval(() => swim.drive(), options.interval);
};
