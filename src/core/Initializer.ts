import fs from 'fs/promises';
import path from 'path';

import { APIManager } from './Manager';
import { APIModule, APIConfig, APIMetadata, APIEndpointConfig } from '../types/api';
import { APIError } from '../errors/APIError';
import { ValidationError } from '../errors/ValidationError';

export class APIInitializer {
    private apiManager: APIManager;
    private apisDirectory: string;
    private registeredAPIs: Map<string, APIModule<any, any>>;

    constructor(apiManager: APIManager, apisDirectory: string) {
        this.apiManager = apiManager;
        this.apisDirectory = apisDirectory;
        this.registeredAPIs = new Map();
    }

    async initialize(): Promise<void> {
        try {
            const apiDirs = await fs.readdir(this.apisDirectory);
            
            for (const dir of apiDirs) {
                await this.loadAPI(dir);
            }

            console.log(`Successfully initialized ${this.registeredAPIs.size} APIs`);
        } catch (error) {
            console.error('Failed to initialize APIs:', error);
            throw error;
        }
    }

    private async loadAPI(apiDir: string): Promise<void> {
        const apiPath = path.join(this.apisDirectory, apiDir);
        
        try {
            const stats = await fs.stat(apiPath);
            if (!stats.isDirectory()) return;

            const config = await this.loadConfig(apiPath);
            if (!config.enabled) {
                console.log(`Skipping disabled API: ${apiDir}`);
                return;
            }

            const apiModule = await this.loadModule(apiPath);
            if (!this.validateAPIModule(apiModule)) {
                throw new APIError(`Invalid API module structure in ${apiDir}`);
            }

            if (apiModule.init) {
                await apiModule.init();
            }

            this.registerAPI(config.metadata.name, apiModule);
            
            console.log(`Successfully loaded API: ${config.metadata.name} (v${config.metadata.version})`);
        } catch (error) {
            console.error(`Failed to load API ${apiDir}:`, error);
        }
    }

    private async loadConfig(apiPath: string): Promise<APIConfig> {
        const configPath = path.join(apiPath, 'config.json');
        const configData = await fs.readFile(configPath, 'utf-8');
        return JSON.parse(configData);
    }

    private async loadModule(apiPath: string): Promise<APIModule> {
        const indexPath = path.join(apiPath, 'index.ts');
        return require(indexPath);
    }

    private validateAPIModule(module: unknown): module is APIModule<any, any> {
        const apiModule = module as APIModule<any, any>;
        return (
            apiModule !== null &&
            typeof apiModule === 'object' &&
            'config' in apiModule &&
            typeof apiModule.config === 'object'
        );
    }

    private registerAPI(name: string, apiModule: APIModule): void {
        const wrappedConfig: APIEndpointConfig = {
            ...apiModule.config,
            handler: async (params: unknown) => {
                if (apiModule.validate) {
                    const isValid = await apiModule.validate(params);
                    if (!isValid) {
                        throw new ValidationError('Invalid parameters');
                    }
                }

                let result = await apiModule.config.handler(params);

                if (apiModule.transform) {
                    result = await apiModule.transform(result);
                }

                return result;
            }
        };

        this.registeredAPIs.set(name, apiModule);
        this.apiManager.register(name, wrappedConfig);
    }

    getAPIMetadata(): APIMetadata[] {
        return Array.from(this.registeredAPIs.entries()).map(([name]) => {
            const configPath = path.join(this.apisDirectory, name, 'config.json');
            const config: APIConfig = require(configPath);
            return config.metadata;
        });
    }

    async cleanup(): Promise<void> {
        for (const [name, api] of this.registeredAPIs.entries()) {
            if (api.cleanup) {
                try {
                    await api.cleanup();
                    console.log(`Cleaned up API: ${name}`);
                } catch (error) {
                    console.error(`Failed to clean up API ${name}:`, error);
                }
            }
        }
    }
}