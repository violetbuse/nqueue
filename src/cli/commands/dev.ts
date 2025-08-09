import { run_server } from "@/server";
import { docs_page } from "@/cli/docs";

export const run_dev_command = (options?: { docsPort?: number }) => {
    const docsPort = options?.docsPort ?? Number(process.env["DOCS_PORT"] ?? "8787");
    const safeDocsPort = Number.isFinite(docsPort) && docsPort > 0 ? docsPort : 8787;

    void run_server();
    docs_page(safeDocsPort);
};

export const print_dev_help = () => {
    console.log(`nqueue dev

Usage:
  nqueue dev [--docs-port=PORT]

Options:
  --docs-port=PORT          Port for docs server (default 8787)

Environment:
  DOCS_PORT                 Default port for docs while running dev
`);
};


