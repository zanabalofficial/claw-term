/**
 * Enhanced Memory System - Multi-layer memory architecture
 * Short-term, working, episodic, semantic, and procedural memory
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { homedir } from 'os';

export interface MemoryEntry {
  id: string;
  type: 'short_term' | 'working' | 'episodic' | 'semantic' | 'procedural';
  content: string;
  metadata: {
    timestamp: number;
    importance: number; // 0-1
    recency: number; // 0-1
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
  timeRange?: { start: number; end: number };
  minImportance?: number;
  limit?: number;
}

export class EnhancedMemorySystem {
  private db: Database.Database;
  private embeddings: Map<string, number[]> = new Map();

  constructor(dbPath?: string) {
    const path = dbPath || join(homedir(), '.claw', 'enhanced_memory.db');
    this.db = new Database(path);
    this.initializeSchema();
  }

  private initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        importance REAL DEFAULT 0.5,
        recency REAL DEFAULT 1.0,
        access_count INTEGER DEFAULT 0,
        last_accessed INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT 0,
        tags TEXT,
        source TEXT,
        session_id TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
      CREATE INDEX IF NOT EXISTS idx_memories_session ON memories(session_id);
      CREATE INDEX IF NOT EXISTS idx_memories_created ON memories(created_at);
      
      CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
        content, content='memories', content_rowid='rowid'
      );
    `);
  }

  // Store memory with type
  store(entry: Omit<MemoryEntry, 'id' | 'metadata'> & { metadata?: Partial<MemoryEntry['metadata']> }): MemoryEntry {
    const id = `${entry.type}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const timestamp = Date.now();
    
    const fullEntry: MemoryEntry = {
      ...entry,
      id,
      metadata: {
        timestamp,
        importance: entry.metadata?.importance || 0.5,
        recency: 1.0,
        accessCount: 0,
        lastAccessed: timestamp,
        tags: entry.metadata?.tags || [],
        source: entry.metadata?.source,
        sessionId: entry.metadata?.sessionId,
      },
    };

    const stmt = this.db.prepare(`
      INSERT INTO memories (id, type, content, importance, recency, access_count, 
                           last_accessed, created_at, tags, source, session_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      fullEntry.type,
      fullEntry.content,
      fullEntry.metadata.importance,
      fullEntry.metadata.recency,
      fullEntry.metadata.accessCount,
      fullEntry.metadata.lastAccessed,
      fullEntry.metadata.timestamp,
      JSON.stringify(fullEntry.metadata.tags),
      fullEntry.metadata.source,
      fullEntry.metadata.sessionId
    );

    // Update FTS
    this.db.prepare(`
      INSERT INTO memories_fts(rowid, content)
      VALUES ((SELECT rowid FROM memories WHERE id = ?), ?)
    `).run(id, fullEntry.content);

    return fullEntry;
  }

  // Short-term: Recent conversation turns
  storeShortTerm(content: string, sessionId: string, importance?: number): MemoryEntry {
    return this.store({
      type: 'short_term',
      content,
      metadata: { sessionId, importance: importance || 0.3 },
    });
  }

  // Working memory: Scratch state, current plan, hypotheses
  storeWorking(content: string, tags: string[], importance?: number): MemoryEntry {
    return this.store({
      type: 'working',
      content,
      metadata: { tags, importance: importance || 0.7 },
    });
  }

  // Episodic: Past interactions, outcomes, failures
  storeEpisodic(content: string, sessionId: string, outcome: string, importance?: number): MemoryEntry {
    return this.store({
      type: 'episodic',
      content: `${content} [Outcome: ${outcome}]`,
      metadata: { sessionId, importance: importance || 0.6, tags: ['episode', outcome] },
    });
  }

  // Semantic: Facts, preferences, policies
  storeSemantic(content: string, tags: string[], source?: string): MemoryEntry {
    return this.store({
      type: 'semantic',
      content,
      metadata: { tags, source, importance: 0.8 },
    });
  }

  // Procedural: Reusable routines, playbooks
  storeProcedural(content: string, name: string, tags: string[]): MemoryEntry {
    return this.store({
      type: 'procedural',
      content,
      metadata: { tags: [...tags, 'procedure', name], importance: 0.9 },
    });
  }

  // Retrieve with scoring
  retrieve(query: MemoryQuery): Array<MemoryEntry & { score: number }> {
    let sql = 'SELECT * FROM memories WHERE 1=1';
    const params: any[] = [];

    if (query.type) {
      sql += ' AND type = ?';
      params.push(query.type);
    }

    if (query.sessionId) {
      sql += ' AND session_id = ?';
      params.push(query.sessionId);
    }

    if (query.minImportance) {
      sql += ' AND importance >= ?';
      params.push(query.minImportance);
    }

    if (query.timeRange) {
      sql += ' AND created_at BETWEEN ? AND ?';
      params.push(query.timeRange.start, query.timeRange.end);
    }

    // Full-text search if query provided
    if (query.query) {
      sql = `SELECT m.* FROM memories m 
             JOIN memories_fts fts ON m.rowid = fts.rowid 
             WHERE memories_fts MATCH ?`;
      params.unshift(query.query);
    }

    sql += ' ORDER BY created_at DESC';
    
    if (query.limit) {
      sql += ' LIMIT ?';
      params.push(query.limit);
    }

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];

    return rows.map(row => {
      const entry: MemoryEntry = {
        id: row.id,
        type: row.type,
        content: row.content,
        metadata: {
          timestamp: row.created_at,
          importance: row.importance,
          recency: row.recency,
          accessCount: row.access_count,
          lastAccessed: row.last_accessed,
          tags: JSON.parse(row.tags || '[]'),
          source: row.source,
          sessionId: row.session_id,
        },
      };

      // Calculate relevance score
      const score = this.calculateScore(entry, query);

      // Update access stats
      this.updateAccessStats(row.id);

      return { ...entry, score };
    }).sort((a, b) => b.score - a.score);
  }

  // Multi-factor scoring
  private calculateScore(entry: MemoryEntry, query: MemoryQuery): number {
    const now = Date.now();
    const age = now - entry.metadata.timestamp;
    const hoursSinceAccess = (now - entry.metadata.lastAccessed) / (1000 * 60 * 60);

    // Recency decay (exponential)
    const recencyScore = Math.exp(-age / (24 * 60 * 60 * 1000)); // Decay over days

    // Access frequency boost
    const frequencyScore = Math.log1p(entry.metadata.accessCount) / 5;

    // Importance weight
    const importanceScore = entry.metadata.importance;

    // Tag match bonus
    let tagScore = 0;
    if (query.tags) {
      const matchingTags = query.tags.filter(t => entry.metadata.tags.includes(t));
      tagScore = matchingTags.length / Math.max(query.tags.length, entry.metadata.tags.length || 1);
    }

    // Combined score (weighted)
    return (
      recencyScore * 0.3 +
      frequencyScore * 0.2 +
      importanceScore * 0.3 +
      tagScore * 0.2
    );
  }

  private updateAccessStats(id: string): void {
    this.db.prepare(`
      UPDATE memories 
      SET access_count = access_count + 1, 
          last_accessed = ?
      WHERE id = ?
    `).run(Date.now(), id);
  }

  // Get working memory (scratch state)
  getWorkingMemory(): MemoryEntry[] {
    return this.retrieve({ type: 'working', limit: 10 }).map(r => ({
      id: r.id,
      type: r.type,
      content: r.content,
      metadata: r.metadata,
    }));
  }

  // Get recent episodic memories
  getRecentEpisodes(sessionId?: string, limit: number = 5): MemoryEntry[] {
    return this.retrieve({ 
      type: 'episodic', 
      sessionId, 
      limit 
    }).map(r => ({
      id: r.id,
      type: r.type,
      content: r.content,
      metadata: r.metadata,
    }));
  }

  // Get semantic facts by tags
  getSemanticFacts(tags: string[]): MemoryEntry[] {
    return this.retrieve({ 
      type: 'semantic', 
      tags,
      limit: 20,
    }).map(r => ({
      id: r.id,
      type: r.type,
      content: r.content,
      metadata: r.metadata,
    }));
  }

  // Get procedures by name/pattern
  getProcedures(namePattern?: string): MemoryEntry[] {
    const results = this.retrieve({ type: 'procedural', limit: 50 });
    
    if (namePattern) {
      return results
        .filter(r => r.metadata.tags.some(t => t.includes(namePattern)))
        .map(r => ({
          id: r.id,
          type: r.type,
          content: r.content,
          metadata: r.metadata,
        }));
    }
    
    return results.map(r => ({
      id: r.id,
      type: r.type,
      content: r.content,
      metadata: r.metadata,
    }));
  }

  // Consolidate short-term to episodic
  consolidateToEpisodic(sessionId: string, summary: string, outcome: string): MemoryEntry {
    // Get short-term memories for session
    const shortTerm = this.retrieve({ type: 'short_term', sessionId });
    
    if (shortTerm.length === 0) return null as any;

    // Create episodic memory
    const episode = this.storeEpisodic(
      summary,
      sessionId,
      outcome,
      Math.max(...shortTerm.map(m => m.metadata.importance))
    );

    // Mark short-term as consolidated (lower importance)
    for (const mem of shortTerm) {
      this.db.prepare('UPDATE memories SET importance = 0.1 WHERE id = ?').run(mem.id);
    }

    return episode;
  }

  // Prune old memories
  prune(options: {
    olderThan?: number; // milliseconds
    minImportance?: number;
    types?: MemoryEntry['type'][];
  } = {}): number {
    let sql = 'DELETE FROM memories WHERE 1=1';
    const params: any[] = [];

    if (options.olderThan) {
      sql += ' AND created_at < ?';
      params.push(Date.now() - options.olderThan);
    }

    if (options.minImportance !== undefined) {
      sql += ' AND importance < ?';
      params.push(options.minImportance);
    }

    if (options.types?.length) {
      sql += ` AND type IN (${options.types.map(() => '?').join(',')})`;
      params.push(...options.types);
    }

    const result = this.db.prepare(sql).run(...params);
    return result.changes;
  }

  // Get memory statistics
  getStats(): Record<MemoryEntry['type'], number> {
    const stmt = this.db.prepare('SELECT type, COUNT(*) as count FROM memories GROUP BY type');
    const rows = stmt.all() as Array<{ type: string; count: number }>;
    
    return rows.reduce((acc, row) => {
      acc[row.type as MemoryEntry['type']] = row.count;
      return acc;
    }, {} as Record<MemoryEntry['type'], number>);
  }

  close(): void {
    this.db.close();
  }
}

export default EnhancedMemorySystem;
