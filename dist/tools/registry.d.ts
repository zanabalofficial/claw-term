/**
 * Tool Registry
 */
export { toolExecutor, ToolExecutor } from './executor';
export interface Tool {
    name: string;
    description: string;
    parameters: Record<string, any>;
}
export declare function getRegisteredTools(): Tool[];
export declare function hasTool(name: string): boolean;
export declare function executeTool(name: string, params: Record<string, unknown>): Promise<any>;
declare const _default: {
    getRegisteredTools: typeof getRegisteredTools;
    hasTool: typeof hasTool;
    executeTool: typeof executeTool;
};
export default _default;
