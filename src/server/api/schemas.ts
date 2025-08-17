import { z } from "zod";
import { http_headers_schema, http_method_schema } from "../types";

export const cron_job_schema = z.object({
  id: z.string().startsWith("cron_"),
  expression: z.string().describe("* * * * *"),
  url: z.url().describe("The URL to send the request to"),
  method: http_method_schema,
  headers: http_headers_schema,
  body: z.string().nullable(),
  timeout_ms: z.number(),
});

export const queue_schema = z.object({
  id: z.string().startsWith("queue_"),
  name: z.string().nullable(),
  description: z.string().nullable(),
  requests_per_period: z.number(),
  period_length_secs: z.number(),
});

export const message_scheduling = z
  .union([
    z
      .object({
        queue_id: z
          .string()
          .describe("The id of the queue to publish this message in."),
      })
      .meta({ title: "Insert in queue" }),
    z
      .object({
        wait_seconds: z
          .number()
          .min(0)
          .describe("The number of seconds to wait before publishing."),
      })
      .meta({ title: "Wait x seconds" }),
    z
      .object({
        wait_until: z
          .number()
          .describe("The UNIX timestamp at which to publish this message."),
      })
      .meta({ title: "Publish at timestamp" }),
  ])
  .describe(
    "Choose between adding to a queue, waiting x seconds, and publishing at a specific timestamp. Default: wait 30 seconds"
  );
export const message_schema = z.object({
  id: z.string().startsWith("message_"),
  url: z.url(),
  method: http_method_schema,
  headers: http_headers_schema,
  body: z.string().nullable(),
  timeout_ms: z.number(),
  scheduling: message_scheduling,
});

export const scheduled_job_schema = z.object({
  id: z.string().startsWith("scheduled_"),
  planned_at: z.number().describe("UNIX timestamp of planned execution date"),
  timeout_ms: z.number(),
  request: z.object({
    url: z.url(),
    method: http_method_schema,
    headers: http_headers_schema,
    body: z.string().nullable(),
  }),
  response: z
    .union([
      z.object({
        status_code: z.number().int(),
        headers: http_headers_schema,
        body: z.string().nullable(),
        executed_at: z.number().int(),
        timed_out: z.boolean(),
        error: z.string().nullable(),
      }),
      z.object({
        status_code: z.null(),
        headers: z.null(),
        body: z.null(),
        executed_at: z.number(),
        timed_out: z.boolean(),
        error: z.string().nullable(),
      }),
    ])
    .nullable(),
});
