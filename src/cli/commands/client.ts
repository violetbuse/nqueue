import { render_app } from "@/cli/app";

export const run_client_command = (options?: { address?: string }) => {
    const address = options?.address ?? process.env["NQUEUE_ADDRESS"] ?? "http://localhost:1337";
    render_app({ address });
};

export const print_client_help = () => {
    console.log(`nqueue client

Usage:
  nqueue client [--address=URL]

Options:
  --address=URL             Server address for the TUI client

Environment:
  NQUEUE_ADDRESS            Default server address (overridden by --address)
`);
};


