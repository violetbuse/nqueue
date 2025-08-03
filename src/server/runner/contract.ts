import { oc } from "@orpc/contract";
import { z } from "zod";
import { job_result_schema } from "../types";

const cache_job_result = oc
  .route({ method: "POST", path: "/runner/cache/results/{job_id}" })
  .input(job_result_schema)
  .output(z.null());

const remove_job = oc
  .route({ method: "DELETE", path: "/runner/cache/results/{job_id}" })
  .output(z.null());

export const runner_contract = {
  cache_job_result,
  remove_job,
};
