import { ContractRouterClient } from "@orpc/contract";
import { swim_contract } from "./contract";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";

export const create_swim_client = (
  address: string,
): ContractRouterClient<typeof swim_contract> => {
  return createORPCClient(
    new RPCLink({
      url: address + "/swim",
    }),
  );
};
