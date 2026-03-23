// @ts-nocheck
/**
 * Planning and Orchestration Tools
 * Task decomposition, validation, state machines, scheduling
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

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

export class TaskPlanner extends EventEmitter {
  private plans: Map<string, Plan> = new Map();

  // Decompose goal into tasks
  decompose(goal: string, context?: any): Plan {
    const planId = uuidv4();
    const plan: Plan = {
      id: planId,
      goal,
      tasks: new Map(),
      rootTaskIds: [],
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Parse goal and create initial task structure
    // In practice, this would use LLM to decompose
    const rootTask = this.createTask(plan, {
      name: 'Execute goal',
      description: goal,
      tools: [],
    });

    plan.rootTaskIds.push(rootTask.id);
    this.plans.set(planId, plan);
    
    this.emit('plan:created', plan);
    return plan;
  }

  createTask(plan: Plan, taskData: Partial<Task>, parentId?: string): Task {
    const task: Task = {
      id: uuidv4(),
      name: taskData.name || 'Unnamed task',
      description: taskData.description || '',
      status: 'pending',
      dependencies: taskData.dependencies || [],
      subtasks: [],
      parentId,
      priority: taskData.priority || 1,
      estimatedDuration: taskData.estimatedDuration,
      retryCount: 0,
      maxRetries: taskData.maxRetries || 3,
      tools: taskData.tools || [],
      metadata: taskData.metadata || {},
    };

    plan.tasks.set(task.id, task);

    if (parentId) {
      const parent = plan.tasks.get(parentId);
      if (parent) {
        parent.subtasks.push(task.id);
      }
    }

    plan.updatedAt = new Date();
    this.emit('task:created', { planId: plan.id, task });
    
    return task;
  }

  // Validate plan feasibility
  validatePlan(planId: string, availableTools: string[]): { valid: boolean; errors: string[] } {
    const plan = this.plans.get(planId);
    if (!plan) return { valid: false, errors: ['Plan not found'] };

    const errors: string[] = [];

    for (const task of plan.tasks.values()) {
      // Check tool availability
      for (const tool of task.tools) {
        if (!availableTools.includes(tool)) {
          errors.push(`Task "${task.name}" requires unavailable tool: ${tool}`);
        }
      }

      // Check for circular dependencies
      if (this.hasCircularDependency(plan, task.id)) {
        errors.push(`Task "${task.name}" has circular dependencies`);
      }

      // Check dependency existence
      for (const depId of task.dependencies) {
        if (!plan.tasks.has(depId)) {
          errors.push(`Task "${task.name}" references non-existent dependency: ${depId}`);
        }
      }
    }

    const valid = errors.length === 0;
    if (valid) {
      plan.status = 'validated';
    }

    return { valid, errors };
  }

  private hasCircularDependency(plan: Plan, taskId: string, visited = new Set<string>()): boolean {
    if (visited.has(taskId)) return true;
    
    visited.add(taskId);
    const task = plan.tasks.get(taskId);
    if (!task) return false;

    for (const depId of task.dependencies) {
      if (this.hasCircularDependency(plan, depId, new Set(visited))) {
        return true;
      }
    }

    return false;
  }

  // Get execution order (topological sort)
  getExecutionOrder(planId: string): string[] {
    const plan = this.plans.get(planId);
    if (!plan) return [];

    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (taskId: string) => {
      if (visited.has(taskId)) return;
      visited.add(taskId);

      const task = plan.tasks.get(taskId);
      if (!task) return;

      // Visit dependencies first
      for (const depId of task.dependencies) {
        visit(depId);
      }

      result.push(taskId);
    };

    for (const rootId of plan.rootTaskIds) {
      visit(rootId);
    }

    return result;
  }

  // Get ready tasks (dependencies satisfied)
  getReadyTasks(planId: string): Task[] {
    const plan = this.plans.get(planId);
    if (!plan) return [];

    return Array.from(plan.tasks.values()).filter(task => {
      if (task.status !== 'pending') return false;
      
      // Check all dependencies are completed
      return task.dependencies.every(depId => {
        const dep = plan.tasks.get(depId);
        return dep?.status === 'completed';
      });
    });
  }

  // Update task status
  updateTaskStatus(planId: string, taskId: string, status: Task['status'], result?: any, error?: string): void {
    const plan = this.plans.get(planId);
    if (!plan) return;

    const task = plan.tasks.get(taskId);
    if (!task) return;

    task.status = status;
    
    if (status === 'completed') {
      task.result = result;
      task.actualDuration = task.actualDuration || Date.now() - (task.metadata.startTime || Date.now());
    }
    
    if (status === 'failed') {
      task.error = error;
      task.retryCount++;
      
      if (task.retryCount < task.maxRetries) {
        task.status = 'pending'; // Will be retried
      }
    }

    if (status === 'in_progress' && !task.metadata.startTime) {
      task.metadata.startTime = Date.now();
    }

    plan.updatedAt = new Date();
    this.emit('task:updated', { planId, taskId, status, result, error });

    // Check if plan is complete
    this.checkPlanCompletion(plan);
  }

  private checkPlanCompletion(plan: Plan): void {
    const allTasks = Array.from(plan.tasks.values());
    const allCompleted = allTasks.every(t => t.status === 'completed');
    const anyFailed = allTasks.some(t => t.status === 'failed');

    if (allCompleted) {
      plan.status = 'completed';
      this.emit('plan:completed', plan);
    } else if (anyFailed) {
      plan.status = 'failed';
      this.emit('plan:failed', plan);
    }
  }

  // Get plan progress
  getProgress(planId: string): { completed: number; total: number; percentage: number } {
    const plan = this.plans.get(planId);
    if (!plan) return { completed: 0, total: 0, percentage: 0 };

    const tasks = Array.from(plan.tasks.values());
    const completed = tasks.filter(t => t.status === 'completed').length;
    const total = tasks.length;

    return {
      completed,
      total,
      percentage: total > 0 ? (completed / total) * 100 : 0,
    };
  }

  // Parallel execution groups
  getParallelGroups(planId: string): string[][] {
    const order = this.getExecutionOrder(planId);
    const plan = this.plans.get(planId);
    if (!plan) return [];

    const groups: string[][] = [];
    const completed = new Set<string>();

    while (completed.size < order.length) {
      const group: string[] = [];
      
      for (const taskId of order) {
        if (completed.has(taskId)) continue;
        
        const task = plan.tasks.get(taskId);
        if (!task) continue;

        // Check if all dependencies are completed
        const depsSatisfied = task.dependencies.every(depId => completed.has(depId));
        
        if (depsSatisfied) {
          group.push(taskId);
        }
      }

      if (group.length === 0) break;
      
      groups.push(group);
      group.forEach(id => completed.add(id));
    }

    return groups;
  }
}

export default TaskPlanner;
