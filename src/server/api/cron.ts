import type { Express } from "express";
import * as z from "zod";
import { ApiOptions } from ".";
import { Request, Response } from "express";
import { shared_job_schema } from "./db";
import CronExpressionParser from "cron-parser";

const handle_create_cron_job = async (
  options: ApiOptions,
  req: Request,
  res: Response,
) => {
  try {
    const { expression, ...job } = await z
      .object({
        expression: z.string(),
        ...shared_job_schema.shape,
      })
      .parseAsync(req.body);

    if (expression.split(" ").length !== 5) {
      res
        .status(400)
        .json({ error: "Seconds-level cron expressions not supported" });

      return;
    }

    try {
      CronExpressionParser.parse(expression, {
        strict: true,
      });
    } catch (error: any) {
      res.status(400).json({
        error:
          "Invalid cron expression. cron-parser strict mode expressions are supported. " +
          error.message,
      });

      return;
    }

    const [id, err] = await options.storage.cron.create(expression, job);

    if (err || !id) {
      res.status(500).json({ error: err ?? "Unknown error" });
    }

    res.status(200).json({ cron_id: id });
  } catch (error: any) {
    console.error(`Error creating cron job: ${error.message ?? "<unknown>"}`);
    res.status(500).json({ error: error.message ?? "<unknown>" });
  }
};

export const register_cron_api_handlers = (
  app: Express,
  options: ApiOptions,
) => {
  app.post("/api/cron", (req, res) =>
    handle_create_cron_job(options, req, res),
  );
};
