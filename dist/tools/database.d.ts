/**
 * Database Tools - SQL, Vector DB, Graph DB connectors
 * Multi-database query interface
 */
import { EventEmitter } from 'events';
export interface DBConnection {
    type: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'redis' | 'elasticsearch';
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    url?: string;
    ssl?: boolean;
}
export interface QueryResult {
    rows: any[];
    rowCount: number;
    fields?: string[];
    duration: number;
}
export declare class DatabaseTools extends EventEmitter {
    private connections;
    registerConnection(name: string, config: DBConnection): void;
    query(connectionName: string, sql: string): Promise<QueryResult>;
    private queryPostgres;
    private queryMySQL;
    private querySQLite;
    queryMongo(connectionName: string, collection: string, operation: string, args: any): Promise<QueryResult>;
    redisCommand(connectionName: string, command: string, ...args: any[]): Promise<any>;
    listTables(connectionName: string): Promise<string[]>;
    getSchema(connectionName: string, table: string): Promise<any[]>;
    testConnection(connectionName: string): Promise<{
        success: boolean;
        error?: string;
    }>;
}
export default DatabaseTools;
