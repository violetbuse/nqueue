import { initContract } from "@ts-rest/core";
import z from "zod";


const c = initContract();

const contract = c.router({
    publishMessage: {
        method: "POST",
        path: "/:destination",
        pathParams: z.object({
            destination: z.string().url()
        }),
        headers: z.object({
            'nqueue-method': z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']).default('GET'),
            'nqueue-delay': z.string().default('0'),
            'nqueue-retries': z.coerce.number().default(3),
            'nqueue-idempotency-key': z.string().optional(),
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
    pathPrefix: "/messages"
})

export { contract }