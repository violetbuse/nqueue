import { startServer, PostgresStorageProvider } from 'server';

console.log('Starting executable...');

const storageProvider = new PostgresStorageProvider();

startServer(3000, storageProvider);

console.log('Executable started successfully!');
