export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogMetadata {
    id?: string;
    type: string;
    [key: string]: any;
}
