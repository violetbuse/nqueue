import { create_api_client } from "@/server/api/client";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

const client = create_api_client(window.location.origin);

export const studio = createTanstackQueryUtils(client);
