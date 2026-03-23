// @ts-nocheck
/**
 * Provider Adapters - OpenAI, Anthropic, Local
 * Exact streaming protocol implementation
 */
import { EventEmitter } from 'events';
import fetch from 'node-fetch';
// ============================================================================
// OpenAI Adapter
// ============================================================================
export class OpenAIAdapter extends EventEmitter {
    config;
    constructor(config) {
        super();
        this.config = {
            temperature: 0.7,
            maxTokens: 4096,
            ...config,
        };
    }
    async streamResponse(messages, callbacks, tools) {
        const url = this.config.apiBaseUrl || 'https://api.openai.com/v1/chat/completions';
        const body = {
            model: this.config.model,
            messages: messages.map(m => ({
                role: m.role,
                content: m.content,
                name: m.name,
            })),
            temperature: this.config.temperature,
            max_tokens: this.config.maxTokens,
            stream: true,
        };
        // Add tools if provided
        if (tools && tools.length > 0) {
            body.tools = tools.map(t => ({
                type: 'function',
                function: {
                    name: t.name,
                    description: t.description,
                    parameters: t.parameters,
                },
            }));
            body.tool_choice = 'auto';
        }
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`OpenAI API error: ${response.status} - ${error}`);
            }
            if (!response.body) {
                throw new Error('No response body');
            }
            // Process SSE stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let currentToolCall = null;
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            callbacks.onComplete();
                            return;
                        }
                        try {
                            const chunk = JSON.parse(data);
                            const delta = chunk.choices?.[0]?.delta;
                            if (!delta)
                                continue;
                            // Handle content
                            if (delta.content) {
                                callbacks.onToken(delta.content);
                            }
                            // Handle tool calls
                            if (delta.tool_calls) {
                                for (const toolCall of delta.tool_calls) {
                                    if (toolCall.id) {
                                        // New tool call
                                        currentToolCall = {
                                            id: toolCall.id,
                                            name: toolCall.function?.name || '',
                                            arguments: toolCall.function?.arguments || '',
                                        };
                                    }
                                    else if (toolCall.function?.arguments) {
                                        // Accumulating arguments
                                        currentToolCall.arguments += toolCall.function.arguments;
                                    }
                                    // Check if complete
                                    if (currentToolCall && this.isValidJSON(currentToolCall.arguments)) {
                                        try {
                                            const args = JSON.parse(currentToolCall.arguments);
                                            callbacks.onToolCall({
                                                id: currentToolCall.id,
                                                name: currentToolCall.name,
                                                arguments: args,
                                            });
                                            currentToolCall = null;
                                        }
                                        catch {
                                            // Not complete yet
                                        }
                                    }
                                }
                            }
                        }
                        catch (e) {
                            // Ignore parse errors for malformed chunks
                        }
                    }
                }
            }
            callbacks.onComplete();
        }
        catch (error) {
            callbacks.onError(error);
        }
    }
    isValidJSON(str) {
        try {
            JSON.parse(str);
            return true;
        }
        catch {
            return false;
        }
    }
}
// ============================================================================
// Anthropic Adapter
// ============================================================================
export class AnthropicAdapter extends EventEmitter {
    config;
    constructor(config) {
        super();
        this.config = {
            temperature: 0.7,
            maxTokens: 4096,
            ...config,
        };
    }
    async streamResponse(messages, callbacks, tools) {
        const url = this.config.apiBaseUrl || 'https://api.anthropic.com/v1/messages';
        // Convert messages to Anthropic format
        const systemMessage = messages.find(m => m.role === 'system');
        const conversationMessages = messages.filter(m => m.role !== 'system');
        const body = {
            model: this.config.model,
            messages: conversationMessages.map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content,
            })),
            max_tokens: this.config.maxTokens,
            temperature: this.config.temperature,
            stream: true,
        };
        if (systemMessage) {
            body.system = systemMessage.content;
        }
        // Add tools if provided (Anthropic uses "tools" similar to OpenAI)
        if (tools && tools.length > 0) {
            body.tools = tools.map(t => ({
                name: t.name,
                description: t.description,
                input_schema: t.parameters,
            }));
        }
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'x-api-key': this.config.apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Anthropic API error: ${response.status} - ${error}`);
            }
            if (!response.body) {
                throw new Error('No response body');
            }
            // Process SSE stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            callbacks.onComplete();
                            return;
                        }
                        try {
                            const event = JSON.parse(data);
                            switch (event.type) {
                                case 'content_block_delta':
                                    if (event.delta.text) {
                                        callbacks.onToken(event.delta.text);
                                    }
                                    break;
                                case 'tool_use':
                                    callbacks.onToolCall({
                                        id: event.id,
                                        name: event.name,
                                        arguments: event.input,
                                    });
                                    break;
                            }
                        }
                        catch (e) {
                            // Ignore parse errors
                        }
                    }
                }
            }
            callbacks.onComplete();
        }
        catch (error) {
            callbacks.onError(error);
        }
    }
}
// ============================================================================
// Local/Ollama Adapter
// ============================================================================
export class LocalAdapter extends EventEmitter {
    config;
    constructor(config) {
        super();
        this.config = {
            temperature: 0.7,
            maxTokens: 4096,
            apiBaseUrl: 'http://localhost:11434',
            ...config,
        };
    }
    async streamResponse(messages, callbacks, tools) {
        const url = `${this.config.apiBaseUrl}/api/chat`;
        // Ollama format
        const body = {
            model: this.config.model,
            messages: messages.map(m => ({
                role: m.role,
                content: m.content,
            })),
            stream: true,
            options: {
                temperature: this.config.temperature,
                num_predict: this.config.maxTokens,
            },
        };
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                throw new Error(`Ollama error: ${response.status}`);
            }
            if (!response.body) {
                throw new Error('No response body');
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(l => l.trim());
                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.message?.content) {
                            callbacks.onToken(data.message.content);
                        }
                        if (data.done) {
                            callbacks.onComplete();
                            return;
                        }
                    }
                    catch {
                        // Ignore parse errors
                    }
                }
            }
            callbacks.onComplete();
        }
        catch (error) {
            callbacks.onError(error);
        }
    }
}
export function createProvider(type, config) {
    switch (type) {
        case 'openai':
            return new OpenAIAdapter(config);
        case 'anthropic':
            return new AnthropicAdapter(config);
        case 'local':
            return new LocalAdapter(config);
        default:
            throw new Error(`Unknown provider: ${type}`);
    }
}
