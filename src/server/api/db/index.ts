import * as z from "zod";

export const shared_job_schema = z.object({
  url: z.url(),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  headers: z.record(z.string(), z.string()),
  body: z.string(),
  metadata: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean()]),
  ),
});

export type SharedJobSchema = z.infer<typeof shared_job_schema>;

export interface ApiStorage {
  cron: ApiCronStorage;
}

export interface ApiCronStorage {
  create: (
    expression: string,
    job: SharedJobSchema,
  ) => Promise<[string, null] | [null, string]>;
}
