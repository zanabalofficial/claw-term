export interface Config {
    workspace: string;
    debug: boolean;
    provider: 'openai' | 'anthropic' | 'local';
    model: string;
    apiKey?: string;
    apiBaseUrl?: string;
    toolsEnabled: boolean;
    streamingEnabled: boolean;
    theme: 'dark' | 'light';
    showTimestamps: boolean;
    multilineInput: boolean;
    historySize: number;
    historyFile: string;
    toolConfirmations: boolean;
    maxParallelTools: number;
    memoryEnabled: boolean;
    memoryPath: string;
}
export declare class ConfigManager {
    static load(path?: string, overrides?: Partial<Config>): Promise<Config>;
    private static applyEnvVars;
    static initDefault(path: string): Promise<void>;
    static save(config: Config, path: string): Promise<void>;
}
