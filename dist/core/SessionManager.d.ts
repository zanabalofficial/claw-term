import { EventEmitter } from 'events';
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
export declare class Session extends EventEmitter {
    readonly id: string;
    readonly createdAt: Date;
    private messages;
    private config;
    private messageListeners;
    constructor(config: SessionConfig);
    addMessage(message: Omit<Message, 'id' | 'timestamp'> & Partial<Pick<Message, 'id' | 'timestamp'>>): void;
    appendToLastMessage(content: string): void;
    getMessages(): Message[];
    getLastMessage(): Message | undefined;
    clear(): void;
    onMessagesChange(listener: (messages: Message[]) => void): () => void;
    private notifyListeners;
    private persist;
    private queuedMessage;
    queueMessage(content: string): void;
    getQueuedMessage(): string | null;
    getDuration(): number;
    getConfig(): SessionConfig;
    private toolQueue;
    queueTool(name: string, arguments_: any): void;
    getNextTool(): {
        name: string;
        arguments: any;
    } | undefined;
}
export declare class SessionManager {
    private static sessions;
    private static currentSession;
    static initialize(config: SessionConfig): Promise<Session>;
    static getCurrentSession(): Session | null;
    static getSession(id: string): Session | undefined;
    static listSessions(): Session[];
    private static loadLastSessionId;
    private static saveLastSessionId;
}
