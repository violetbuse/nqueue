import { MemoryStorageProvider, startServer } from 'server';

console.log('Starting dev-server...');

const storageProvider = new MemoryStorageProvider();

// Start the server
startServer(5000, storageProvider);

console.log('Dev-server started successfully!');