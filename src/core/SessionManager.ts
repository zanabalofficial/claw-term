// @ts-nocheck
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool-call' | 'tool-result' | 'error';
  content: string;
  timestamp: Date;
  toolName?: string;
  toolInput?: any;
}

export interface SessionConfig {
  id?: string;
  workspace: string;
  provider: string;
  model: string;
  toolsEnabled: boolean;
}

export class Session extends EventEmitter {
  public readonly id: string;
  public readonly createdAt: Date;
  private messages: Message[] = [];
  private config: SessionConfig;
  private messageListeners: Set<(messages: Message[]) => void> = new Set();

  constructor(config: SessionConfig) {
    super();
    this.id = config.id || uuidv4();
    this.createdAt = new Date();
    this.config = config;
  }

  // Message management
  addMessage(message: Omit<Message, 'id' | 'timestamp'> & Partial<Pick<Message, 'id' | 'timestamp'>>): void {
    const fullMessage: Message = {
      id: message.id || uuidv4(),
      timestamp: message.timestamp || new Date(),
      ...message as Message
    };
    
    this.messages.push(fullMessage);
    this.emit('message', fullMessage);
    this.notifyListeners();
    this.persist();
  }

  appendToLastMessage(content: string): void {
    if (this.messages.length === 0) return;
    
    const lastMessage = this.messages[this.messages.length - 1];
    if (lastMessage.role === 'assistant') {
      lastMessage.content += content;
      this.notifyListeners();
    } else {
      // Create new assistant message
      this.addMessage({
        role: 'assistant',
        content,
      });
    }
  }

  getMessages(): Message[] {
    return [...this.messages];
  }

  getLastMessage(): Message | undefined {
    return this.messages[this.messages.length - 1];
  }

  clear(): void {
    this.messages = [];
    this.notifyListeners();
    this.persist();
  }

  // Listeners
  onMessagesChange(listener: (messages: Message[]) => void): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  private notifyListeners(): void {
    this.messageListeners.forEach(listener => listener(this.messages));
  }

  // Persistence
  private persist(): void {
    // In a real implementation, save to SQLite or file
    // For now, keep in memory
  }

  // Queue for initial message
  private queuedMessage: string | null = null;

  queueMessage(content: string): void {
    this.queuedMessage = content;
  }

  getQueuedMessage(): string | null {
    const msg = this.queuedMessage;
    this.queuedMessage = null;
    return msg;
  }

  // Session info
  getDuration(): number {
    return Date.now() - this.createdAt.getTime();
  }

  getConfig(): SessionConfig {
    return { ...this.config };
  }

  // Tool execution queue
  private toolQueue: Array<{ name: string; arguments: any }> = [];

  queueTool(name: string, arguments_: any): void {
    this.toolQueue.push({ name, arguments: arguments_ });
  }

  getNextTool(): { name: string; arguments: any } | undefined {
    return this.toolQueue.shift();
  }
}

// Session Manager
export class SessionManager {
  private static sessions: Map<string, Session> = new Map();
  private static currentSession: Session | null = null;

  static async initialize(config: SessionConfig): Promise<Session> {
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

  static getCurrentSession(): Session | null {
    return this.currentSession;
  }

  static getSession(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  static listSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  private static async loadLastSessionId(): Promise<string | null> {
    // Load from persistence
    return null;
  }

  private static async saveLastSessionId(id: string): Promise<void> {
    // Save to persistence
  }
}
