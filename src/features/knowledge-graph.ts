/**
 * Knowledge Graph - Visualize connections between files, concepts
 * Graph database of code relationships and semantic connections
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { homedir } from 'os';

export interface Node {
  id: string;
  type: 'file' | 'function' | 'class' | 'variable' | 'concept' | 'external';
  name: string;
  path?: string;
  line?: number;
  metadata?: Record<string, any>;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  type: 'imports' | 'calls' | 'contains' | 'references' | 'depends_on' | 'similar_to';
  weight: number;
  metadata?: Record<string, any>;
}

export interface GraphQuery {
  startNode?: string;
  nodeType?: string;
  edgeType?: string;
  maxDepth?: number;
  limit?: number;
}

export class KnowledgeGraph {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const path = dbPath || join(homedir(), '.claw', 'knowledge_graph.db');
    this.db = new Database(path);
    this.initializeSchema();
  }

  private initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS nodes (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        path TEXT,
        line INTEGER,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS edges (
        id TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        target TEXT NOT NULL,
        type TEXT NOT NULL,
        weight REAL DEFAULT 1.0,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (source) REFERENCES nodes(id),
        FOREIGN KEY (target) REFERENCES nodes(id)
      );

      CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(type);
      CREATE INDEX IF NOT EXISTS idx_nodes_path ON nodes(path);
      CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source);
      CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target);
      CREATE INDEX IF NOT EXISTS idx_edges_type ON edges(type);

      -- Full-text search
      CREATE VIRTUAL TABLE IF NOT EXISTS nodes_fts USING fts5(
        name, content='nodes', content_rowid='rowid'
      );
    `);
  }

  // Add or update node
  addNode(node: Node): void {
    const stmt = this.db.prepare(`
      INSERT INTO nodes (id, type, name, path, line, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        type = excluded.type,
        name = excluded.name,
        path = excluded.path,
        line = excluded.line,
        metadata = excluded.metadata
    `);

    stmt.run(
      node.id,
      node.type,
      node.name,
      node.path || null,
      node.line || null,
      JSON.stringify(node.metadata || {})
    );

    // Update FTS
    this.db.prepare(`
      INSERT INTO nodes_fts(rowid, name)
      VALUES ((SELECT rowid FROM nodes WHERE id = ?), ?)
      ON CONFLICT(rowid) DO UPDATE SET name = excluded.name
    `).run(node.id, node.name);
  }

  // Add edge
  addEdge(edge: Edge): void {
    const stmt = this.db.prepare(`
      INSERT INTO edges (id, source, target, type, weight, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        type = excluded.type,
        weight = excluded.weight,
        metadata = excluded.metadata
    `);

    stmt.run(
      edge.id,
      edge.source,
      edge.target,
      edge.type,
      edge.weight,
      JSON.stringify(edge.metadata || {})
    );
  }

  // Get node by ID
  getNode(id: string): Node | null {
    const row = this.db.prepare('SELECT * FROM nodes WHERE id = ?').get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      type: row.type,
      name: row.name,
      path: row.path,
      line: row.line,
      metadata: JSON.parse(row.metadata || '{}'),
    };
  }

  // Search nodes by name
  searchNodes(query: string, type?: string): Node[] {
    let sql = 'SELECT n.* FROM nodes n JOIN nodes_fts fts ON n.rowid = fts.rowid WHERE nodes_fts MATCH ?';
    const params: any[] = [query];

    if (type) {
      sql += ' AND n.type = ?';
      params.push(type);
    }

    sql += ' ORDER BY rank LIMIT 20';

    const rows = this.db.prepare(sql).all(...params) as any[];

    return rows.map(row => ({
      id: row.id,
      type: row.type,
      name: row.name,
      path: row.path,
      line: row.line,
      metadata: JSON.parse(row.metadata || '{}'),
    }));
  }

  // Get neighbors
  getNeighbors(nodeId: string, edgeType?: string): Array<{ node: Node; edge: Edge }> {
    let sql = `
      SELECT n.*, e.id as edge_id, e.type as edge_type, e.weight, e.metadata as edge_metadata
      FROM nodes n
      JOIN edges e ON (e.source = ? AND e.target = n.id) OR (e.target = ? AND e.source = n.id)
      WHERE 1=1
    `;
    const params: any[] = [nodeId, nodeId];

    if (edgeType) {
      sql += ' AND e.type = ?';
      params.push(edgeType);
    }

    const rows = this.db.prepare(sql).all(...params) as any[];

    return rows.map(row => ({
      node: {
        id: row.id,
        type: row.type,
        name: row.name,
        path: row.path,
        line: row.line,
        metadata: JSON.parse(row.metadata || '{}'),
      },
      edge: {
        id: row.edge_id,
        source: row.source || nodeId,
        target: row.target || nodeId,
        type: row.edge_type,
        weight: row.weight,
        metadata: JSON.parse(row.edge_metadata || '{}'),
      },
    }));
  }

  // Traverse graph (BFS)
  traverse(startNodeId: string, options: {
    maxDepth?: number;
    edgeType?: string;
    minWeight?: number;
  } = {}): Array<{ node: Node; depth: number; path: string[] }> {
    const visited = new Set<string>();
    const results: Array<{ node: Node; depth: number; path: string[] }> = [];
    const queue: Array<{ id: string; depth: number; path: string[] }> = [
      { id: startNodeId, depth: 0, path: [startNodeId] },
    ];

    while (queue.length > 0) {
      const { id, depth, path } = queue.shift()!;

      if (visited.has(id)) continue;
      visited.add(id);

      const node = this.getNode(id);
      if (node) {
        results.push({ node, depth, path });
      }

      if (options.maxDepth && depth >= options.maxDepth) continue;

      // Get neighbors
      let sql = 'SELECT * FROM edges WHERE source = ? OR target = ?';
      const params: any[] = [id, id];

      if (options.edgeType) {
        sql += ' AND type = ?';
        params.push(options.edgeType);
      }
      if (options.minWeight) {
        sql += ' AND weight >= ?';
        params.push(options.minWeight);
      }

      const edges = this.db.prepare(sql).all(...params) as any[];

      for (const edge of edges) {
        const nextId = edge.source === id ? edge.target : edge.source;
        if (!visited.has(nextId)) {
          queue.push({
            id: nextId,
            depth: depth + 1,
            path: [...path, nextId],
          });
        }
      }
    }

    return results;
  }

  // Find shortest path
  findPath(startId: string, endId: string, edgeType?: string): string[] | null {
    // BFS for shortest path
    const queue: Array<{ id: string; path: string[] }> = [
      { id: startId, path: [startId] },
    ];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { id, path } = queue.shift()!;

      if (id === endId) {
        return path;
      }

      if (visited.has(id)) continue;
      visited.add(id);

      let sql = 'SELECT * FROM edges WHERE source = ? OR target = ?';
      const params: any[] = [id, id];

      if (edgeType) {
        sql += ' AND type = ?';
        params.push(edgeType);
      }

      const edges = this.db.prepare(sql).all(...params) as any[];

      for (const edge of edges) {
        const nextId = edge.source === id ? edge.target : edge.source;
        if (!visited.has(nextId)) {
          queue.push({ id: nextId, path: [...path, nextId] });
        }
      }
    }

    return null;
  }

  // Find clusters (connected components)
  findClusters(): string[][] {
    const allNodes = this.db.prepare('SELECT id FROM nodes').all() as Array<{ id: string }>;
    const visited = new Set<string>();
    const clusters: string[][] = [];

    for (const { id } of allNodes) {
      if (visited.has(id)) continue;

      const cluster: string[] = [];
      const queue = [id];

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);
        cluster.push(current);

        const neighbors = this.db.prepare(
          'SELECT source, target FROM edges WHERE source = ? OR target = ?'
        ).all(current, current) as Array<{ source: string; target: string }>;

        for (const edge of neighbors) {
          const neighbor = edge.source === current ? edge.target : edge.source;
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      }

      clusters.push(cluster);
    }

    return clusters;
  }

  // Get graph statistics
  getStats(): {
    nodeCount: number;
    edgeCount: number;
    typeDistribution: Record<string, number>;
    avgConnections: number;
  } {
    const nodeCount = (this.db.prepare('SELECT COUNT(*) as count FROM nodes').get() as any).count;
    const edgeCount = (this.db.prepare('SELECT COUNT(*) as count FROM edges').get() as any).count;

    const typeDist = this.db.prepare(
      'SELECT type, COUNT(*) as count FROM nodes GROUP BY type'
    ).all() as Array<{ type: string; count: number }>;

    return {
      nodeCount,
      edgeCount,
      typeDistribution: typeDist.reduce((acc, { type, count }) => {
        acc[type] = count;
        return acc;
      }, {} as Record<string, number>),
      avgConnections: nodeCount > 0 ? (edgeCount * 2) / nodeCount : 0,
    };
  }

  // Visualize as DOT format for Graphviz
  toDOT(): string {
    const nodes = this.db.prepare('SELECT * FROM nodes').all() as any[];
    const edges = this.db.prepare('SELECT * FROM edges').all() as any[];

    let dot = 'digraph KnowledgeGraph {\n';
    dot += '  rankdir=TB;\n';
    dot += '  node [shape=box, style=rounded];\n\n';

    // Nodes
    for (const node of nodes) {
      const color = {
        file: 'lightblue',
        function: 'lightgreen',
        class: 'orange',
        variable: 'pink',
        concept: 'yellow',
        external: 'gray',
      }[node.type] || 'white';

      dot += `  "${node.id}" [label="${node.name}", fillcolor=${color}, style=filled];\n`;
    }

    dot += '\n';

    // Edges
    for (const edge of edges) {
      const style = edge.type === 'depends_on' ? 'dashed' : 'solid';
      dot += `  "${edge.source}" -> "${edge.target}" [label="${edge.type}", style=${style}];\n`;
    }

    dot += '}';
    return dot;
  }

  // Clear graph
  clear(): void {
    this.db.exec('DELETE FROM edges');
    this.db.exec('DELETE FROM nodes');
    this.db.exec('DELETE FROM nodes_fts');
  }

  // Close connection
  close(): void {
    this.db.close();
  }
}

export default KnowledgeGraph;
