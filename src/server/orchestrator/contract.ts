import { oc } from "@orpc/contract";
import { z } from "zod";
import { job_description_schema, job_result_schema } from "../types";

const request_job_assignments = oc
  .route({ method: "GET", path: "/orchestrator/jobs/request" })
  .input(
    z.object({
      runner_id: z.string(),
    }),
  )
  .output(z.array(job_description_schema));

const reject_job_assignment = oc
  .route({ method: "POST", path: "/orchestrator/jobs/reject/{job_id}" })
  .input(z.object({ job_id: z.string() }))
  .output(z.object({ success: z.boolean() }));

const submit_job_result = oc
  .route({ method: "POST", path: "/orchestrator/jobs/results" })
  .input(job_result_schema)
  .output(z.object({ success: z.boolean() }));

const submit_job_results = oc
  .route({ method: "POST", path: "/orchestrator/jobs/results/batch" })
  .input(z.array(job_result_schema))
  .output(z.object({ success: z.boolean() }));

export const orchestrator_contract = {
  request_job_assignments,
  reject_job_assignment,
  submit_job_result,
  submit_job_results,
};
