import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createExpressEndpoints } from '@ts-rest/express';
import { contract } from 'shared';
import { createRouter } from './routes';
import { StorageProvider } from './db';

export * from './db';

export const startServer = (port: number, storageProvider: StorageProvider) => {
    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    const router = createRouter(storageProvider);

    createExpressEndpoints(contract, router, app, {
        responseValidation: true,
        jsonQuery: true,
    })

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}
