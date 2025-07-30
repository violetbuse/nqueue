import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { version_1 } from "./version_1";

const c = initContract();

const contract = c.router({
    version_1,
    getHealth: {
        method: "GET",
        path: "/health",
        responses: {
            200: c.noBody()
        }
    },
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

export { contract, version_1 }
