import { oc } from "@orpc/contract";
import { z } from "zod";
import {
  cron_job_schema,
  message_scheduling,
  message_schema,
  queue_schema,
  scheduled_job_schema,
} from "./schemas";
import { http_headers_schema, http_method_schema } from "../types";

const create_cron_job = oc
  .route({
    method: "POST",
    path: "/api/cron",
    description: "Create a new cron job.",
    tags: ["Cron Jobs"],
  })
  .input(
    z.object({
      expression: z
        .string()
        .describe("The cron expression: does not support a seconds place."),
      url: z.url(),
      method: http_method_schema.default("GET"),
      headers: http_headers_schema.optional(),
      body: z.string().nullable().optional(),
      timeout_ms: z.number().default(1_000),
    }),
  )
  .output(cron_job_schema);

const list_cron_jobs = oc
  .route({
    method: "GET",
    path: "/api/cron",
    description: "List cron jobs.",
    tags: ["Cron Jobs"],
  })
  .input(
    z
      .object({
        limit: z.coerce.number().int().positive().max(200).default(50).optional(),
        offset: z.coerce.number().int().min(0).default(0).optional(),
      })
      .default({}),
  )
  .output(
    z.object({
      items: z.array(cron_job_schema),
      total: z.number().int(),
      limit: z.number().int(),
      offset: z.number().int(),
    }),
  );

const update_cron_job = oc
  .route({
    method: "POST",
    path: "/api/cron/{cron_id}",
    description: "Update an existing cron job.",
    tags: ["Cron Jobs"],
  })
  .input(
    z.object({
      cron_id: z.string(),
      expression: z
        .string()
        .describe("The cron expression: does not support a seconds place.")
        .optional(),
      url: z.url().optional(),
      method: http_method_schema.optional(),
      headers: http_headers_schema.optional(),
      body: z.string().nullable().optional(),
      timeout_ms: z.number().optional(),
    }),
  )
  .output(cron_job_schema);

const delete_cron_job = oc
  .route({
    method: "DELETE",
    path: "/api/cron/{cron_id}",
    description: "Disable an existing cron job.",
    tags: ["Cron Jobs"],
  })
  .input(
    z.object({
      cron_id: z.string(),
    }),
  )
  .output(cron_job_schema);

const get_cron_job = oc
  .route({
    method: "GET",
    path: "/api/cron/{cron_id}",
    description: "Get an existing cron job.",
    tags: ["Cron Jobs"],
  })
  .input(
    z.object({
      cron_id: z.string(),
    }),
  )
  .output(cron_job_schema.nullable());

const create_queue = oc
  .route({
    method: "POST",
    path: "/api/queue",
    description: "Create a new queue.",
    tags: ["Queues"],
  })
  .input(
    z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      request_count: z
        .number()
        .describe(
          "The number of requests to be processed in the queue per time period.",
        ),
      time_period_seconds: z
        .number()
        .describe(
          "The time period in seconds against which the queue should rate limit requests.",
        ),
    }),
  )
  .output(queue_schema);

const list_queues = oc
  .route({
    method: "GET",
    path: "/api/queue",
    description: "List queues.",
    tags: ["Queues"],
  })
  .input(
    z
      .object({
        limit: z.coerce.number().int().positive().max(200).default(50).optional(),
        offset: z.coerce.number().int().min(0).default(0).optional(),
      })
      .default({}),
  )
  .output(
    z.object({
      items: z.array(queue_schema),
      total: z.number().int(),
      limit: z.number().int(),
      offset: z.number().int(),
    }),
  );

const get_queue = oc
  .route({
    method: "GET",
    path: "/api/queue/{queue_id}",
    description: "Get an existing queue.",
    tags: ["Queues"],
  })
  .input(
    z.object({
      queue_id: z.string(),
    }),
  )
  .output(queue_schema.nullable());

const update_queue = oc
  .route({
    method: "PUT",
    path: "/api/queue/{queue_id}",
    description: "Update an existing queue.",
    tags: ["Queues"],
  })
  .input(
    z.object({
      queue_id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      request_count: z
        .number()
        .describe(
          "The number of requests to be processed in the queue per time period.",
        )
        .optional(),
      time_period_seconds: z
        .number()
        .describe(
          "The time period in seconds against which the queue should rate limit requests.",
        )
        .optional(),
    }),
  )
  .output(queue_schema);

const delete_queue = oc
  .route({
    method: "DELETE",
    path: "/api/queue/{queue_id}",
    description: "Disable an existing queue.",
    tags: ["Queues"],
  })
  .input(
    z.object({
      queue_id: z.string(),
    }),
  )
  .output(queue_schema);

const create_message = oc
  .route({
    method: "POST",
    path: "/api/messages",
    description: "Create a new message in the queue.",
    tags: ["Messages"],
  })
  .input(
    z.object({
      url: z.string(),
      method: http_method_schema.default("GET"),
      headers: http_headers_schema.optional(),
      body: z.string().nullable().optional(),
      timeout_ms: z.number().default(1_000),
      scheduling: message_scheduling.default({ wait_seconds: 30 }),
    }),
  )
  .output(message_schema);

const list_messages = oc
  .route({
    method: "GET",
    path: "/api/messages",
    description: "List messages.",
    tags: ["Messages"],
  })
  .input(
    z
      .object({
        limit: z.coerce.number().int().positive().max(200).default(50).optional(),
        offset: z.coerce.number().int().min(0).default(0).optional(),
      })
      .default({}),
  )
  .output(
    z.object({
      items: z.array(message_schema),
      total: z.number().int(),
      limit: z.number().int(),
      offset: z.number().int(),
    }),
  );

const get_message = oc
  .route({
    method: "GET",
    path: "/api/messages/{message_id}",
    description: "Get an existing message.",
    tags: ["Messages"],
  })
  .input(
    z.object({
      message_id: z.string(),
    }),
  )
  .output(message_schema.nullable());

const get_scheduled_jobs = oc
  .route({
    method: "GET",
    path: "/api/scheduled",
    description: "Get the scheduled jobs.",
    tags: ["Scheduled Jobs"],
  })
  .input(
    z.object({
      planned_before: z.number().optional(),
      planned_after: z.number().optional(),
    }),
  )
  .output(z.array(scheduled_job_schema));

const get_scheduled_job = oc
  .route({
    method: "GET",
    path: "/api/scheduled/{job_id}",
    description: "Get an existing scheduled job.",
    tags: ["Scheduled Jobs"],
  })
  .input(
    z.object({
      job_id: z.string(),
    }),
  )
  .output(scheduled_job_schema.nullable());

export const api_contract = {
  // cron jobs
  create_cron_job,
  list_cron_jobs,
  get_cron_job,
  update_cron_job,
  delete_cron_job,

  // queues
  create_queue,
  list_queues,
  get_queue,
  update_queue,
  delete_queue,

  // messages
  create_message,
  list_messages,
  get_message,

  // scheduled jobs
  get_scheduled_jobs,
  get_scheduled_job,
};
