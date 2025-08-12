import { ContractRouterClient } from "@orpc/contract";
import { orchestrator_contract } from "./contract";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";

export const create_orchestrator_client = (
  address: string
): ContractRouterClient<typeof orchestrator_contract> => {
  return createORPCClient(
    new RPCLink({
      url: address + "/orchestrator",
    })
  );
};
