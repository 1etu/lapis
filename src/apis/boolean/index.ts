import { APIEndpointConfig, APIModule } from "../../types/api";

interface BooleanParams {
    value?: boolean;
}

interface BooleanResponse {
    result: boolean;
}

const config: APIEndpointConfig<BooleanParams, BooleanResponse> = {
    path: '/api/boolean',
    method: 'POST',
    cache: {
        enabled: false,
        ttlSeconds: 0
    },
    handler: async (params) => {
        const result = params.value ?? Math.random() < 0.5;
        return { result };
    }
};

const validate = async (params: unknown): Promise<boolean> => {
    const p = params as BooleanParams;
    
    if (p.value !== undefined && typeof p.value !== 'boolean') {
        return false;
    }

    return true;
};

const booleanAPI: APIModule<BooleanParams, BooleanResponse> = {
    config,
    validate
};

export = booleanAPI; 