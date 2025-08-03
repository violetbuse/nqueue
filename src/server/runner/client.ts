import { ContractRouterClient } from "@orpc/contract";
import { runner_contract } from "./contract";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";

export const create_runner_client = (
  address: string,
): ContractRouterClient<typeof runner_contract> => {
  return createORPCClient(
    new RPCLink({
      url: address + "/runner",
    }),
  );
};
