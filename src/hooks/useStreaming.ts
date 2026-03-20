import { useCallback, useRef } from 'react';
import { Session } from '../core/SessionManager';
import { Config } from '../core/ConfigManager';

interface StreamCallbacks {
  onToken: (token: string) => void;
  onToolCall: (toolCall: { name: string; arguments: any }) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export function useStreaming(session: Session, config: Config) {
  const abortRef = useRef<AbortController | null>(null);

  const streamResponse = useCallback(async (
    content: string,
    callbacks: StreamCallbacks
  ) => {
    abortRef.current = new AbortController();
    
    try {
      // In real implementation, connect to AI provider
      // This is a mock for demonstration
      
      const mockResponse = `I received your message: "${content}"\n\nIn a real implementation, this would stream from ${config.provider} using model ${config.model}.`;
      
      // Simulate streaming
      const tokens = mockResponse.split('');
      for (const token of tokens) {
        if (abortRef.current.signal.aborted) {
          throw new Error('Stream cancelled');
        }
        
        callbacks.onToken(token);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      callbacks.onComplete();
    } catch (error) {
      callbacks.onError(error as Error);
    }
  }, [session, config]);

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { streamResponse, cancelStream };
}
