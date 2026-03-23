// @ts-nocheck
/**
 * Vector Database Tools - Semantic search and embeddings
 * Support for multiple vector DB backends
 */

import { spawn } from 'child_process';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

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

export class VectorDatabaseTools {
  private configs: Map<string, VectorDBConfig> = new Map();
  private embeddingCache: Map<string, number[]> = new Map();

  register(name: string, config: VectorDBConfig): void {
    this.configs.set(name, config);
  }

  // Generate embeddings
  async embed(text: string, model: EmbeddingModel): Promise<number[]> {
    const cacheKey = `${model.name}:${text}`;
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey)!;
    }

    let embedding: number[];

    if (model.provider === 'openai') {
      embedding = await this.embedOpenAI(text, model);
    } else if (model.provider === 'local') {
      embedding = await this.embedLocal(text, model);
    } else {
      throw new Error(`Provider ${model.provider} not implemented`);
    }

    this.embeddingCache.set(cacheKey, embedding);
    return embedding;
  }

  private async embedOpenAI(text: string, model: EmbeddingModel): Promise<number[]> {
    // Use OpenAI API
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: model.name,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  private async embedLocal(text: string, model: EmbeddingModel): Promise<number[]> {
    // Use sentence-transformers or similar local model
    const script = `
from sentence_transformers import SentenceTransformer
import json

model = SentenceTransformer('${model.name}')
embedding = model.encode("${text.replace(/"/g, '\\"')}")
print(json.dumps(embedding.tolist()))
`;

    return new Promise((resolve, reject) => {
      const proc = spawn('python3', ['-c', script]);
      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => { stdout += data; });
      proc.stderr?.on('data', (data) => { stderr += data; });

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(stderr || 'Embedding failed'));
        } else {
          resolve(JSON.parse(stdout.trim()));
        }
      });
    });
  }

  // Add documents to vector store
  async addDocuments(
    dbName: string,
    documents: Array<{ id: string; content: string; metadata?: Record<string, any> }>,
    model: EmbeddingModel
  ): Promise<void> {
    const config = this.configs.get(dbName);
    if (!config) throw new Error(`Vector DB ${dbName} not found`);

    // Generate embeddings for all documents
    const embeddings = await Promise.all(
      documents.map(doc => this.embed(doc.content, model))
    );

    switch (config.type) {
      case 'chromadb':
        await this.addToChroma(config, documents, embeddings);
        break;
      case 'pgvector':
        await this.addToPGVector(config, documents, embeddings);
        break;
      default:
        throw new Error(`Vector DB type ${config.type} not implemented`);
    }
  }

  private async addToChroma(
    config: VectorDBConfig,
    documents: Array<{ id: string; content: string; metadata?: Record<string, any> }>,
    embeddings: number[][]
  ): Promise<void> {
    const script = `
import chromadb
import json

client = chromadb.HttpClient(host='${config.url?.replace('http://', '').split(':')[0] || 'localhost'}', 
                              port=${config.url?.split(':')[1] || '8000'})
collection = client.get_or_create_collection('${config.collection}')

documents = ${JSON.stringify(documents.map(d => d.content))}
ids = ${JSON.stringify(documents.map(d => d.id))}
embeddings = ${JSON.stringify(embeddings)}
metadatas = ${JSON.stringify(documents.map(d => d.metadata || {}))}

collection.add(documents=documents, ids=ids, embeddings=embeddings, metadatas=metadatas)
print('Added successfully')
`;

    return new Promise((resolve, reject) => {
      const proc = spawn('python3', ['-c', script]);
      let stderr = '';

      proc.stderr?.on('data', (data) => { stderr += data; });
      proc.on('close', (code) => {
        if (code !== 0) reject(new Error(stderr));
        else resolve();
      });
    });
  }

  private async addToPGVector(
    config: VectorDBConfig,
    documents: Array<{ id: string; content: string; metadata?: Record<string, any> }>,
    embeddings: number[][]
  ): Promise<void> {
    // Implementation would use pgvector extension
    // For now, placeholder
    throw new Error('PGVector implementation pending');
  }

  // Search similar documents
  async search(
    dbName: string,
    query: string,
    model: EmbeddingModel,
    options: {
      limit?: number;
      threshold?: number;
      filter?: Record<string, any>;
    } = {}
  ): Promise<VectorSearchResult[]> {
    const config = this.configs.get(dbName);
    if (!config) throw new Error(`Vector DB ${dbName} not found`);

    const queryEmbedding = await this.embed(query, model);

    switch (config.type) {
      case 'chromadb':
        return this.searchChroma(config, queryEmbedding, options);
      default:
        throw new Error(`Search not implemented for ${config.type}`);
    }
  }

  private async searchChroma(
    config: VectorDBConfig,
    queryEmbedding: number[],
    options: {
      limit?: number;
      threshold?: number;
      filter?: Record<string, any>;
    }
  ): Promise<VectorSearchResult[]> {
    const script = `
import chromadb
import json

client = chromadb.HttpClient(host='${config.url?.replace('http://', '').split(':')[0] || 'localhost'}', 
                              port=${config.url?.split(':')[1] || '8000'})
collection = client.get_collection('${config.collection}')

results = collection.query(
    query_embeddings=[${JSON.stringify(queryEmbedding)}],
    n_results=${options.limit || 5},
    ${options.filter ? `where=${JSON.stringify(options.filter)},` : ''}
)

print(json.dumps(results))
`;

    return new Promise((resolve, reject) => {
      const proc = spawn('python3', ['-c', script]);
      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => { stdout += data; });
      proc.stderr?.on('data', (data) => { stderr += data; });

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(stderr));
        } else {
          const results = JSON.parse(stdout.trim());
          const formatted: VectorSearchResult[] = [];
          
          for (let i = 0; i < results.ids[0].length; i++) {
            formatted.push({
              id: results.ids[0][i],
              score: 1 - (results.distances?.[0]?.[i] || 0), // Convert distance to similarity
              content: results.documents?.[0]?.[i],
              metadata: results.metadatas?.[0]?.[i],
            });
          }
          
          resolve(formatted.filter(r => !options.threshold || r.score >= options.threshold));
        }
      });
    });
  }

  // Hybrid search (BM25 + Vector)
  async hybridSearch(
    dbName: string,
    query: string,
    model: EmbeddingModel,
    options: {
      limit?: number;
      vectorWeight?: number; // 0-1, higher = more weight to semantic
    } = {}
  ): Promise<VectorSearchResult[]> {
    // Get keyword matches (BM25)
    const keywordResults = await this.keywordSearch(dbName, query, options);
    
    // Get vector matches
    const vectorResults = await this.search(dbName, query, model, options);
    
    // Combine scores
    const combined = new Map<string, VectorSearchResult>();
    const vectorWeight = options.vectorWeight || 0.7;
    const keywordWeight = 1 - vectorWeight;
    
    // Normalize scores
    const maxKeywordScore = Math.max(...keywordResults.map(r => r.score), 1);
    const maxVectorScore = Math.max(...vectorResults.map(r => r.score), 1);
    
    for (const r of keywordResults) {
      combined.set(r.id, {
        ...r,
        score: (r.score / maxKeywordScore) * keywordWeight,
      });
    }
    
    for (const r of vectorResults) {
      const existing = combined.get(r.id);
      if (existing) {
        existing.score += (r.score / maxVectorScore) * vectorWeight;
      } else {
        combined.set(r.id, {
          ...r,
          score: (r.score / maxVectorScore) * vectorWeight,
        });
      }
    }
    
    return Array.from(combined.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, options.limit || 5);
  }

  // Simple keyword search (BM25 approximation)
  private async keywordSearch(
    dbName: string,
    query: string,
    options: { limit?: number }
  ): Promise<VectorSearchResult[]> {
    // This would typically use Elasticsearch or similar
    // Placeholder implementation
    return [];
  }
}

export default VectorDatabaseTools;
