import { initServer } from "@ts-rest/express";
import { contract } from "shared";
import { StorageProvider } from "../../db";

const createV1MessagesRouter = (storageProvider: StorageProvider) => {
    const s = initServer();

    return s.router(contract['version_1']['messages'], {
        publishMessage: async ({ body, params: { destination }, headers }) => {

            const authorization = headers.authorization;
            const delay = headers['nqueue-delay'];
            const retries = headers['nqueue-retries'];
            const method = headers['nqueue-method'];
            const idempotencyKey = headers['nqueue-idempotency-key'];

            return {
                status: 200,
                body: {
                    message_id: "123",
                    message_url: "http://localhost:3000/messages/123"
                }
            }
        }
    })
}

export { createV1MessagesRouter }