/**
 * Knowledge Graph - Visualize connections between files, concepts
 * Graph database of code relationships and semantic connections
 */
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
export declare class KnowledgeGraph {
    private db;
    constructor(dbPath?: string);
    private initializeSchema;
    addNode(node: Node): void;
    addEdge(edge: Edge): void;
    getNode(id: string): Node | null;
    searchNodes(query: string, type?: string): Node[];
    getNeighbors(nodeId: string, edgeType?: string): Array<{
        node: Node;
        edge: Edge;
    }>;
    traverse(startNodeId: string, options?: {
        maxDepth?: number;
        edgeType?: string;
        minWeight?: number;
    }): Array<{
        node: Node;
        depth: number;
        path: string[];
    }>;
    findPath(startId: string, endId: string, edgeType?: string): string[] | null;
    findClusters(): string[][];
    getStats(): {
        nodeCount: number;
        edgeCount: number;
        typeDistribution: Record<string, number>;
        avgConnections: number;
    };
    toDOT(): string;
    clear(): void;
    close(): void;
}
export default KnowledgeGraph;
