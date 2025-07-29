// Client library entry point
// Export your client-side utilities, components, and functions here

import { initClient } from "@ts-rest/core"
import { contract } from "shared"

export const createClient = () => {
    return initClient(contract, {
        baseUrl: "http://localhost:3000"
    })
}
