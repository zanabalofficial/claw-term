/**
 * Agent Swarm Mode - Multiple AI agents working together
 * Orchestrates multiple specialized agents for complex tasks
 */
import { EventEmitter } from 'events';
export interface SwarmAgent {
    id: string;
    name: string;
    role: 'coordinator' | 'researcher' | 'coder' | 'reviewer' | 'planner' | 'executor';
    model: string;
    systemPrompt: string;
    temperature: number;
    messages: Array<{
        role: 'user' | 'assistant' | 'system' | 'tool';
        content: string;
    }>;
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
export type SwarmRole = 'coordinator' | 'researcher' | 'coder' | 'reviewer' | 'planner' | 'executor';
export interface SwarmMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    toolCalls?: Array<{
        name: string;
        input: Record<string, unknown>;
    }>;
    toolResult?: string;
}
export interface SwarmConfig {
    maxAgents: number;
    coordinationMode: 'sequential' | 'parallel' | 'hierarchical';
    timeout: number;
    retries: number;
}
export declare class AgentSwarm extends EventEmitter {
    private agents;
    private tasks;
    private apiKey;
    private provider;
    constructor(config: {
        apiKey: string;
        provider: string;
    });
    initializeDefaultSwarm(): Promise<void>;
    addAgent(agent: SwarmAgent): void;
    executeComplexTask(taskDescription: string): Promise<{
        result: string;
        tasks: SwarmTask[];
        agentOutputs: Map<string, string>;
    }>;
    private runAgent;
    getAgents(): SwarmAgent[];
    getTasks(): SwarmTask[];
}
export default AgentSwarm;
