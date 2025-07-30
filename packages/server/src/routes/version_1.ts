import { initServer } from "@ts-rest/express";
import { version_1 } from "shared";
import { StorageProvider } from "../db";

const createVersion1Router = (storageProvider: StorageProvider) => {
    const s = initServer();

    const router = s.router(version_1, {})

    return router;
}

export { createVersion1Router }