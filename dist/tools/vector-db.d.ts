/**
 * Vector Database Tools - Semantic search and embeddings
 * Support for multiple vector DB backends
 */
export interface VectorDBConfig {
    type: 'chromadb' | 'pinecone' | 'weaviate' | 'qdrant' | 'milvus' | 'pgvector';
    url?: string;
    apiKey?: string;
    collection?: string;
    dimension?: number;
}
export interface EmbeddingModel {
    name: string;
    dimension: number;
    provider: 'openai' | 'local' | 'huggingface';
}
export interface VectorSearchResult {
    id: string;
    score: number;
    metadata?: Record<string, any>;
    content?: string;
}
export declare class VectorDatabaseTools {
    private configs;
    private embeddingCache;
    register(name: string, config: VectorDBConfig): void;
    embed(text: string, model: EmbeddingModel): Promise<number[]>;
    private embedOpenAI;
    private embedLocal;
    addDocuments(dbName: string, documents: Array<{
        id: string;
        content: string;
        metadata?: Record<string, any>;
    }>, model: EmbeddingModel): Promise<void>;
    private addToChroma;
    private addToPGVector;
    search(dbName: string, query: string, model: EmbeddingModel, options?: {
        limit?: number;
        threshold?: number;
        filter?: Record<string, any>;
    }): Promise<VectorSearchResult[]>;
    private searchChroma;
    hybridSearch(dbName: string, query: string, model: EmbeddingModel, options?: {
        limit?: number;
        vectorWeight?: number;
    }): Promise<VectorSearchResult[]>;
    private keywordSearch;
}
export default VectorDatabaseTools;
