import { useCallback, useRef } from 'react';
import { Session, Message } from '../core/SessionManager';
import { Config } from '../core/ConfigManager';
import { createProvider, StreamCallbacks } from '../providers/adapters';
import { TOOL_REGISTRY, ToolName } from '../tools/registry';

export function useStreaming(session: Session, config: Config) {
  const abortRef = useRef<AbortController | null>(null);
  const isStreamingRef = useRef(false);

  const streamResponse = useCallback(async (
    content: string,
    callbacks: {
      onToken: (token: string) => void;
      onToolCall: (toolCall: { name: string; arguments: any }) => void;
      onComplete: () => void;
      onError: (error: Error) => void;
    }
  ) => {
    if (isStreamingRef.current) {
      callbacks.onError(new Error('Already streaming'));
      return;
    }

    abortRef.current = new AbortController();
    isStreamingRef.current = true;

    try {
      // Build message history
      const messages = session.getMessages().map(m => ({
        role: m.role === 'tool-call' || m.role === 'tool-result' ? 'tool' : m.role,
        content: m.content,
      }));

      // Add current user message
      messages.push({ role: 'user' as const, content });

      // Create provider
      const provider = createProvider(config.provider, {
        apiKey: config.apiKey || '',
        apiBaseUrl: config.apiBaseUrl,
        model: config.model,
        temperature: 0.7,
        maxTokens: 4096,
      });

      // Build tool definitions
      const tools = config.toolsEnabled ? Object.values(TOOL_REGISTRY).map(t => ({
        name: t.name,
        description: t.description,
        parameters: t.schema instanceof Object ? t.schema : {},
      })) : undefined;

      // Start streaming
      const streamCallbacks: StreamCallbacks = {
        onToken: (token) => {
          if (abortRef.current?.signal.aborted) return;
          callbacks.onToken(token);
        },
        onToolCall: (toolCall) => {
          if (abortRef.current?.signal.aborted) return;
          callbacks.onToolCall({
            name: toolCall.name,
            arguments: toolCall.arguments,
          });
        },
        onComplete: () => {
          isStreamingRef.current = false;
          callbacks.onComplete();
        },
        onError: (error) => {
          isStreamingRef.current = false;
          callbacks.onError(error);
        },
      };

      await provider.streamResponse(messages, streamCallbacks, tools);

    } catch (error) {
      isStreamingRef.current = false;
      callbacks.onError(error as Error);
    }
  }, [session, config]);

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    isStreamingRef.current = false;
  }, []);

  const isStreaming = useCallback(() => {
    return isStreamingRef.current;
  }, []);

  return { streamResponse, cancelStream, isStreaming };
}
