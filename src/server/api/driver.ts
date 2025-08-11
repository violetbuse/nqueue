import { OpenAPIHandler } from "@orpc/openapi/node";
import type { Express } from "express";
import { api_contract } from "./contract";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { StandardHandlerPlugin } from "@orpc/server/standard";
import { ZodSmartCoercionPlugin } from "@orpc/zod";
import { generation_options } from "./openapi";
import { Config } from "../config";

export abstract class ApiDriver {
  constructor() {}

  abstract implement_routes(
    contract: typeof api_contract,
    plugins: StandardHandlerPlugin<{}>[]
  ): OpenAPIHandler<{}>;

  private register_routes(app: Express) {
    let plugins: StandardHandlerPlugin<{}>[] = [new ZodSmartCoercionPlugin()];

    if (Config.getInstance().get_api_config().open_api_docsite_enabled) {
      plugins.push(
        new OpenAPIReferencePlugin({
          docsPath: "/openapi/docs",
          specPath: "/openapi/spec",
          schemaConverters: [new ZodToJsonSchemaConverter()],
          specGenerateOptions: generation_options,
        })
      );
    }

    const router = this.implement_routes(api_contract, plugins);

    app.use(async (req, res, next) => {
      const { matched } = await router.handle(req, res);

      if (matched) {
        return;
      }

      next();
    });
  }

  async start(app: Express) {
    this.register_routes(app);
  }
}
