// @ts-nocheck
/**
 * MCP Client - Native Model Context Protocol integration
 * Direct MCP server communication without external CLI
 */
import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
export class MCPClient extends EventEmitter {
    connections = new Map();
    configPath;
    requestId = 0;
    constructor(configPath) {
        super();
        this.configPath = configPath || join(homedir(), '.claw', 'mcp.json');
        this.ensureConfigDir();
    }
    ensureConfigDir() {
        const dir = dirname(this.configPath);
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
    }
    // Load MCP configuration
    loadConfig() {
        if (!existsSync(this.configPath)) {
            return {};
        }
        try {
            return JSON.parse(readFileSync(this.configPath, 'utf-8'));
        }
        catch {
            return {};
        }
    }
    // Save MCP configuration
    saveConfig(servers) {
        writeFileSync(this.configPath, JSON.stringify(servers, null, 2));
    }
    // Connect to MCP server
    async connect(name, connection) {
        if (connection.type === 'stdio') {
            await this.connectStdio(name, connection);
        }
        else {
            await this.connectHttp(name, connection);
        }
    }
    async connectStdio(name, connection) {
        const proc = spawn(connection.command, connection.args || [], {
            env: { ...process.env, ...connection.env },
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        const conn = {
            connection,
            process: proc,
            tools: [],
        };
        this.connections.set(name, conn);
        proc.on('exit', (code) => {
            this.emit('disconnect', { name, code });
            this.connections.delete(name);
        });
        proc.stderr?.on('data', (data) => {
            this.emit('stderr', { name, data: data.toString() });
        });
        await this.sendInitialize(name);
        await this.refreshCapabilities(name);
        this.emit('connect', { name, type: 'stdio' });
    }
    async connectHttp(name, connection) {
        this.connections.set(name, {
            connection,
            tools: [],
        });
        await this.refreshCapabilities(name);
        this.emit('connect', { name, type: 'http' });
    }
    async sendInitialize(name) {
        await this.sendRequest(name, 'initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'claw-term', version: '2.0.0' },
        });
    }
    async refreshCapabilities(name) {
        const conn = this.connections.get(name);
        if (!conn)
            return;
        try {
            const response = await this.sendRequest(name, 'tools/list', {});
            conn.tools = response.tools || [];
            this.connections.set(name, conn);
        }
        catch { }
    }
    async sendRequest(name, method, params) {
        const conn = this.connections.get(name);
        if (!conn)
            throw new Error(`Connection ${name} not found`);
        const id = ++this.requestId;
        const request = { jsonrpc: '2.0', id, method, params };
        if (conn.connection.type === 'stdio' && conn.process) {
            return this.sendStdioRequest(conn.process, request);
        }
        else {
            return this.sendHttpRequest(conn.connection, request);
        }
    }
    async sendStdioRequest(proc, request) {
        return new Promise((resolve, reject) => {
            const id = request.id;
            const timeout = setTimeout(() => reject(new Error('Request timeout')), 30000);
            const onData = (data) => {
                try {
                    const lines = data.toString().split('\n').filter(Boolean);
                    for (const line of lines) {
                        const response = JSON.parse(line);
                        if (response.id === id) {
                            clearTimeout(timeout);
                            proc.stdout?.off('data', onData);
                            if (response.error)
                                reject(new Error(response.error.message));
                            else
                                resolve(response.result);
                        }
                    }
                }
                catch { }
            };
            proc.stdout?.on('data', onData);
            proc.stdin?.write(JSON.stringify(request) + '\n');
        });
    }
    async sendHttpRequest(connection, request) {
        const response = await fetch(connection.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...connection.headers },
            body: JSON.stringify(request),
        });
        if (!response.ok)
            throw new Error(`HTTP error: ${response.status}`);
        const data = await response.json();
        if (data.error)
            throw new Error(data.error.message);
        return data.result;
    }
    // Call a tool
    async callTool(serverName, toolName, args) {
        return this.sendRequest(serverName, 'tools/call', {
            name: toolName,
            arguments: args,
        });
    }
    // Get available tools
    getTools(serverName) {
        const results = [];
        for (const [name, conn] of this.connections) {
            if (!serverName || name === serverName) {
                for (const tool of conn.tools) {
                    results.push({ server: name, tool });
                }
            }
        }
        return results;
    }
    // Disconnect
    disconnect(name) {
        const conn = this.connections.get(name);
        if (conn?.process) {
            conn.process.kill('SIGTERM');
        }
        this.connections.delete(name);
    }
    // Add server from CLI config format
    addServer(name, config) {
        const servers = this.loadConfig();
        if (config.url) {
            servers[name] = {
                name,
                type: 'http',
                url: config.url,
            };
        }
        else if (config.command) {
            servers[name] = {
                name,
                type: 'stdio',
                command: config.command,
                args: config.args || [],
                env: config.env,
            };
        }
        this.saveConfig(servers);
    }
    // List configured servers
    listServers() {
        return Object.keys(this.loadConfig());
    }
}
export default MCPClient;
