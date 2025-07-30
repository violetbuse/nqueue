import { initServer } from "@ts-rest/express"
import { contract } from "shared"
import { StorageProvider } from "../db"
import { createVersion1Router } from "./version_1"

const createRouter = (storageProvider: StorageProvider) => {
    const s = initServer();

    const router = s.router(contract, {
        version_1: createVersion1Router(storageProvider),
        getHealth: async () => {
            return {
                status: 200,
                body: undefined
            }
        }
    })

    return router;
}

export { createRouter }
