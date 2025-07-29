import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

const contract = c.router({
    getHealth: {
        method: "GET",
        path: "/health",
        responses: {
            200: c.noBody()
        }
    }
}, {
    commonResponses: {
        404: z.object({
            message: z.string()
        }),
        500: z.object({
            message: z.string()
        })
    },
    pathPrefix: "/api",
    strictStatusCodes: true,
})

export { contract }
