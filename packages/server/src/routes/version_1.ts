import { initServer } from "@ts-rest/express";
import { contract } from "shared";
import { StorageProvider } from "../db";

const createVersion1Router = (storageProvider: StorageProvider) => {
    const s = initServer();

    const router = s.router(contract['version_1'], {
        publishMessage: async ({ body, params: { destination }, headers }) => {
            return {
                status: 200,
                body: {
                    message_id: "123",
                    message_url: "http://localhost:3000/messages/123"
                }
            }
        }
    })

    return router;
}

export { createVersion1Router }