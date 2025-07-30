import { initContract } from "@ts-rest/core";
import z from "zod";

const c = initContract();

const contract = c.router({
    publishMessage: {
        method: "POST",
        path: "/publish/:destination",
        pathParams: z.object({
            destination: z.string().url()
        }),
        body: z.string().optional(),
        responses: {
            200: z.object({
                message_id: z.string(),
                message_url: z.string().url()
            })
        }
    }
}, {
    pathPrefix: "/v1",
    strictStatusCodes: true,
})

export const version_1 = contract;