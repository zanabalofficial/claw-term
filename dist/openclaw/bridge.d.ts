/**
 * OpenClaw Ecosystem Bridge
 * Connect to AgentWorld, ClawdChat, and other OpenClaw services
 */
import { EventEmitter } from 'events';
export interface AgentWorldConfig {
    apiUrl: string;
    apiKey?: string;
    did?: string;
}
export interface ClawdChatConfig {
    relayUrl: string;
    did: string;
    privateKey: string;
}
export interface AgentInfo {
    id: string;
    name: string;
    status: 'active' | 'idle' | 'offline';
    skills: string[];
    location?: {
        x: number;
        y: number;
        z: number;
    };
}
export interface Message {
    id: string;
    from: string;
    to: string;
    content: string;
    timestamp: Date;
    type: 'chat' | 'task' | 'system';
}
export declare class OpenClawBridge extends EventEmitter {
    private agentWorld?;
    private clawdChat?;
    private wsConnections;
    connectAgentWorld(config: AgentWorldConfig): void;
    connectClawdChat(config: ClawdChatConfig): void;
    listAgents(): Promise<AgentInfo[]>;
    getAgent(agentId: string): Promise<AgentInfo>;
    sendToAgent(agentId: string, content: string): Promise<void>;
    deploySkill(agentId: string, skillName: string): Promise<void>;
    subscribeToWorld(onMessage: (msg: any) => void): void;
    sendA2A(to: string, content: string, options?: {
        replyTo?: string;
        threadId?: string;
    }): Promise<string>;
    subscribeToA2A(onMessage: (msg: Message) => void): void;
    registerAsSkill(skillManifest: {
        name: string;
        description: string;
        version: string;
        tools: string[];
    }): Promise<void>;
    sendHeartbeat(): Promise<void>;
    disconnect(): void;
    getStatus(): {
        agentWorld: boolean;
        clawdChat: boolean;
        webSockets: string[];
    };
}
export default OpenClawBridge;
