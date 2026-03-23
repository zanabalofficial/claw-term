// @ts-nocheck
/**
 * Streaming Hook - Live AI response streaming
 */

import { useState, useCallback, useRef } from 'react';

interface UseStreamingOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}

export const useStreaming = (options: UseStreamingOptions = {}) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentChunk, setCurrentChunk] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const startStream = useCallback(async (prompt: string) => {
    setIsStreaming(true);
    setCurrentChunk('');
    
    // Simulate streaming for demo
    const words = prompt.split(' ');
    let response = `I received your message: "${prompt}".\n\n`;
    response += "This is a simulated streaming response. In production,\n";
    response += "this would connect to the actual AI provider and stream\n";
    response += "tokens in real-time as they are generated.\n\n";
    response += "Features enabled:\n";
    response += "• Real-time token streaming\n";
    response += "• Tool usage display\n";
    response += "• Progress indicators\n";
    response += "• Error handling\n";
    
    let i = 0;
    const interval = setInterval(() => {
      if (i >= response.length) {
        clearInterval(interval);
        setIsStreaming(false);
        options.onComplete?.(response);
        return;
      }
      
      setCurrentChunk(prev => prev + response[i]);
      options.onChunk?.(response[i]);
      i++;
    }, 10);
    
    return () => {
      clearInterval(interval);
      setIsStreaming(false);
    };
  }, [options]);

  const cancelStream = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  return {
    isStreaming,
    currentChunk,
    startStream,
    cancelStream,
  };
};

export default useStreaming;