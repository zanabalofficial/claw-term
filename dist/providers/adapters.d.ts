/**
 * Provider Adapters - OpenAI, Anthropic, Local
 * Exact streaming protocol implementation
 */
import { EventEmitter } from 'events';
export interface Message {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    name?: string;
    tool_calls?: any[];
}
export interface StreamCallbacks {
    onToken: (token: string) => void;
    onToolCall: (toolCall: {
        id: string;
        name: string;
        arguments: any;
    }) => void;
    onComplete: () => void;
    onError: (error: Error) => void;
}
export interface ProviderConfig {
    apiKey: string;
    apiBaseUrl?: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
}
export declare class OpenAIAdapter extends EventEmitter {
    private config;
    constructor(config: ProviderConfig);
    streamResponse(messages: Message[], callbacks: StreamCallbacks, tools?: any[]): Promise<void>;
    private isValidJSON;
}
export declare class AnthropicAdapter extends EventEmitter {
    private config;
    constructor(config: ProviderConfig);
    streamResponse(messages: Message[], callbacks: StreamCallbacks, tools?: any[]): Promise<void>;
}
export declare class LocalAdapter extends EventEmitter {
    private config;
    constructor(config: ProviderConfig);
    streamResponse(messages: Message[], callbacks: StreamCallbacks, tools?: any[]): Promise<void>;
}
export type ProviderType = 'openai' | 'anthropic' | 'local';
export declare function createProvider(type: ProviderType, config: ProviderConfig): OpenAIAdapter | AnthropicAdapter | LocalAdapter;
