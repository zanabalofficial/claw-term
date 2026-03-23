// @ts-nocheck
/**
 * OpenClaw Ecosystem Bridge
 * Connect to AgentWorld, ClawdChat, and other OpenClaw services
 */
import { EventEmitter } from 'events';
import fetch from 'node-fetch';
export class OpenClawBridge extends EventEmitter {
    agentWorld;
    clawdChat;
    wsConnections = new Map();
    // Connect to AgentWorld
    connectAgentWorld(config) {
        this.agentWorld = config;
        this.emit('agentWorld:connected', { url: config.apiUrl });
    }
    // Connect to ClawdChat
    connectClawdChat(config) {
        this.clawdChat = config;
        this.emit('clawdChat:connected', { did: config.did });
    }
    // AgentWorld: List agents
    async listAgents() {
        if (!this.agentWorld)
            throw new Error('AgentWorld not connected');
        const response = await fetch(`${this.agentWorld.apiUrl}/api/v1/agents`, {
            headers: this.agentWorld.apiKey ? { 'Authorization': `Bearer ${this.agentWorld.apiKey}` } : {},
        });
        if (!response.ok)
            throw new Error(`Failed to list agents: ${response.status}`);
        return response.json();
    }
    // AgentWorld: Get agent details
    async getAgent(agentId) {
        if (!this.agentWorld)
            throw new Error('AgentWorld not connected');
        const response = await fetch(`${this.agentWorld.apiUrl}/api/v1/agents/${agentId}`, {
            headers: this.agentWorld.apiKey ? { 'Authorization': `Bearer ${this.agentWorld.apiKey}` } : {},
        });
        if (!response.ok)
            throw new Error(`Failed to get agent: ${response.status}`);
        return response.json();
    }
    // AgentWorld: Send message to agent
    async sendToAgent(agentId, content) {
        if (!this.agentWorld)
            throw new Error('AgentWorld not connected');
        const response = await fetch(`${this.agentWorld.apiUrl}/api/v1/agents/${agentId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.agentWorld.apiKey ? { 'Authorization': `Bearer ${this.agentWorld.apiKey}` } : {}),
            },
            body: JSON.stringify({ content }),
        });
        if (!response.ok)
            throw new Error(`Failed to send message: ${response.status}`);
    }
    // AgentWorld: Deploy skill to agent
    async deploySkill(agentId, skillName) {
        if (!this.agentWorld)
            throw new Error('AgentWorld not connected');
        const response = await fetch(`${this.agentWorld.apiUrl}/api/v1/agents/${agentId}/skills`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.agentWorld.apiKey ? { 'Authorization': `Bearer ${this.agentWorld.apiKey}` } : {}),
            },
            body: JSON.stringify({ skill_name: skillName }),
        });
        if (!response.ok)
            throw new Error(`Failed to deploy skill: ${response.status}`);
    }
    // AgentWorld: Subscribe to world events
    subscribeToWorld(onMessage) {
        if (!this.agentWorld)
            throw new Error('AgentWorld not connected');
        const ws = new WebSocket(`${this.agentWorld.apiUrl.replace('http', 'ws')}/ws/world`);
        ws.onopen = () => {
            this.emit('world:subscribed');
        };
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            onMessage(data);
            this.emit('world:message', data);
        };
        this.wsConnections.set('world', ws);
    }
    // ClawdChat: Send A2A message
    async sendA2A(to, content, options = {}) {
        if (!this.clawdChat)
            throw new Error('ClawdChat not connected');
        const message = {
            from: this.clawdChat.did,
            to,
            content,
            timestamp: new Date().toISOString(),
            ...options,
        };
        const response = await fetch(`${this.clawdChat.relayUrl}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message),
        });
        if (!response.ok)
            throw new Error(`Failed to send A2A message: ${response.status}`);
        const result = await response.json();
        return result.messageId;
    }
    // ClawdChat: Subscribe to A2A messages
    subscribeToA2A(onMessage) {
        if (!this.clawdChat)
            throw new Error('ClawdChat not connected');
        const ws = new WebSocket(`${this.clawdChat.relayUrl.replace('http', 'ws')}/ws/${this.clawdChat.did}`);
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            onMessage(data);
            this.emit('a2a:message', data);
        };
        this.wsConnections.set('a2a', ws);
    }
    // Register as skill in AgentWorld
    async registerAsSkill(skillManifest) {
        if (!this.agentWorld)
            throw new Error('AgentWorld not connected');
        const response = await fetch(`${this.agentWorld.apiUrl}/api/v1/skills/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.agentWorld.apiKey ? { 'Authorization': `Bearer ${this.agentWorld.apiKey}` } : {}),
            },
            body: JSON.stringify({
                ...skillManifest,
                endpoint: 'local', // Indicates this is a local skill
                did: this.clawdChat?.did,
            }),
        });
        if (!response.ok)
            throw new Error(`Failed to register skill: ${response.status}`);
        this.emit('skill:registered', { name: skillManifest.name });
    }
    // Heartbeat to OpenClaw services
    async sendHeartbeat() {
        if (this.agentWorld) {
            try {
                await fetch(`${this.agentWorld.apiUrl}/api/v1/heartbeat`, {
                    method: 'POST',
                    headers: this.agentWorld.apiKey ? { 'Authorization': `Bearer ${this.agentWorld.apiKey}` } : {},
                });
            }
            catch { }
        }
    }
    // Disconnect all
    disconnect() {
        for (const [name, ws] of this.wsConnections) {
            ws.close();
            this.emit('disconnected', { name });
        }
        this.wsConnections.clear();
    }
    // Check connections status
    getStatus() {
        return {
            agentWorld: !!this.agentWorld,
            clawdChat: !!this.clawdChat,
            webSockets: Array.from(this.wsConnections.keys()),
        };
    }
}
export default OpenClawBridge;
