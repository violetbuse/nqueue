import { initServer } from "@ts-rest/express"
import { contract } from "shared"
import { StorageProvider } from "../db"


const createRouter = (storageProvider: StorageProvider) => {
    const s = initServer();

    const router = s.router(contract, {
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
