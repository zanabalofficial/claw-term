/**
 * Enhanced Memory System - Multi-layer memory architecture
 * Short-term, working, episodic, semantic, and procedural memory
 */
export interface MemoryEntry {
    id: string;
    type: 'short_term' | 'working' | 'episodic' | 'semantic' | 'procedural';
    content: string;
    metadata: {
        timestamp: number;
        importance: number;
        recency: number;
        accessCount: number;
        lastAccessed: number;
        tags: string[];
        source?: string;
        sessionId?: string;
    };
    embeddings?: number[];
}
export interface MemoryQuery {
    type?: MemoryEntry['type'];
    query?: string;
    tags?: string[];
    sessionId?: string;
    timeRange?: {
        start: number;
        end: number;
    };
    minImportance?: number;
    limit?: number;
}
export declare class EnhancedMemorySystem {
    private db;
    private embeddings;
    constructor(dbPath?: string);
    private initializeSchema;
    store(entry: Omit<MemoryEntry, 'id' | 'metadata'> & {
        metadata?: Partial<MemoryEntry['metadata']>;
    }): MemoryEntry;
    storeShortTerm(content: string, sessionId: string, importance?: number): MemoryEntry;
    storeWorking(content: string, tags: string[], importance?: number): MemoryEntry;
    storeEpisodic(content: string, sessionId: string, outcome: string, importance?: number): MemoryEntry;
    storeSemantic(content: string, tags: string[], source?: string): MemoryEntry;
    storeProcedural(content: string, name: string, tags: string[]): MemoryEntry;
    retrieve(query: MemoryQuery): Array<MemoryEntry & {
        score: number;
    }>;
    private calculateScore;
    private updateAccessStats;
    getWorkingMemory(): MemoryEntry[];
    getRecentEpisodes(sessionId?: string, limit?: number): MemoryEntry[];
    getSemanticFacts(tags: string[]): MemoryEntry[];
    getProcedures(namePattern?: string): MemoryEntry[];
    consolidateToEpisodic(sessionId: string, summary: string, outcome: string): MemoryEntry;
    prune(options?: {
        olderThan?: number;
        minImportance?: number;
        types?: MemoryEntry['type'][];
    }): number;
    getStats(): Record<MemoryEntry['type'], number>;
    close(): void;
}
export default EnhancedMemorySystem;
