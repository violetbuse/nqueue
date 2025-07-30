import { initServer } from "@ts-rest/express";
import { contract } from "shared";
import { StorageProvider } from "../../db";
import { createV1MessagesRouter } from "./messages";

const createVersion1Router = (storageProvider: StorageProvider) => {
    const s = initServer();

    return s.router(contract['version_1'], {
        messages: createV1MessagesRouter(storageProvider)
    })
}

export { createVersion1Router }