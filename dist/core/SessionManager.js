// @ts-nocheck
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
export class Session extends EventEmitter {
    id;
    createdAt;
    messages = [];
    config;
    messageListeners = new Set();
    constructor(config) {
        super();
        this.id = config.id || uuidv4();
        this.createdAt = new Date();
        this.config = config;
    }
    // Message management
    addMessage(message) {
        const fullMessage = {
            id: message.id || uuidv4(),
            timestamp: message.timestamp || new Date(),
            ...message
        };
        this.messages.push(fullMessage);
        this.emit('message', fullMessage);
        this.notifyListeners();
        this.persist();
    }
    appendToLastMessage(content) {
        if (this.messages.length === 0)
            return;
        const lastMessage = this.messages[this.messages.length - 1];
        if (lastMessage.role === 'assistant') {
            lastMessage.content += content;
            this.notifyListeners();
        }
        else {
            // Create new assistant message
            this.addMessage({
                role: 'assistant',
                content,
            });
        }
    }
    getMessages() {
        return [...this.messages];
    }
    getLastMessage() {
        return this.messages[this.messages.length - 1];
    }
    clear() {
        this.messages = [];
        this.notifyListeners();
        this.persist();
    }
    // Listeners
    onMessagesChange(listener) {
        this.messageListeners.add(listener);
        return () => this.messageListeners.delete(listener);
    }
    notifyListeners() {
        this.messageListeners.forEach(listener => listener(this.messages));
    }
    // Persistence
    persist() {
        // In a real implementation, save to SQLite or file
        // For now, keep in memory
    }
    // Queue for initial message
    queuedMessage = null;
    queueMessage(content) {
        this.queuedMessage = content;
    }
    getQueuedMessage() {
        const msg = this.queuedMessage;
        this.queuedMessage = null;
        return msg;
    }
    // Session info
    getDuration() {
        return Date.now() - this.createdAt.getTime();
    }
    getConfig() {
        return { ...this.config };
    }
    // Tool execution queue
    toolQueue = [];
    queueTool(name, arguments_) {
        this.toolQueue.push({ name, arguments: arguments_ });
    }
    getNextTool() {
        return this.toolQueue.shift();
    }
}
// Session Manager
export class SessionManager {
    static sessions = new Map();
    static currentSession = null;
    static async initialize(config) {
        // Try to resume existing session
        const existingId = await this.loadLastSessionId();
        if (existingId) {
            const existing = this.sessions.get(existingId);
            if (existing) {
                this.currentSession = existing;
                return existing;
            }
        }
        // Create new session
        const session = new Session(config);
        this.sessions.set(session.id, session);
        this.currentSession = session;
        await this.saveLastSessionId(session.id);
        return session;
    }
    static getCurrentSession() {
        return this.currentSession;
    }
    static getSession(id) {
        return this.sessions.get(id);
    }
    static listSessions() {
        return Array.from(this.sessions.values());
    }
    static async loadLastSessionId() {
        // Load from persistence
        return null;
    }
    static async saveLastSessionId(id) {
        // Save to persistence
    }
}
