import { HTTPMethod } from "./http";

export interface APIEndpointConfig<T = unknown, U = unknown> {
    path: string;
    method: HTTPMethod;
    handler: (params: T) => Promise<U>;
    rateLimit?: {
        windowMs: number;
        maxRequests: number;
    };
    auth?: boolean;
    cache?: {
        enabled: boolean;
        ttlSeconds: number;
    };
}

export interface APIResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: number;
    metadata?: {
        cached?: boolean;
        executionTime?: number;
    };
}

export interface APIMetadata {
    name: string;
    version: string;
    description: string;
    author?: string;
    tags?: string[];
}

export interface APIConfig {
    enabled: boolean;
    metadata: APIMetadata;
    settings?: Record<string, unknown>;
}

export interface APIModule<T = unknown, U = unknown> {
    config: APIEndpointConfig<T, U>;
    init?: () => Promise<void>;
    validate?: (params: unknown) => Promise<boolean>;
    transform?: (result: unknown) => Promise<unknown>;
    cleanup?: () => Promise<void>;
}