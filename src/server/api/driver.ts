import { OpenAPIHandler } from "@orpc/openapi/node";
import { Express, static as express_static } from "express";
import { api_contract } from "./contract";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { StandardHandlerPlugin } from "@orpc/server/standard";
import { ZodSmartCoercionPlugin } from "@orpc/zod";
import { generation_options } from "./openapi";
import { Config } from "../config";
import { join, resolve } from "node:path";
import fs from "fs-extra";
import { logger } from "../logging";

const studio_html = `<!DOCTYPE html>
<html>
  <head>
    <title>NQueue Studio</title>
    <link rel="stylesheet" href="/studio/studio.css" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="manifest" href="/site.webmanifest" />
  </head>
  <body>
    <div id="root"></div>
    <script src="/studio/studio.js"></script>
  </body>
</html>
`;

export abstract class ApiDriver {
  constructor() {}

  private register_studio(app: Express) {
    if (Config.getInstance().get_api_config().live_reload) {
      logger.info("Enabling live reload");

      const livereload = require("livereload");
      const connect_livereload = require("connect-livereload");

      const live_server = livereload.createServer();
      live_server.watch(join(__dirname));

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

    app.use(express_static(resolve(__dirname, "./studio-public")));

    // since studio is a single page app, we need to handle all other routes
    // by serving the studio html file
    app.get("*splat", (_, res) => {
      res.writeHead(200, {
        "content-type": "text/html",
      });

      res.end(studio_html);
    });
  }

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
      this.register_studio(app);
    }
  }

  async start(app: Express) {
    this.register_routes(app);
  }
}
