/**
 * Local LLM Hosting - Built-in model server using llama.cpp
 * Run models locally without external API calls
 */
import { EventEmitter } from 'events';
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
export declare class LocalLLMServer extends EventEmitter {
    private process;
    private serverUrl;
    private modelsDir;
    private isRunning;
    constructor();
    static readonly AVAILABLE_MODELS: ModelDownloadInfo[];
    checkPrerequisites(): Promise<{
        ok: boolean;
        missing: string[];
    }>;
    downloadModel(modelInfo: ModelDownloadInfo, onProgress?: (percent: number) => void): Promise<void>;
    start(config?: Partial<LocalModelConfig>): Promise<void>;
    stop(): Promise<void>;
    healthCheck(): Promise<boolean>;
    complete(prompt: string, options?: {
        temperature?: number;
        maxTokens?: number;
        stop?: string[];
        stream?: boolean;
    }): Promise<string>;
    streamComplete(prompt: string, options?: {
        temperature?: number;
        maxTokens?: number;
        stop?: string[];
    }): AsyncGenerator<string>;
    private findServerBinary;
    private waitForServer;
    private getDefaultModel;
    getInstalledModels(): string[];
}
export default LocalLLMServer;
