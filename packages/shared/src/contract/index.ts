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
        401: z.object({
            code: z.enum(['UNAUZTHORIZED']),
            message: z.string()
        }),
        404: z.object({
            code: z.enum(['NOT_FOUND']),
            message: z.string()
        }),
        500: z.object({
            code: z.enum(['INTERNAL_SERVER_ERROR']),
            message: z.string()
        })
    },
    baseHeaders: z.object({
        authorization: z.string().startsWith("Bearer ").transform(v => v.slice(7))
    }),
    pathPrefix: "/api",
    strictStatusCodes: true,
})

export { contract }
