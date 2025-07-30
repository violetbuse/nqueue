import { initContract } from "@ts-rest/core";

const c = initContract();

const contract = c.router({
}, {
    pathPrefix: "/v1",
    strictStatusCodes: true,
})

export const version_1 = contract;