import { APIEndpointConfig, APIResponse } from '../types/api';
import { APIError } from '../errors/APIError';

export class APIRegistry {
    private static instance: APIRegistry;
    private endpoints: Map<string, APIEndpointConfig<any, any>>;
    private cache: Map<string, { data: unknown; timestamp: number }>;

    private constructor() {
        this.endpoints = new Map();
        this.cache = new Map();
    }

    static getInstance(): APIRegistry {
        if (!APIRegistry.instance) {
            APIRegistry.instance = new APIRegistry();
        }
        return APIRegistry.instance;
    }

    registerEndpoint<T, U>(name: string, config: APIEndpointConfig<T, U>): void {
        if (this.endpoints.has(name)) {
            throw new APIError(`Endpoint ${name} already exists`);
        }
        this.endpoints.set(name, config as APIEndpointConfig<any, any>);
    }

    async executeEndpoint<T, U>(name: string, params: T): Promise<APIResponse<U>> {
        const startTime = Date.now();
        const endpoint = this.endpoints.get(name) as APIEndpointConfig<T, U>;
        
        if (!endpoint) {
            throw new APIError(`Endpoint ${name} not found`);
        }

        try {
            if (endpoint.cache?.enabled) {
                const cached = this.getCachedResponse<U>(name);
                if (cached) {
                    cached.metadata = {
                        ...cached.metadata,
                        cached: true,
                        executionTime: Date.now() - startTime
                    };
                    return cached;
                }
            }

            const result = await endpoint.handler(params);
            const response: APIResponse<U> = {
                success: true,
                data: result,
                timestamp: Date.now(),
                metadata: {
                    cached: false,
                    executionTime: Date.now() - startTime
                }
            };

            if (endpoint.cache?.enabled) {
                this.cacheResponse(name, response);
            }

            return response;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: Date.now(),
                metadata: {
                    executionTime: Date.now() - startTime
                }
            };
        }
    }

    private getCachedResponse<T>(name: string): APIResponse<T> | null {
        const cached = this.cache.get(name);
        if (!cached) return null;

        const endpoint = this.endpoints.get(name);
        const ttl = endpoint?.cache?.ttlSeconds || 0;
        const age = (Date.now() - cached.timestamp) / 1000;

        if (age > ttl) {
            this.cache.delete(name);
            return null;
        }

        return {
            success: true,
            data: cached.data as T,
            timestamp: cached.timestamp
        };
    }

    private cacheResponse(name: string, response: APIResponse<unknown>): void {
        this.cache.set(name, {
            data: response.data,
            timestamp: Date.now()
        });
    }

    unregisterEndpoint(name: string): void {
        if (!this.endpoints.has(name)) {
            throw new APIError(`Endpoint ${name} does not exist`);
        }
        this.endpoints.delete(name);
        this.cache.delete(name);
    }
}