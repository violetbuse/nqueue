import { run_server } from "@/server";

export const run_server_command = async () => {
    await run_server();
};

export const print_server_help = () => {
    console.log(`nqueue server

Usage:
  nqueue server

Description:
  Starts the nqueue API server.
`);
};


