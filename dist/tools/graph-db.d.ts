/**
 * Graph Database Tools - Neo4j, Neptune, etc.
 * Graph traversal and Cypher queries
 */
export interface GraphDBConfig {
    type: 'neo4j' | 'neptune' | 'arangodb' | 'dgraph';
    url: string;
    username?: string;
    password?: string;
    database?: string;
}
export interface GraphNode {
    id: string;
    labels: string[];
    properties: Record<string, any>;
}
export interface GraphEdge {
    id: string;
    type: string;
    from: string;
    to: string;
    properties: Record<string, any>;
}
export interface GraphPath {
    nodes: GraphNode[];
    edges: GraphEdge[];
    length: number;
}
export declare class GraphDatabaseTools {
    private configs;
    register(name: string, config: GraphDBConfig): void;
    queryCypher(dbName: string, cypher: string, parameters?: Record<string, any>): Promise<any>;
    shortestPath(dbName: string, fromNode: {
        label: string;
        property: string;
        value: any;
    }, toNode: {
        label: string;
        property: string;
        value: any;
    }, options?: {
        relationshipTypes?: string[];
        maxDepth?: number;
    }): Promise<GraphPath | null>;
    getNeighbors(dbName: string, nodeId: string, options?: {
        relationshipTypes?: string[];
        direction?: 'out' | 'in' | 'both';
    }): Promise<{
        node: GraphNode;
        edge: GraphEdge;
    }[]>;
    pageRank(dbName: string, options?: {
        iterations?: number;
        damping?: number;
    }): Promise<Array<{
        node: GraphNode;
        score: number;
    }>>;
    communityDetection(dbName: string, algorithm?: 'louvain' | 'label_propagation'): Promise<Array<{
        node: GraphNode;
        community: number;
    }>>;
    createNode(dbName: string, label: string, properties: Record<string, any>): Promise<GraphNode>;
    createEdge(dbName: string, fromId: string, toId: string, type: string, properties?: Record<string, any>): Promise<GraphEdge>;
    private parseNode;
    private parseEdge;
    private parsePath;
}
export default GraphDatabaseTools;
