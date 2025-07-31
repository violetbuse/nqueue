import * as z from "zod";

export const job_description_schema = z.object({
  job_id: z.string(),
  planned_at: z.number(),
  data: z.object({
    url: z.url(),
    method: z.enum([
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "HEAD",
      "OPTIONS",
    ]),
    headers: z.record(z.string(), z.string()),
    body: z.string(),
  }),
  timeout: z.number(),
});

export type JobDescription = z.infer<typeof job_description_schema>;

export const job_result_schema = z.object({
  job_id: z.string(),
  planned_at: z.number(),
  attempted_at: z.number(),
  data: z
    .object({
      status_code: z.number(),
      headers: z.record(z.string(), z.string()),
      body: z.string(),
    })
    .nullable(),
  timed_out: z.boolean().default(false),
});

export type JobResult = z.infer<typeof job_result_schema>;
