// @ts-nocheck
/**
 * Agent Swarm Mode - Multiple AI agents working together
 * Orchestrates multiple specialized agents for complex tasks
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { createProvider } from '../providers/adapters';

export interface SwarmAgent {
  id: string;
  name: string;
  role: 'coordinator' | 'researcher' | 'coder' | 'reviewer' | 'planner' | 'executor';
  model: string;
  systemPrompt: string;
  temperature: number;
  messages: Array<{ role: 'user' | 'assistant' | 'system' | 'tool'; content: string }>;
  status: 'idle' | 'working' | 'completed' | 'error' | 'pending';
}

export interface SwarmTask {
  id: string;
  description: string;
  assignedTo: string;
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'error';
  result?: string;
}

// Missing export types
export type SwarmRole = 'coordinator' | 'researcher' | 'coder' | 'reviewer' | 'planner' | 'executor';

export interface SwarmMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: Array<{ name: string; input: Record<string, unknown> }>;
  toolResult?: string;
}

export interface SwarmConfig {
  maxAgents: number;
  coordinationMode: 'sequential' | 'parallel' | 'hierarchical';
  timeout: number;
  retries: number;
}

export class AgentSwarm extends EventEmitter {
  private agents: Map<string, SwarmAgent> = new Map();
  private tasks: Map<string, SwarmTask> = new Map();
  private apiKey: string;
  private provider: string;

  constructor(config: { apiKey: string; provider: string }) {
    super();
    this.apiKey = config.apiKey;
    this.provider = config.provider;
  }

  // Initialize default swarm with specialized agents
  async initializeDefaultSwarm(): Promise<void> {
    // Coordinator agent - manages the swarm
    this.addAgent({
      id: 'coordinator',
      name: 'Coordinator',
      role: 'coordinator',
      model: 'gpt-4',
      systemPrompt: `You are the swarm coordinator. Your job is to:
1. Break down complex tasks into subtasks
2. Assign tasks to appropriate specialized agents
3. Synthesize results from all agents
4. Ensure consistency and quality
5. Handle dependencies between tasks`,
      temperature: 0.3,
      messages: [],
      status: 'idle',
    });

    // Researcher agent - gathers information
    this.addAgent({
      id: 'researcher',
      name: 'Researcher',
      role: 'researcher',
      model: 'gpt-4',
      systemPrompt: `You are a research specialist. Your job is to:
1. Search for and gather relevant information
2. Analyze documentation, code, and data
3. Summarize findings clearly
4. Cite sources and provide context
5. Use web_search and web_fetch tools as needed`,
      temperature: 0.5,
      messages: [],
      status: 'idle',
    });

    // Coder agent - writes and modifies code
    this.addAgent({
      id: 'coder',
      name: 'Coder',
      role: 'coder',
      model: 'gpt-4',
      systemPrompt: `You are a senior software engineer. Your job is to:
1. Write clean, efficient, well-documented code
2. Follow best practices and patterns
3. Handle edge cases and errors
4. Use read, write, and edit tools for file operations
5. Write tests when appropriate`,
      temperature: 0.2,
      messages: [],
      status: 'idle',
    });

    // Reviewer agent - reviews and critiques
    this.addAgent({
      id: 'reviewer',
      name: 'Reviewer',
      role: 'reviewer',
      model: 'gpt-4',
      systemPrompt: `You are a code reviewer and quality assurance specialist. Your job is to:
1. Review code for bugs, security issues, and anti-patterns
2. Check for adherence to standards
3. Suggest improvements and optimizations
4. Verify that requirements are met
5. Be thorough but constructive`,
      temperature: 0.3,
      messages: [],
      status: 'idle',
    });

    // Planner agent - creates implementation plans
    this.addAgent({
      id: 'planner',
      name: 'Planner',
      role: 'planner',
      model: 'gpt-4',
      systemPrompt: `You are an architecture and planning specialist. Your job is to:
1. Design system architecture and data models
2. Create implementation plans with clear steps
3. Identify risks and dependencies
4. Estimate complexity and effort
5. Break down large tasks into manageable pieces`,
      temperature: 0.4,
      messages: [],
      status: 'idle',
    });

    // Executor agent - runs commands and tests
    this.addAgent({
      id: 'executor',
      name: 'Executor',
      role: 'executor',
      model: 'gpt-4',
      systemPrompt: `You are a DevOps and testing specialist. Your job is to:
1. Run commands, tests, and build processes
2. Verify that code works correctly
3. Check for runtime errors
4. Execute deployment steps
5. Use exec and process tools for operations`,
      temperature: 0.2,
      messages: [],
      status: 'idle',
    });
  }

  addAgent(agent: SwarmAgent): void {
    this.agents.set(agent.id, agent);
    this.emit('agentAdded', agent);
  }

  // Execute a complex task using the swarm
  async executeComplexTask(taskDescription: string): Promise<{
    result: string;
    tasks: SwarmTask[];
    agentOutputs: Map<string, string>;
  }> {
    this.emit('taskStarted', taskDescription);

    // Step 1: Coordinator breaks down the task
    const coordinator = this.agents.get('coordinator')!;
    const plan = await this.runAgent(coordinator, 
      `Break down this task into subtasks and assign them to the appropriate agents: ${taskDescription}\n\n` +
      `Available agents: ${Array.from(this.agents.values()).map(a => `${a.id} (${a.role})`).join(', ')}\n\n` +
      `Return your response as a JSON array of tasks: [{"id": "task-1", "description": "...", "assignedTo": "agent-id", "dependencies": []}]`
    );

    // Parse the plan
    let subtasks: SwarmTask[];
    try {
      const jsonMatch = plan.match(/\[[\s\S]*\]/);
      subtasks = JSON.parse(jsonMatch ? jsonMatch[0] : '[]');
      subtasks.forEach(t => this.tasks.set(t.id, { ...t, status: 'pending' }));
    } catch {
      // Fallback: single task
      subtasks = [{
        id: 'task-1',
        description: taskDescription,
        assignedTo: 'coordinator',
        dependencies: [],
        status: 'pending',
      }];
    }

    // Step 2: Execute tasks in dependency order
    const completedTasks = new Set<string>();
    const agentOutputs = new Map<string, string>();

    while (completedTasks.size < subtasks.length) {
      const readyTasks = subtasks.filter(t => 
        t.status === 'pending' && 
        t.dependencies.every(d => completedTasks.has(d))
      );

      if (readyTasks.length === 0 && completedTasks.size < subtasks.length) {
        throw new Error('Circular dependency or stuck tasks detected');
      }

      // Execute ready tasks in parallel
      await Promise.all(readyTasks.map(async (task) => {
        task.status = 'in_progress';
        this.emit('taskProgress', task);

        const agent = this.agents.get(task.assignedTo);
        if (!agent) {
          task.status = 'error';
          return;
        }

        // Gather context from dependencies
        const context = task.dependencies
          .map(d => agentOutputs.get(d))
          .filter(Boolean)
          .join('\n\n---\n\n');

        const prompt = context 
          ? `Previous context:\n${context}\n\nYour task: ${task.description}`
          : task.description;

        try {
          const result = await this.runAgent(agent, prompt);
          task.result = result;
          agentOutputs.set(task.id, result);
          task.status = 'completed';
          completedTasks.add(task.id);
          this.emit('taskCompleted', task);
        } catch (error) {
          task.status = 'error';
          this.emit('taskError', task, error);
        }
      }));
    }

    // Step 3: Coordinator synthesizes final result
    const allResults = Array.from(agentOutputs.entries())
      .map(([id, result]) => `=== ${id} ===\n${result}`)
      .join('\n\n');

    const finalResult = await this.runAgent(coordinator,
      `Synthesize these results into a coherent final answer:\n\n${allResults}`
    );

    this.emit('taskCompleted', finalResult);

    return {
      result: finalResult,
      tasks: subtasks,
      agentOutputs,
    };
  }

  private async runAgent(agent: SwarmAgent, prompt: string): Promise<string> {
    agent.status = 'working';
    agent.messages.push({ role: 'user', content: prompt });

    const provider = createProvider(this.provider as any, {
      apiKey: this.apiKey,
      model: agent.model,
      temperature: agent.temperature,
    });

    return new Promise((resolve, reject) => {
      let response = '';

      provider.streamResponse(
        [
          { role: 'system', content: agent.systemPrompt },
          ...agent.messages.slice(-10), // Keep last 10 messages for context
        ],
        {
          onToken: (token) => {
            response += token;
          },
          onToolCall: () => {
            // Handle tool calls if needed
          },
          onComplete: () => {
            agent.messages.push({ role: 'assistant', content: response });
            agent.status = 'completed';
            resolve(response);
          },
          onError: (error) => {
            agent.status = 'error';
            reject(error);
          },
        }
      );
    });
  }

  getAgents(): SwarmAgent[] {
    return Array.from(this.agents.values());
  }

  getTasks(): SwarmTask[] {
    return Array.from(this.tasks.values());
  }
}

export default AgentSwarm;
