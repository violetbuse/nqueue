import * as z from "zod";

export const job_description_schema = z.object({
  job_id: z.string(),
  planned_at: z.date(),
  data: z.object({
    url: z.url(),
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
    headers: z.record(z.string(), z.string()),
    body: z.string(),
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
      headers: z.record(z.string(), z.string()),
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
