/**
 * Local LLM Hosting - Built-in model server using llama.cpp
 * Run models locally without external API calls
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import fetch from 'node-fetch';

export interface LocalModelConfig {
  modelPath: string;
  contextSize: number;
  threads: number;
  gpuLayers: number;
  batchSize: number;
}

export interface ModelDownloadInfo {
  name: string;
  url: string;
  size: string;
  quantization: string;
  description: string;
}

export class LocalLLMServer extends EventEmitter {
  private process: ChildProcess | null = null;
  private serverUrl: string = 'http://127.0.0.1:8080';
  private modelsDir: string;
  private isRunning: boolean = false;

  constructor() {
    super();
    this.modelsDir = join(homedir(), '.claw', 'models');
    if (!existsSync(this.modelsDir)) {
      mkdirSync(this.modelsDir, { recursive: true });
    }
  }

  // Pre-configured popular models
  static readonly AVAILABLE_MODELS: ModelDownloadInfo[] = [
    {
      name: 'llama-2-7b-chat.Q4_K_M.gguf',
      url: 'https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.Q4_K_M.gguf',
      size: '4.1 GB',
      quantization: 'Q4_K_M',
      description: 'Llama 2 7B - Good balance of speed and quality',
    },
    {
      name: 'llama-2-13b-chat.Q4_K_M.gguf',
      url: 'https://huggingface.co/TheBloke/Llama-2-13B-Chat-GGUF/resolve/main/llama-2-13b-chat.Q4_K_M.gguf',
      size: '7.9 GB',
      quantization: 'Q4_K_M',
      description: 'Llama 2 13B - Better quality, requires more RAM',
    },
    {
      name: 'codellama-7b-instruct.Q4_K_M.gguf',
      url: 'https://huggingface.co/TheBloke/CodeLlama-7B-Instruct-GGUF/resolve/main/codellama-7b-instruct.Q4_K_M.gguf',
      size: '4.1 GB',
      quantization: 'Q4_K_M',
      description: 'CodeLlama - Specialized for code',
    },
    {
      name: 'mistral-7b-instruct-v0.2.Q4_K_M.gguf',
      url: 'https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf',
      size: '4.4 GB',
      quantization: 'Q4_K_M',
      description: 'Mistral 7B - Very capable general model',
    },
    {
      name: 'deepseek-coder-6.7b-instruct.Q4_K_M.gguf',
      url: 'https://huggingface.co/TheBloke/DeepSeek-Coder-6.7B-Instruct-GGUF/resolve/main/deepseek-coder-6.7b-instruct.Q4_K_M.gguf',
      size: '3.8 GB',
      quantization: 'Q4_K_M',
      description: 'DeepSeek Coder - Excellent for programming',
    },
  ];

  // Check if llama.cpp server is available
  async checkPrerequisites(): Promise<{ ok: boolean; missing: string[] }> {
    const missing: string[] = [];

    // Check for llama-server binary
    try {
      const { execSync } = require('child_process');
      execSync('which llama-server || which llama.cpp.server', { stdio: 'pipe' });
    } catch {
      missing.push('llama-server (install llama.cpp)');
    }

    return { ok: missing.length === 0, missing };
  }

  // Download a model
  async downloadModel(modelInfo: ModelDownloadInfo, onProgress?: (percent: number) => void): Promise<void> {
    const modelPath = join(this.modelsDir, modelInfo.name);
    
    if (existsSync(modelPath)) {
      this.emit('downloadComplete', modelInfo.name);
      return;
    }

    this.emit('downloadStart', modelInfo.name);

    // Use curl or wget for download with progress
    const command = `curl -L -o "${modelPath}.tmp" "${modelInfo.url}" --progress-bar`;
    
    return new Promise((resolve, reject) => {
      const download = spawn('bash', ['-c', command], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let lastProgress = 0;

      download.stderr.on('data', (data) => {
        // Parse curl progress
        const match = data.toString().match(/(\d+\.?\d*)%/);
        if (match && onProgress) {
          const progress = parseFloat(match[1]);
          if (progress > lastProgress) {
            lastProgress = progress;
            onProgress(progress);
          }
        }
      });

      download.on('close', (code) => {
        if (code === 0) {
          // Rename from .tmp to final
          const { execSync } = require('child_process');
          execSync(`mv "${modelPath}.tmp" "${modelPath}"`);
          this.emit('downloadComplete', modelInfo.name);
          resolve();
        } else {
          reject(new Error(`Download failed with code ${code}`));
        }
      });

      download.on('error', reject);
    });
  }

  // Start the server
  async start(config: Partial<LocalModelConfig> = {}): Promise<void> {
    if (this.isRunning) {
      return;
    }

    const fullConfig: LocalModelConfig = {
      modelPath: config.modelPath || this.getDefaultModel(),
      contextSize: config.contextSize || 4096,
      threads: config.threads || 4,
      gpuLayers: config.gpuLayers || 0,
      batchSize: config.batchSize || 512,
    };

    if (!existsSync(fullConfig.modelPath)) {
      throw new Error(`Model not found: ${fullConfig.modelPath}`);
    }

    // Find llama-server binary
    const serverBin = await this.findServerBinary();

    const args = [
      '-m', fullConfig.modelPath,
      '--ctx-size', String(fullConfig.contextSize),
      '--threads', String(fullConfig.threads),
      '--n-gpu-layers', String(fullConfig.gpuLayers),
      '--batch-size', String(fullConfig.batchSize),
      '--port', '8080',
      '--host', '127.0.0.1',
    ];

    this.emit('serverStarting', fullConfig);

    this.process = spawn(serverBin, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // Wait for server to be ready
    await this.waitForServer();
    
    this.isRunning = true;
    this.emit('serverReady', this.serverUrl);

    // Handle process events
    this.process.on('exit', (code) => {
      this.isRunning = false;
      this.emit('serverExit', code);
    });

    this.process.stderr.on('data', (data) => {
      const line = data.toString();
      // Parse progress info
      if (line.includes('llama_model_loader')) {
        this.emit('modelLoading', line);
      }
    });
  }

  // Stop the server
  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill('SIGTERM');
      
      // Wait for graceful shutdown
      await new Promise((resolve) => {
        if (!this.process) {
          resolve(undefined);
          return;
        }
        this.process.on('exit', () => resolve(undefined));
        
        // Force kill after 5 seconds
        setTimeout(() => {
          this.process?.kill('SIGKILL');
          resolve(undefined);
        }, 5000);
      });
      
      this.process = null;
      this.isRunning = false;
    }
  }

  // Check if server is running
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/health`, { timeout: 1000 });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Get completion from local model
  async complete(prompt: string, options: {
    temperature?: number;
    maxTokens?: number;
    stop?: string[];
    stream?: boolean;
  } = {}): Promise<string> {
    const response = await fetch(`${this.serverUrl}/completion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 512,
        stop: options.stop ?? [],
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    return data.content;
  }

  // Stream completion
  async *streamComplete(prompt: string, options: {
    temperature?: number;
    maxTokens?: number;
    stop?: string[];
  } = {}): AsyncGenerator<string> {
    const response = await fetch(`${this.serverUrl}/completion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 512,
        stop: options.stop ?? [],
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              yield parsed.content;
            }
          } catch {}
        }
      }
    }
  }

  private async findServerBinary(): Promise<string> {
    const { execSync } = require('child_process');
    
    try {
      return execSync('which llama-server', { encoding: 'utf-8' }).trim();
    } catch {}
    
    try {
      return execSync('which llama.cpp.server', { encoding: 'utf-8' }).trim();
    } catch {}
    
    // Check common locations
    const commonPaths = [
      '/usr/local/bin/llama-server',
      '/opt/homebrew/bin/llama-server',
      join(homedir(), 'llama.cpp/build/bin/llama-server'),
    ];
    
    for (const path of commonPaths) {
      if (existsSync(path)) return path;
    }
    
    throw new Error('llama-server not found. Install llama.cpp or set LLAMA_SERVER_PATH');
  }

  private async waitForServer(timeout: number = 60000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await this.healthCheck()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error('Server failed to start within timeout');
  }

  private getDefaultModel(): string {
    const defaultModel = 'mistral-7b-instruct-v0.2.Q4_K_M.gguf';
    return join(this.modelsDir, defaultModel);
  }

  getInstalledModels(): string[] {
    const { readdirSync } = require('fs');
    try {
      return readdirSync(this.modelsDir)
        .filter((f: string) => f.endsWith('.gguf'))
        .map((f: string) => join(this.modelsDir, f));
    } catch {
      return [];
    }
  }
}

export default LocalLLMServer;
