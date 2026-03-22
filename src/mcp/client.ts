/**
 * MCP Client - Native Model Context Protocol integration
 * Direct MCP server communication without external CLI
 */

import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

// MCP Types
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

export class MCPClient extends EventEmitter {
  private connections: Map<string, {
    connection: MCPConnection;
    process?: ChildProcess;
    tools: MCPTool[];
  }> = new Map();
  
  private configPath: string;
  private requestId = 0;

  constructor(configPath?: string) {
    super();
    this.configPath = configPath || join(homedir(), '.claw', 'mcp.json');
    this.ensureConfigDir();
  }

  private ensureConfigDir(): void {
    const dir = dirname(this.configPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  // Load MCP configuration
  loadConfig(): Record<string, MCPConnection> {
    if (!existsSync(this.configPath)) {
      return {};
    }
    
    try {
      return JSON.parse(readFileSync(this.configPath, 'utf-8'));
    } catch {
      return {};
    }
  }

  // Save MCP configuration
  saveConfig(servers: Record<string, MCPConnection>): void {
    writeFileSync(this.configPath, JSON.stringify(servers, null, 2));
  }

  // Connect to MCP server
  async connect(name: string, connection: MCPConnection): Promise<void> {
    if (connection.type === 'stdio') {
      await this.connectStdio(name, connection);
    } else {
      await this.connectHttp(name, connection);
    }
  }

  private async connectStdio(name: string, connection: MCPConnection): Promise<void> {
    const proc = spawn(connection.command!, connection.args || [], {
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

  private async connectHttp(name: string, connection: MCPConnection): Promise<void> {
    this.connections.set(name, {
      connection,
      tools: [],
    });

    await this.refreshCapabilities(name);
    this.emit('connect', { name, type: 'http' });
  }

  private async sendInitialize(name: string): Promise<void> {
    await this.sendRequest(name, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'claw-term', version: '2.0.0' },
    });
  }

  private async refreshCapabilities(name: string): Promise<void> {
    const conn = this.connections.get(name);
    if (!conn) return;

    try {
      const response = await this.sendRequest(name, 'tools/list', {});
      conn.tools = response.tools || [];
      this.connections.set(name, conn);
    } catch {}
  }

  private async sendRequest(name: string, method: string, params: any): Promise<any> {
    const conn = this.connections.get(name);
    if (!conn) throw new Error(`Connection ${name} not found`);

    const id = ++this.requestId;
    const request = { jsonrpc: '2.0', id, method, params };

    if (conn.connection.type === 'stdio' && conn.process) {
      return this.sendStdioRequest(conn.process, request);
    } else {
      return this.sendHttpRequest(conn.connection, request);
    }
  }

  private async sendStdioRequest(proc: ChildProcess, request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = request.id;
      const timeout = setTimeout(() => reject(new Error('Request timeout')), 30000);

      const onData = (data: Buffer) => {
        try {
          const lines = data.toString().split('\n').filter(Boolean);
          for (const line of lines) {
            const response = JSON.parse(line);
            if (response.id === id) {
              clearTimeout(timeout);
              proc.stdout?.off('data', onData);
              if (response.error) reject(new Error(response.error.message));
              else resolve(response.result);
            }
          }
        } catch {}
      };

      proc.stdout?.on('data', onData);
      proc.stdin?.write(JSON.stringify(request) + '\n');
    });
  }

  private async sendHttpRequest(connection: MCPConnection, request: any): Promise<any> {
    const response = await fetch(connection.url!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...connection.headers },
      body: JSON.stringify(request),
    });

    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.result;
  }

  // Call a tool
  async callTool(serverName: string, toolName: string, args: Record<string, any>): Promise<any> {
    return this.sendRequest(serverName, 'tools/call', {
      name: toolName,
      arguments: args,
    });
  }

  // Get available tools
  getTools(serverName?: string): Array<{ server: string; tool: MCPTool }> {
    const results: Array<{ server: string; tool: MCPTool }> = [];
    
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
  disconnect(name: string): void {
    const conn = this.connections.get(name);
    if (conn?.process) {
      conn.process.kill('SIGTERM');
    }
    this.connections.delete(name);
  }

  // Add server from CLI config format
  addServer(name: string, config: { command?: string; args?: string[]; env?: Record<string, string>; url?: string }): void {
    const servers = this.loadConfig();
    
    if (config.url) {
      servers[name] = {
        name,
        type: 'http',
        url: config.url,
      };
    } else if (config.command) {
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
  listServers(): string[] {
    return Object.keys(this.loadConfig());
  }
}

export default MCPClient;
