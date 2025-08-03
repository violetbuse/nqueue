import { ContractRouterClient } from "@orpc/contract";
import { api_contract } from "./contract";
import { createORPCClient } from "@orpc/client";
import { OpenAPILink } from "@orpc/openapi-client/fetch";

export const create_api_client = (
  address: string,
): ContractRouterClient<typeof api_contract> => {
  return createORPCClient(
    new OpenAPILink(api_contract, {
      url: address,
    }),
  );
};
