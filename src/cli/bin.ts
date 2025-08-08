#!/usr/bin/env node

import { isMainThread } from "node:worker_threads";
import { run_worker } from "@/server/worker";
import { run_server } from "@/server";
import { render_app } from "@/cli/app";
import { docs_page } from "@/cli/docs";

const main = async () => {
  if (!isMainThread) {
    await run_worker();
    process.exit(0);
  }

  const argv = process.argv.slice(2);

  const getFlag = (name: string): string | undefined => {
    const prefix = `${name}=`;
    const entry = argv.find((a) => a.startsWith(prefix));
    return entry ? entry.slice(prefix.length) : undefined;
  };

  const showHelp = () => {
    console.log(`nqueue CLI

Usage:
  nqueue server                          Start the API server
  nqueue client [--address=URL]           Start TUI client (default http://localhost:1337)
  nqueue docs [--port=PORT]               Serve API docs (default 8787)
  nqueue dev [--docs-port=PORT]           Start API server and docs together

Options:
  --address=URL                           Override server address for client
  --port=PORT                             Port for docs server
  --docs-port=PORT                        Port for docs in dev mode
`);
  };

  if (argv.includes("--help") || argv.includes("-h") || argv[0] === "help") {
    showHelp();
    process.exit(0);
  }

  // Back-compat: if user passes --client, treat as `client` command
  let command = argv.find((a) => !a.startsWith("--")) ?? (argv.includes("--client") ? "client" : undefined);

  // If the first arg is an option, default to server
  if (!command) {
    command = "server";
  }

  switch (command) {
    case "client": {
      const address = getFlag("--address") ?? process.env["NQUEUE_ADDRESS"] ?? "http://localhost:1337";
      render_app({ address });
      return;
    }
    case "docs": {
      const portStr = getFlag("--port") ?? process.env["PORT"] ?? "8787";
      const port = Number(portStr);
      docs_page(Number.isFinite(port) && port > 0 ? port : 8787);
      return;
    }
    case "dev": {
      const docsPortStr = getFlag("--docs-port") ?? process.env["DOCS_PORT"] ?? "8787";
      const docsPort = Number(docsPortStr);
      // Start server and docs together in the same process
      void run_server();
      docs_page(Number.isFinite(docsPort) && docsPort > 0 ? docsPort : 8787);
      return;
    }
    case "server": {
      await run_server();
      return;
    }
    case "help":
    case "-h":
    case "--help":
    default: {
      showHelp();
      process.exit(command === "help" || command === "-h" || command === "--help" ? 0 : 1);
    }
  }
};

main();
