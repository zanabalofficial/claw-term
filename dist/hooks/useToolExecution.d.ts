/**
 * Tool Execution Hook
 */
interface ToolExecutionResult {
    success: boolean;
    output?: string;
    error?: string;
    duration?: number;
}
interface UseToolExecutionOptions {
    onToolStart?: (toolName: string, input: Record<string, unknown>) => void;
    onToolComplete?: (toolName: string, result: ToolExecutionResult) => void;
}
export declare const useToolExecution: (options?: UseToolExecutionOptions) => {
    isExecuting: boolean;
    activeTool: string | null;
    lastResult: ToolExecutionResult | null;
    executeTool: (toolName: string, input: Record<string, unknown>) => Promise<ToolExecutionResult>;
};
export default useToolExecution;
