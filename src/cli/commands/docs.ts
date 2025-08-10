import { open_api_spec } from "@/server";
import { Command, Option } from "commander";
import open from "open"
import express from "express";

const app = express();

app.get("/spec.json", async (_, res) => {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify(await open_api_spec));
});

const html = `
  <!doctype html>
    <html>
      <head>
        <title>My Client</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="https://orpc.unnoq.com/icon.svg" />
      </head>
      <body>
        <div id="app"></div>

        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
        <script>
          Scalar.createApiReference('#app', {
            url: '/spec.json',
            authentication: {
              securitySchemes: {
                bearerAuth: {
                  token: 'default-token',
                },
              },
            },
          })
        </script>
      </body>
    </html>
  `;

app.get("/", async (_, res) => {
  res.writeHead(200, { "content-type": "text/html" });
  res.end(html);
});

const serve_docs_page = (port: number) => {
  app.listen(port, () => {
    console.log(`View docs at http://localhost:${port}`);
  });
};

export const docs_command = new Command()
  .name("docs")
  .description("View the http api docs.")
  .addOption(new Option('-p, --port <number>', 'port to serve the docs on').default(3000).argParser(parseInt))
  .action(({ port }) => {
    serve_docs_page(port)
    open(`http://localhost:${port}/`)
  })
