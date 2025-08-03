import { OpenAPIGeneratorGenerateOptions } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { OpenAPIGenerator } from "@orpc/openapi";
import { api_contract } from "./contract";
import package_json from "../../../package.json";
import {
  cron_job_schema,
  queue_schema,
  message_schema,
  scheduled_job_schema,
} from "./schemas";

export const generation_options: OpenAPIGeneratorGenerateOptions = {
  info: {
    title: "NQueue API",
    version: package_json.version,
  },
  commonSchemas: {
    CronJob: {
      schema: cron_job_schema,
      strategy: "output",
    },
    Queue: {
      schema: queue_schema,
      strategy: "output",
    },
    Message: {
      schema: message_schema,
      strategy: "output",
    },
    ScheduledJob: {
      schema: scheduled_job_schema,
      strategy: "output",
    },
  },
};

const generator = new OpenAPIGenerator({
  schemaConverters: [new ZodToJsonSchemaConverter()],
});

export const open_api_spec = generator.generate(api_contract);
