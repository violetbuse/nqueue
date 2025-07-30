// Client library entry point
// Export your client-side utilities, components, and functions here

import { initClient } from "@ts-rest/core"
import { contract } from "shared"

type BaseClient = ReturnType<typeof createBaseClient>

type CreateClientOptions = {
    apiKey: string | (() => string)
}

export const createBaseClient = (options: CreateClientOptions) => {
    return initClient(contract, {
        baseUrl: "http://localhost:3000",
        validateResponse: true,
        throwOnUnknownStatus: true,
        jsonQuery: true,
        baseHeaders: {
            authorization: () => {
                const apiKey = typeof options.apiKey === "function" ? options.apiKey() : options.apiKey
                return `Bearer ${apiKey}`
            }
        }
    })
}