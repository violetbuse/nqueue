import { OpenAPIGenerator } from "@orpc/openapi";
import { api_contract } from "./api/contract";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import packageJson from "../../package.json";

const generator = new OpenAPIGenerator({
  schemaConverters: [new ZodToJsonSchemaConverter()],
});

const open_api_spec = generator.generate(api_contract, {
  info: {
    title: "NQueue",
    version: packageJson.version,
  },
});

export { api_contract, open_api_spec };
