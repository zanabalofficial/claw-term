/**
 * Sandboxed Code Execution - Isolated Python/JS/SQL runtimes
 * Secure execution environment with resource limits
 */
export interface SandboxConfig {
    language: 'python' | 'javascript' | 'typescript' | 'sql' | 'shell';
    timeout?: number;
    memoryLimit?: number;
    cpuLimit?: number;
    network?: boolean;
    filesystem?: 'read-only' | 'read-write' | 'none';
    allowedModules?: string[];
    forbiddenModules?: string[];
}
export interface ExecutionResult {
    stdout: string;
    stderr: string;
    exitCode: number;
    duration: number;
    memoryUsed?: number;
    files?: Record<string, string>;
}
export declare class CodeSandbox {
    private baseDir;
    private activeContainers;
    constructor();
    execute(code: string, config: SandboxConfig): Promise<ExecutionResult>;
    private executePython;
    private executeJavaScript;
    private executeSQL;
    private executeShell;
    private cleanup;
    checkAvailability(): Promise<{
        python: boolean;
        node: boolean;
        sqlite: boolean;
    }>;
    private checkCommand;
}
export default CodeSandbox;
