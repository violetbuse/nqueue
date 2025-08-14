import { OpenAPIHandler } from "@orpc/openapi/node";
import type { Express } from "express";
import { api_contract } from "./contract";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { StandardHandlerPlugin } from "@orpc/server/standard";
import { ZodSmartCoercionPlugin } from "@orpc/zod";
import { generation_options } from "./openapi";
import { Config } from "../config";
import { join } from "node:path";
import fs from "fs-extra";
import { logger } from "../logging";

const studio_html = `<!DOCTYPE html>

<html>
  <head>
    <title>NQueue Studio</title>
    <link rel="stylesheet" href="/studio/studio.css" />
  </head>
  <body>
    <div id="root"></div>
    <script src="/studio/studio.js"></script>
  </body>
</html>
`;

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

    if (Config.getInstance().get_api_config().studio_enabled) {
      if (Config.getInstance().get_api_config().live_reload) {
        logger.info("Enabling live reload");

        const livereload = require("livereload");
        const connect_livereload = require("connect-livereload");

        const live_server = livereload.createServer();
        live_server.watch(join(__dirname));
        live_server.server.once("connection", () => {
          setTimeout(() => {
            live_server.refresh("/");
          }, 100);
        });

        app.use(connect_livereload());
      }

      app.get("/", (_, res) => {
        res.writeHead(200, {
          "content-type": "text/html",
        });
        res.end(studio_html);
      });

      app.get("/studio/studio.js", async (_, res) => {
        res.writeHead(200, {
          "content-type": "application/javascript",
        });

        const studio_js = await fs.readFile(join(__dirname, "studio.js"));

        res.end(studio_js);
      });

      app.get("/studio/studio.css", async (_, res) => {
        res.writeHead(200, {
          "content-type": "text/css",
        });

        const studio_css = await fs.readFile(join(__dirname, "studio.css"));

        res.end(studio_css);
      });
    }
  }

  async start(app: Express) {
    this.register_routes(app);
  }
}
