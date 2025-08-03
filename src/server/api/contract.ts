import { oc } from "@orpc/contract";
import { z } from "zod";

const create_cron_job = oc
  .route({ method: "POST", path: "/api/cron" })
  .input(z.null())
  .output(z.object({ cron_id: z.string() }));

export const api_contract = {
  create_cron_job,
};
