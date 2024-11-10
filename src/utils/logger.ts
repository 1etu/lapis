import chalk from 'chalk';
import { LogMetadata, LogLevel } from '../types/logger';

class Logger {
    [x: string]: any;
    private formatMetadata(metadata: LogMetadata): string {
        const { type, id, ...rest } = metadata;
        const details = Object.entries(rest)
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => {
                if (typeof v === 'object') {
                    return `${k}=${JSON.stringify(v)}`;
                }
                return `${k}=${v}`;
            })
            .join(' ');

        return `${chalk.bgCyan.black(` ${type} `)}${id ? chalk.gray(`[${id}]`) : ''} ${chalk.dim(details)}`;
    }

    private getTimestamp(): string {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
        
        return chalk.gray(`${hours}:${minutes}:${seconds}.${milliseconds}`);
    }

    private logWithLevel(level: LogLevel, metadata: LogMetadata): void {
        const timestamp = this.getTimestamp();
        const levelColors = {
            info: chalk.bgBlue.white(' INFO '),
            warn: chalk.bgYellow.black(' WARN '),
            error: chalk.bgRed.white(' ERROR '),
            debug: chalk.bgMagenta.white(' DEBUG ')
        };

        console.log(
            `${timestamp} ${levelColors[level]} ${this.formatMetadata(metadata)}`
        );
    }

    info(metadata: LogMetadata): void {
        this.logWithLevel('info', metadata);
    }

    warn(metadata: LogMetadata): void {
        this.logWithLevel('warn', metadata);
    }

    error(metadata: LogMetadata): void {
        this.logWithLevel('error', metadata);
    }

    debug(metadata: LogMetadata): void {
        this.logWithLevel('debug', metadata);
    }

    formatHttpLog(tokens: any, req: any, res: any): string {
        const id = req.id;
        return this.formatMetadata({
            type: 'HTTP',
            id,
            method: tokens.method(req, res),
            path: tokens.url(req, res),
            status: tokens.status(req, res),
            responseTime: `${tokens['response-time'](req, res)}ms`,
            contentLength: tokens.res(req, res, 'content-length') || '-'
        });
    }
}

export const logger = new Logger();