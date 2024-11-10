import { APIEndpointConfig } from '../types/api';
import { APIResponse } from '../types/api';
import { APIRegistry } from './Registry';

export class APIManager {
    private registry: APIRegistry;

    constructor() {
        this.registry = APIRegistry.getInstance();
    }

    register<T, U>(name: string, config: APIEndpointConfig<T, U>): void {
        this.registry.registerEndpoint(name, config);
    }

    async execute<T, U>(apiName: string, params: T): Promise<APIResponse<U>> {
        return this.registry.executeEndpoint<T, U>(apiName, params);
    }

    unregister(name: string): void {
        this.registry.unregisterEndpoint(name);
    }
}