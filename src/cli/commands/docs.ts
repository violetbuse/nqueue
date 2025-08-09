import { docs_page } from "@/cli/docs";

export const run_docs_command = (options?: { port?: number }) => {
    const port = options?.port ?? Number(process.env["PORT"] ?? "8787");
    const safePort = Number.isFinite(port) && port > 0 ? port : 8787;
    docs_page(safePort);
};

export const print_docs_help = () => {
    console.log(`nqueue docs

Usage:
  nqueue docs [--port=PORT]

Options:
  --port=PORT               Port for docs server (default 8787)

Environment:
  PORT                      Default port for docs server
`);
};


