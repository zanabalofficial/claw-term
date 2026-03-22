import { useCallback, useState } from 'react';
import { Session } from '../core/SessionManager';
import { TOOL_REGISTRY, ToolName } from '../tools/registry';
import { executeTool } from './executor';

export function useToolExecution(session: Session) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [pendingTools, setPendingTools] = useState<string[]>([]);

  const executeToolCall = useCallback(async (
    name: string,
    args: any
  ): Promise<any> => {
    setIsExecuting(true);
    setPendingTools(prev => [...prev, name]);
    
    try {
      const tool = TOOL_REGISTRY[name as ToolName];
      if (!tool) {
        throw new Error(`Unknown tool: ${name}`);
      }

      // Validate input
      const validation = tool.schema.safeParse(args);
      if (!validation.success) {
        throw new Error(`Invalid arguments: ${validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
      }

      // Execute via real executor
      const result = await executeTool(name as ToolName, args);
      
      return result;
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    } finally {
      setIsExecuting(false);
      setPendingTools(prev => prev.filter(t => t !== name));
    }
  }, [session]);

  return { 
    executeTool: executeToolCall, 
    isExecuting, 
    pendingTools,
    pendingCount: pendingTools.length 
  };
}
