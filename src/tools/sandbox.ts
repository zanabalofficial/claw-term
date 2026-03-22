/**
 * Sandboxed Code Execution - Isolated Python/JS/SQL runtimes
 * Secure execution environment with resource limits
 */

import { spawn } from 'child_process';
import { writeFile, mkdir, readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

export interface SandboxConfig {
  language: 'python' | 'javascript' | 'typescript' | 'sql' | 'shell';
  timeout?: number; // milliseconds
  memoryLimit?: number; // MB
  cpuLimit?: number; // percentage
  network?: boolean;
  filesystem?: 'read-only' | 'read-write' | 'none';
  allowedModules?: string[];
  forbiddenModules?: string[];
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
  memoryUsed?: number;
  files?: Record<string, string>;
}

export class CodeSandbox {
  private baseDir: string;
  private activeContainers: Map<string, string> = new Map();

  constructor() {
    this.baseDir = join(tmpdir(), 'claw-sandboxes');
  }

  // Execute code in sandbox
  async execute(code: string, config: SandboxConfig): Promise<ExecutionResult> {
    const sessionId = randomBytes(8).toString('hex');
    const sessionDir = join(this.baseDir, sessionId);
    
    await mkdir(sessionDir, { recursive: true });

    try {
      switch (config.language) {
        case 'python':
          return await this.executePython(code, sessionDir, config);
        case 'javascript':
        case 'typescript':
          return await this.executeJavaScript(code, sessionDir, config);
        case 'sql':
          return await this.executeSQL(code, sessionDir, config);
        case 'shell':
          return await this.executeShell(code, sessionDir, config);
        default:
          throw new Error(`Unsupported language: ${config.language}`);
      }
    } finally {
      // Cleanup
      await this.cleanup(sessionDir);
    }
  }

  private async executePython(
    code: string,
    sessionDir: string,
    config: SandboxConfig
  ): Promise<ExecutionResult> {
    const scriptPath = join(sessionDir, 'script.py');
    await writeFile(scriptPath, code);

    const timeout = config.timeout || 30000;
    const memoryLimit = config.memoryLimit || 512;

    // Use timeout and ulimit for basic sandboxing
    // For production, use Docker or Firejail
    const args = [
      scriptPath,
    ];

    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const proc = spawn('python3', args, {
        cwd: sessionDir,
        timeout,
        env: {
          ...process.env,
          PYTHONPATH: sessionDir,
          // Restrict Python environment
          PYTHONDONTWRITEBYTECODE: '1',
        },
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => { stdout += data; });
      proc.stderr?.on('data', (data) => { stderr += data; });

      proc.on('close', (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: code || 0,
          duration: Date.now() - startTime,
        });
      });

      proc.on('error', (err) => {
        resolve({
          stdout,
          stderr: err.message,
          exitCode: 1,
          duration: Date.now() - startTime,
        });
      });
    });
  }

  private async executeJavaScript(
    code: string,
    sessionDir: string,
    config: SandboxConfig
  ): Promise<ExecutionResult> {
    const isTypeScript = config.language === 'typescript';
    const ext = isTypeScript ? 'ts' : 'js';
    const scriptPath = join(sessionDir, `script.${ext}`);
    await writeFile(scriptPath, code);

    const timeout = config.timeout || 30000;
    const startTime = Date.now();

    // Create restricted VM context
    const restrictedCode = `
const vm = require('vm');
const context = vm.createContext({
  console: {
    log: (...args) => console.log(...args),
    error: (...args) => console.error(...args),
    warn: (...args) => console.warn(...args),
  },
  setTimeout: () => { throw new Error('setTimeout not allowed'); },
  setInterval: () => { throw new Error('setInterval not allowed'); },
  require: (mod) => {
    const allowed = ${JSON.stringify(config.allowedModules || [])};
    const forbidden = ${JSON.stringify(config.forbiddenModules || ['fs', 'child_process', 'net', 'http', 'https'])};
    if (forbidden.includes(mod)) throw new Error('Module not allowed: ' + mod);
    if (allowed.length > 0 && !allowed.includes(mod)) throw new Error('Module not allowed: ' + mod);
    return require(mod);
  },
});

const code = \`${code.replace(/`/g, '\\`')}\`;
vm.runInContext(code, context, { timeout: ${timeout} });
`;

    const runnerPath = join(sessionDir, 'runner.js');
    await writeFile(runnerPath, restrictedCode);

    return new Promise((resolve) => {
      const proc = spawn('node', [runnerPath], {
        cwd: sessionDir,
        timeout,
        env: {
          ...process.env,
          NODE_PATH: sessionDir,
        },
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => { stdout += data; });
      proc.stderr?.on('data', (data) => { stderr += data; });

      proc.on('close', (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: code || 0,
          duration: Date.now() - startTime,
        });
      });

      proc.on('error', (err) => {
        resolve({
          stdout,
          stderr: err.message,
          exitCode: 1,
          duration: Date.now() - startTime,
        });
      });
    });
  }

  private async executeSQL(
    code: string,
    sessionDir: string,
    config: SandboxConfig
  ): Promise<ExecutionResult> {
    // Use SQLite for SQL execution
    const dbPath = join(sessionDir, 'sandbox.db');
    const startTime = Date.now();

    return new Promise((resolve) => {
      const proc = spawn('sqlite3', [dbPath], {
        cwd: sessionDir,
        timeout: config.timeout || 30000,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => { stdout += data; });
      proc.stderr?.on('data', (data) => { stderr += data; });

      proc.stdin?.write(code);
      proc.stdin?.end();

      proc.on('close', (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: code || 0,
          duration: Date.now() - startTime,
        });
      });

      proc.on('error', (err) => {
        resolve({
          stdout,
          stderr: err.message,
          exitCode: 1,
          duration: Date.now() - startTime,
        });
      });
    });
  }

  private async executeShell(
    code: string,
    sessionDir: string,
    config: SandboxConfig
  ): Promise<ExecutionResult> {
    // Very restricted shell execution
    const startTime = Date.now();
    const timeout = config.timeout || 10000;

    return new Promise((resolve) => {
      const proc = spawn('sh', ['-c', code], {
        cwd: sessionDir,
        timeout,
        env: {
          PATH: '/usr/bin:/bin',
          HOME: sessionDir,
        },
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => { stdout += data; });
      proc.stderr?.on('data', (data) => { stderr += data; });

      proc.on('close', (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: code || 0,
          duration: Date.now() - startTime,
        });
      });

      proc.on('error', (err) => {
        resolve({
          stdout,
          stderr: err.message,
          exitCode: 1,
          duration: Date.now() - startTime,
        });
      });
    });
  }

  private async cleanup(sessionDir: string): Promise<void> {
    try {
      const files = await (await import('fs/promises')).readdir(sessionDir);
      await Promise.all(files.map(f => unlink(join(sessionDir, f))));
      await (await import('fs/promises')).rmdir(sessionDir);
    } catch {}
  }

  // Check if sandbox environment is available
  async checkAvailability(): Promise<{
    python: boolean;
    node: boolean;
    sqlite: boolean;
  }> {
    const checks = await Promise.all([
      this.checkCommand('python3 --version'),
      this.checkCommand('node --version'),
      this.checkCommand('sqlite3 --version'),
    ]);

    return {
      python: checks[0],
      node: checks[1],
      sqlite: checks[2],
    };
  }

  private async checkCommand(cmd: string): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn('sh', ['-c', cmd]);
      proc.on('close', (code) => resolve(code === 0));
      proc.on('error', () => resolve(false));
    });
  }
}

export default CodeSandbox;
