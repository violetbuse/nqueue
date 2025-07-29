import { initContract } from "@ts-rest/core";

const c = initContract();

export const v1 = c.router({
    health: {
        method: "GET",
        path: "/health",
        responses: {
            200: c.noBody()
        }
    }
}, {
    pathPrefix: "/v1"
})
