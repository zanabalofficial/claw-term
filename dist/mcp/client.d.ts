/**
 * MCP Client - Native Model Context Protocol integration
 * Direct MCP server communication without external CLI
 */
import { EventEmitter } from 'events';
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
    };
}
export interface MCPConnection {
    name: string;
    type: 'stdio' | 'http';
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    url?: string;
    headers?: Record<string, string>;
}
export declare class MCPClient extends EventEmitter {
    private connections;
    private configPath;
    private requestId;
    constructor(configPath?: string);
    private ensureConfigDir;
    loadConfig(): Record<string, MCPConnection>;
    saveConfig(servers: Record<string, MCPConnection>): void;
    connect(name: string, connection: MCPConnection): Promise<void>;
    private connectStdio;
    private connectHttp;
    private sendInitialize;
    private refreshCapabilities;
    private sendRequest;
    private sendStdioRequest;
    private sendHttpRequest;
    callTool(serverName: string, toolName: string, args: Record<string, any>): Promise<any>;
    getTools(serverName?: string): Array<{
        server: string;
        tool: MCPTool;
    }>;
    disconnect(name: string): void;
    addServer(name: string, config: {
        command?: string;
        args?: string[];
        env?: Record<string, string>;
        url?: string;
    }): void;
    listServers(): string[];
}
export default MCPClient;
