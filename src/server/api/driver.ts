import { OpenAPIHandler } from "@orpc/openapi/node";
import type { Express } from "express";
import { api_contract } from "./contract";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import package_json from "../../../package.json";
import { StandardHandlerPlugin } from "@orpc/server/standard";
import { ZodSmartCoercionPlugin } from "@orpc/zod";

export abstract class ApiDriver {
  constructor() {}

  abstract implement_routes(
    contract: typeof api_contract,
    plugins: StandardHandlerPlugin<{}>[],
  ): OpenAPIHandler<{}>;

  private register_routes(app: Express) {
    const plugins = [
      new ZodSmartCoercionPlugin(),
      new OpenAPIReferencePlugin({
        schemaConverters: [new ZodToJsonSchemaConverter()],
        specGenerateOptions: {
          info: {
            title: "NQueue API",
            version: package_json.version,
          },
        },
      }),
    ];

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
