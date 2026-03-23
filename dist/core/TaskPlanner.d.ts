/**
 * Planning and Orchestration Tools
 * Task decomposition, validation, state machines, scheduling
 */
import { EventEmitter } from 'events';
export interface Task {
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
    dependencies: string[];
    subtasks: string[];
    parentId?: string;
    assignedTo?: string;
    priority: number;
    estimatedDuration?: number;
    actualDuration?: number;
    result?: any;
    error?: string;
    retryCount: number;
    maxRetries: number;
    tools: string[];
    metadata: Record<string, any>;
}
export interface Plan {
    id: string;
    goal: string;
    tasks: Map<string, Task>;
    rootTaskIds: string[];
    status: 'draft' | 'validated' | 'executing' | 'completed' | 'failed';
    createdAt: Date;
    updatedAt: Date;
}
export declare class TaskPlanner extends EventEmitter {
    private plans;
    decompose(goal: string, context?: any): Plan;
    createTask(plan: Plan, taskData: Partial<Task>, parentId?: string): Task;
    validatePlan(planId: string, availableTools: string[]): {
        valid: boolean;
        errors: string[];
    };
    private hasCircularDependency;
    getExecutionOrder(planId: string): string[];
    getReadyTasks(planId: string): Task[];
    updateTaskStatus(planId: string, taskId: string, status: Task['status'], result?: any, error?: string): void;
    private checkPlanCompletion;
    getProgress(planId: string): {
        completed: number;
        total: number;
        percentage: number;
    };
    getParallelGroups(planId: string): string[][];
}
export default TaskPlanner;
