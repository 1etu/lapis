import path from 'path';

import { APIManager } from './core/Manager';
import { APIInitializer } from './core/Initializer';
import { APIServer } from './server/Base';

async function bootstrap() {
    try {
        const apiManager = new APIManager();
        const initializer = new APIInitializer(
            apiManager,
            path.join(__dirname, 'apis')
        );

        await initializer.initialize();

        const server = new APIServer(apiManager);
        server.start();
    } catch (error) {
        console.error('Failed to start the application:', error);
        process.exit(1);
    }
}

bootstrap(); 