/**
 * Tool Executor - Runs tools from the registry
 */
interface ToolDefinition {
    name: string;
    description: string;
    parameters: Record<string, any>;
    handler: (params: Record<string, any>) => Promise<any>;
}
export declare class ToolExecutor {
    private tools;
    private toolRegistry;
    constructor();
    register(tool: ToolDefinition): void;
    listTools(): ToolDefinition[];
    getTool(name: string): ToolDefinition | undefined;
    execute(toolName: string, params: Record<string, unknown>): Promise<any>;
    hasTool(name: string): boolean;
}
export declare const toolExecutor: ToolExecutor;
export default ToolExecutor;
