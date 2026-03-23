/**
 * Streaming Hook - Live AI response streaming
 */
interface UseStreamingOptions {
    onChunk?: (chunk: string) => void;
    onComplete?: (fullResponse: string) => void;
    onError?: (error: Error) => void;
}
export declare const useStreaming: (options?: UseStreamingOptions) => {
    isStreaming: boolean;
    currentChunk: string;
    startStream: (prompt: string) => Promise<() => void>;
    cancelStream: () => void;
};
export default useStreaming;
