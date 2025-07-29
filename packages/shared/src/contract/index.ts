import { initContract } from "@ts-rest/core";
import { v1 } from "./v1";

const c = initContract();

export const contract = c.router({
    v1: v1,
}, {
    pathPrefix: "/api",
    strictStatusCodes: true,
})
