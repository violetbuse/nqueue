import { Command, Option } from "commander";
import { render_tui } from "../tui";

export const client_command = new Command()
  .name("client")
  .description("Run the client for nqueue.")
  .addOption(
    new Option(
      "-a, --address <string>",
      "address of the neuque server"
    ).default("http://localhost:3000")
  )
  .action(async ({ address }) => {
    render_tui({
      api_address: address,
    });
  });
