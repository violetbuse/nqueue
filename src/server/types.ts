import * as z from "zod";

export const http_method_schema = z.enum([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);
export const http_headers_schema = z
  .record(
    z.string().meta({ title: "Header Name" }),
    z.string().meta({ title: "Header Value" }),
  )
  .describe('Http headers as an object: {"header-name": "header-value"}')
  .meta({ examples: [{ "Content-Type": "application/json" }] });

export const job_description_schema = z.object({
  job_id: z.string(),
  planned_at: z.date(),
  data: z.object({
    url: z.url(),
    method: http_method_schema,
    headers: http_headers_schema,
    body: z.string().nullable(),
  }),
  timeout_ms: z.number(),
});

export type JobDescription = z.infer<typeof job_description_schema>;

export const job_result_schema = z.object({
  job_id: z.string(),
  planned_at: z.date(),
  attempted_at: z.date(),
  duration_ms: z.number(),
  data: z
    .object({
      status_code: z.number(),
      headers: http_headers_schema,
      body: z.string(),
    })
    .nullable(),
  timed_out: z.boolean().default(false),
  error: z.string().nullable().default(null),
});

export type JobResult = z.infer<typeof job_result_schema>;

export const worker_data_schema = z.discriminatedUnion("worker_type", [
  z.object({
    worker_type: z.literal("run_job"),
    job: job_description_schema,
  }),
]);

export type WorkerData = z.infer<typeof worker_data_schema>;
