#!/usr/bin/env node

import { isMainThread } from "node:worker_threads";
import { run_worker } from "@/server/worker";
import { run_server_command, print_server_help } from "@/cli/commands/server";
import { run_client_command, print_client_help } from "@/cli/commands/client";
import { run_docs_command, print_docs_help } from "@/cli/commands/docs";
import { run_dev_command, print_dev_help } from "@/cli/commands/dev";
import { run_test_server_command, print_test_server_help } from "@/cli/commands/test_server";

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
  nqueue test-server [--port=PORT]        Start echo test server (default 3000)

Options:
  --address=URL                           Override server address for client
  --port=PORT                             Port for docs server
  --docs-port=PORT                        Port for docs in dev mode
  --port=PORT                             Port for test server (env TEST_SERVER_PORT)
`);
  };

  if (argv.includes("--help") || argv.includes("-h") || argv[0] === "help") {
    // If a specific command is mentioned, show its help
    const cmd = argv.find((a) => !a.startsWith("--") && a !== "help");
    if (cmd) {
      switch (cmd) {
        case "server":
          print_server_help();
          break;
        case "client":
          print_client_help();
          break;
        case "docs":
          print_docs_help();
          break;
        case "dev":
          print_dev_help();
          break;
        case "test-server":
          print_test_server_help();
          break;
        default:
          showHelp();
      }
    } else {
      showHelp();
    }
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
      if (argv.includes("--help") || argv.includes("-h")) {
        print_client_help();
        process.exit(0);
      }
      const address = getFlag("--address") ?? process.env["NQUEUE_ADDRESS"] ?? "http://localhost:1337";
      run_client_command({ address });
      return;
    }
    case "docs": {
      if (argv.includes("--help") || argv.includes("-h")) {
        print_docs_help();
        process.exit(0);
      }
      const portStr = getFlag("--port") ?? process.env["PORT"] ?? "8787";
      const port = Number(portStr);
      run_docs_command({ port: Number.isFinite(port) && port > 0 ? port : 8787 });
      return;
    }
    case "dev": {
      if (argv.includes("--help") || argv.includes("-h")) {
        print_dev_help();
        process.exit(0);
      }
      const docsPortStr = getFlag("--docs-port") ?? process.env["DOCS_PORT"] ?? "8787";
      const docsPort = Number(docsPortStr);
      run_dev_command({ docsPort: Number.isFinite(docsPort) && docsPort > 0 ? docsPort : 8787 });
      return;
    }
    case "server": {
      if (argv.includes("--help") || argv.includes("-h")) {
        print_server_help();
        process.exit(0);
      }
      await run_server_command();
      return;
    }
    case "test-server": {
      if (argv.includes("--help") || argv.includes("-h")) {
        print_test_server_help();
        process.exit(0);
      }
      const portStr = getFlag("--port") ?? process.env["TEST_SERVER_PORT"] ?? "3000";
      const port = Number(portStr);
      run_test_server_command({ port: Number.isFinite(port) && port > 0 ? port : 3000 });
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
