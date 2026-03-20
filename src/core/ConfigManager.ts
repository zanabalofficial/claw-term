import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import YAML from 'yaml';

export interface Config {
  // Core
  workspace: string;
  debug: boolean;
  
  // AI Provider
  provider: 'openai' | 'anthropic' | 'local';
  model: string;
  apiKey?: string;
  apiBaseUrl?: string;
  
  // Features
  toolsEnabled: boolean;
  streamingEnabled: boolean;
  
  // UI
  theme: 'dark' | 'light';
  showTimestamps: boolean;
  multilineInput: boolean;
  
  // History
  historySize: number;
  historyFile: string;
  
  // Tools
  toolConfirmations: boolean;
  maxParallelTools: number;
  
  // Memory
  memoryEnabled: boolean;
  memoryPath: string;
}

const DEFAULT_CONFIG: Config = {
  workspace: process.cwd(),
  debug: false,
  provider: 'openai',
  model: 'gpt-4',
  toolsEnabled: true,
  streamingEnabled: true,
  theme: 'dark',
  showTimestamps: true,
  multilineInput: false,
  historySize: 1000,
  historyFile: join(process.cwd(), '.claw_history'),
  toolConfirmations: true,
  maxParallelTools: 5,
  memoryEnabled: true,
  memoryPath: join(process.cwd(), '.claw_memory'),
};

export class ConfigManager {
  static async load(path?: string, overrides?: Partial<Config>): Promise<Config> {
    let config = { ...DEFAULT_CONFIG };
    
    // Load from file if exists
    if (path && existsSync(path)) {
      try {
        const content = readFileSync(path, 'utf-8');
        const fileConfig = YAML.parse(content);
        config = { ...config, ...fileConfig };
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    }
    
    // Apply environment variables (highest precedence)
    config = this.applyEnvVars(config);
    
    // Apply CLI overrides
    if (overrides) {
      config = { ...config, ...overrides };
    }
    
    return config;
  }

  private static applyEnvVars(config: Config): Config {
    const envMapping: Record<string, keyof Config> = {
      CLAW_WORKSPACE: 'workspace',
      CLAW_DEBUG: 'debug',
      CLAW_PROVIDER: 'provider',
      CLAW_MODEL: 'model',
      OPENAI_API_KEY: 'apiKey',
      ANTHROPIC_API_KEY: 'apiKey',
      CLAW_API_KEY: 'apiKey',
      CLAW_API_BASE_URL: 'apiBaseUrl',
      CLAW_TOOLS_ENABLED: 'toolsEnabled',
      CLAW_STREAMING_ENABLED: 'streamingEnabled',
      CLAW_THEME: 'theme',
      CLAW_SHOW_TIMESTAMPS: 'showTimestamps',
      CLAW_MULTILINE_INPUT: 'multilineInput',
      CLAW_HISTORY_SIZE: 'historySize',
      CLAW_HISTORY_FILE: 'historyFile',
      CLAW_TOOL_CONFIRMATIONS: 'toolConfirmations',
      CLAW_MAX_PARALLEL_TOOLS: 'maxParallelTools',
      CLAW_MEMORY_ENABLED: 'memoryEnabled',
      CLAW_MEMORY_PATH: 'memoryPath',
    };

    for (const [envVar, configKey] of Object.entries(envMapping)) {
      const value = process.env[envVar];
      if (value !== undefined) {
        switch (typeof config[configKey]) {
          case 'boolean':
            (config as any)[configKey] = value === 'true' || value === '1';
            break;
          case 'number':
            (config as any)[configKey] = parseInt(value, 10);
            break;
          default:
            (config as any)[configKey] = value;
        }
      }
    }

    return config;
  }

  static async initDefault(path: string): Promise<void> {
    const yaml = YAML.stringify(DEFAULT_CONFIG, {
      indent: 2,
      lineWidth: 0,
    });
    
    const content = `# ClawTerm Configuration
# Generated on ${new Date().toISOString()}

${yaml}
`;
    
    writeFileSync(path, content);
  }

  static async save(config: Config, path: string): Promise<void> {
    const yaml = YAML.stringify(config, {
      indent: 2,
      lineWidth: 0,
    });
    writeFileSync(path, yaml);
  }
}
