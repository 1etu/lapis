import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import crypto from 'crypto';

import { logger } from '../utils/logger';
import { APIManager } from '../core/Manager';

export class APIServer {
    private app: express.Application;
    private apiManager: APIManager;
    private port: number;

    constructor(apiManager: APIManager, port: number = 8000) {
        this.app = express();
        this.apiManager = apiManager;
        this.port = port;

        this.setupMiddleware();
        this.setupRoutes();
    }

    private setupMiddleware(): void {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        
        this.app.use(
            morgan((tokens, req, res) => {
                return logger.formatHttpLog(tokens, req, res);
            })
        );

        this.app.use(this.logRequest.bind(this));
    }

    private logRequest(req: Request, res: Response, next: NextFunction): void {
        const requestStart = Date.now();
        const requestId = crypto.randomUUID();

        logger.info({
            type: 'REQUEST',
            id: requestId,
            method: req.method,
            path: req.path,
            query: req.query,
            ip: req.ip
        });

        const originalSend = res.send;
        res.send = function(body): Response {
            const responseTime = Date.now() - requestStart;
            
            logger.info({
                type: 'RESPONSE',
                id: requestId,
                statusCode: res.statusCode,
                responseTime: `${responseTime}ms`,
                size: `${Buffer.from(body).length}b`
            });

            return originalSend.call(this, body);
        };

        next();
    }

    private setupRoutes(): void {
        this.app.get('/health', (req: Request, res: Response) => {
            res.json({ status: 'ok' });
        });

        this.app.all('/api/:apiName', (async (req: Request, res: Response, next: NextFunction) => {
            const requestId = crypto.randomUUID();
            const startTime = Date.now();

            try {
                const apiName = req.params.apiName;
                const { raw, return: returnParam, ...restParams } = {
                    ...req.query,
                    ...req.body,
                    ...req.params
                } as { raw?: boolean; return?: string; [key: string]: any };
                
                const params = restParams;

                logger.debug({
                    type: 'API_CALL',
                    id: requestId,
                    apiName,
                    params,
                    raw: !!raw,
                    return: returnParam
                });

                const response = await this.apiManager.execute(apiName, params);
                const executionTime = Date.now() - startTime;

                logger.info({
                    type: 'API_RESPONSE',
                    id: requestId,
                    apiName,
                    success: response.success,
                    duration: `${executionTime}ms`,
                    raw: !!raw,
                    return: returnParam
                });
                if (returnParam === 'result' && response.success && response.data) {
                    const result = (response.data as Record<string, unknown>)[returnParam];
                    if (result !== undefined) {
                        res.type('text/plain');
                        return res.send(String(result));
                    }
                }

                if (raw && response.success) {
                    return res.json(response.data);
                }

                res.status(response.success ? 200 : 400).json({
                    ...response,
                    requestId,
                    executionTime
                });
            } catch (error) {
                const executionTime = Date.now() - startTime;

                logger.error({
                    type: 'API_ERROR',
                    id: requestId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    duration: `${executionTime}ms`
                });

                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Internal server error',
                    timestamp: Date.now(),
                    requestId,
                    executionTime
                });
            }
        }) as express.RequestHandler);
    }

    public start(): void {
        this.app.listen(this.port, () => {
            logger.info({
                type: 'SERVER_START',
                port: this.port,
                env: process.env.NODE_ENV || 'development',
                node: process.version
            });
        });
    }
} 