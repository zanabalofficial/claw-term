import { useCallback, useState } from 'react';
import { Session } from '../core/SessionManager';
import { TOOL_REGISTRY, ToolName } from '../tools/registry';

export function useToolExecution(session: Session) {
  const [isExecuting, setIsExecuting] = useState(false);

  const executeTool = useCallback(async (
    name: string,
    args: any
  ): Promise<any> => {
    setIsExecuting(true);
    
    try {
      const tool = TOOL_REGISTRY[name as ToolName];
      if (!tool) {
        throw new Error(`Unknown tool: ${name}`);
      }

      // Validate input
      const validation = tool.schema.safeParse(args);
      if (!validation.success) {
        throw new Error(`Invalid arguments: ${validation.error.message}`);
      }

      // Execute based on tool type
      // In real implementation, these would call actual implementations
      switch (name as ToolName) {
        case 'read':
          // Call filesystem read
          return `[Content of ${args.file_path || args.path}]`;
          
        case 'write':
          // Call filesystem write
          return { success: true, path: args.file_path || args.path };
          
        case 'edit':
          // Call filesystem edit
          return { success: true };
          
        case 'exec':
          // Call exec
          return { stdout: 'Command output', stderr: '', exitCode: 0 };
          
        case 'web_search':
          // Call web search
          return [{ title: 'Result 1', url: 'https://example.com', snippet: '...' }];
          
        case 'web_fetch':
          // Call web fetch
          return 'Fetched content...';
          
        case 'memory_search':
          // Call memory search
          return [{ path: 'MEMORY.md', content: '...', score: 0.95 }];
          
        default:
          return { status: 'executed', tool: name };
      }
    } finally {
      setIsExecuting(false);
    }
  }, [session]);

  return { executeTool, isExecuting };
}
