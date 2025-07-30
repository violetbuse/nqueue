import { initContract } from "@ts-rest/core";
import z from "zod";
import { contract as messages } from "./messages";

const c = initContract();

const contract = c.router({
    messages: messages
}, {
    pathPrefix: "/v1"
})

export const version_1 = contract;