// @ts-nocheck
/**
 * Database Tools - SQL, Vector DB, Graph DB connectors
 * Multi-database query interface
 */

import { spawn } from 'child_process';
import { EventEmitter } from 'events';

export interface DBConnection {
  type: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'redis' | 'elasticsearch';
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  url?: string;
  ssl?: boolean;
}

export interface QueryResult {
  rows: any[];
  rowCount: number;
  fields?: string[];
  duration: number;
}

export class DatabaseTools extends EventEmitter {
  private connections: Map<string, DBConnection> = new Map();

  // Register connection
  registerConnection(name: string, config: DBConnection): void {
    this.connections.set(name, config);
  }

  // Execute SQL query
  async query(connectionName: string, sql: string): Promise<QueryResult> {
    const conn = this.connections.get(connectionName);
    if (!conn) throw new Error(`Connection ${connectionName} not found`);

    const startTime = Date.now();

    switch (conn.type) {
      case 'postgresql':
        return this.queryPostgres(conn, sql, startTime);
      case 'mysql':
        return this.queryMySQL(conn, sql, startTime);
      case 'sqlite':
        return this.querySQLite(conn, sql, startTime);
      case 'mongodb':
        throw new Error('MongoDB uses different query syntax');
      default:
        throw new Error(`Unsupported database type: ${conn.type}`);
    }
  }

  private async queryPostgres(
    conn: DBConnection,
    sql: string,
    startTime: number
  ): Promise<QueryResult> {
    const env = {
      PGPASSWORD: conn.password || '',
      ...process.env,
    };

    const args = [
      '-h', conn.host || 'localhost',
      '-p', String(conn.port || 5432),
      '-U', conn.username || 'postgres',
      '-d', conn.database || 'postgres',
      '-t', // Tuples only
      '-A', // Unaligned
      '-F', '|', // Field separator
      '-c', sql,
    ];

    return new Promise((resolve, reject) => {
      const proc = spawn('psql', args, { env });
      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => { stdout += data; });
      proc.stderr?.on('data', (data) => { stderr += data; });

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(stderr || `Exit code: ${code}`));
          return;
        }

        const lines = stdout.trim().split('\n').filter(Boolean);
        const fields = lines[0]?.split('|') || [];
        const rows = lines.slice(1).map(line => {
          const values = line.split('|');
          const row: Record<string, any> = {};
          fields.forEach((f, i) => {
            row[f] = values[i];
          });
          return row;
        });

        resolve({
          rows,
          rowCount: rows.length,
          fields,
          duration: Date.now() - startTime,
        });
      });
    });
  }

  private async queryMySQL(
    conn: DBConnection,
    sql: string,
    startTime: number
  ): Promise<QueryResult> {
    const args = [
      '-h', conn.host || 'localhost',
      '-P', String(conn.port || 3306),
      '-u', conn.username || 'root',
      `-p${conn.password || ''}`,
      '-D', conn.database || '',
      '-B', // Batch mode
      '-e', sql,
    ];

    return new Promise((resolve, reject) => {
      const proc = spawn('mysql', args);
      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => { stdout += data; });
      proc.stderr?.on('data', (data) => { stderr += data; });

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(stderr || `Exit code: ${code}`));
          return;
        }

        const lines = stdout.trim().split('\n').filter(Boolean);
        const fields = lines[0]?.split('\t') || [];
        const rows = lines.slice(1).map(line => {
          const values = line.split('\t');
          const row: Record<string, any> = {};
          fields.forEach((f, i) => {
            row[f] = values[i];
          });
          return row;
        });

        resolve({
          rows,
          rowCount: rows.length,
          fields,
          duration: Date.now() - startTime,
        });
      });
    });
  }

  private async querySQLite(
    conn: DBConnection,
    sql: string,
    startTime: number
  ): Promise<QueryResult> {
    const args = [conn.database || ':memory:'];

    return new Promise((resolve, reject) => {
      const proc = spawn('sqlite3', [...args, sql]);
      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => { stdout += data; });
      proc.stderr?.on('data', (data) => { stderr += data; });

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(stderr || `Exit code: ${code}`));
          return;
        }

        // Parse pipe-delimited output
        const lines = stdout.trim().split('\n').filter(Boolean);
        const rows = lines.map(line => {
          const values = line.split('|');
          return { values };
        });

        resolve({
          rows,
          rowCount: rows.length,
          duration: Date.now() - startTime,
        });
      });
    });
  }

  // Execute MongoDB query
  async queryMongo(connectionName: string, collection: string, operation: string, args: any): Promise<QueryResult> {
    const conn = this.connections.get(connectionName);
    if (!conn) throw new Error(`Connection ${connectionName} not found`);
    if (conn.type !== 'mongodb') throw new Error('Not a MongoDB connection');

    const startTime = Date.now();

    const script = `
const { MongoClient } = require('mongodb');

async function run() {
  const client = new MongoClient('${conn.url || `mongodb://${conn.username}:${conn.password}@${conn.host}:${conn.port}/${conn.database}`}');
  await client.connect();
  const db = client.db('${conn.database}');
  const collection = db.collection('${collection}');
  
  const result = await collection.${operation}(${JSON.stringify(args)});
  console.log(JSON.stringify(result, null, 2));
  
  await client.close();
}

run().catch(console.error);
`;

    return new Promise((resolve, reject) => {
      const proc = spawn('node', ['-e', script]);
      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => { stdout += data; });
      proc.stderr?.on('data', (data) => { stderr += data; });

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(stderr));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          resolve({
            rows: Array.isArray(result) ? result : [result],
            rowCount: Array.isArray(result) ? result.length : 1,
            duration: Date.now() - startTime,
          });
        } catch {
          resolve({
            rows: [{ output: stdout }],
            rowCount: 1,
            duration: Date.now() - startTime,
          });
        }
      });
    });
  }

  // Redis operations
  async redisCommand(connectionName: string, command: string, ...args: any[]): Promise<any> {
    const conn = this.connections.get(connectionName);
    if (!conn) throw new Error(`Connection ${connectionName} not found`);
    if (conn.type !== 'redis') throw new Error('Not a Redis connection');

    const redisCli = [
      '-h', conn.host || 'localhost',
      '-p', String(conn.port || 6379),
    ];

    if (conn.password) {
      redisCli.push('-a', conn.password);
    }

    redisCli.push(command, ...args.map(String));

    return new Promise((resolve, reject) => {
      const proc = spawn('redis-cli', redisCli);
      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => { stdout += data; });
      proc.stderr?.on('data', (data) => { stderr += data; });

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(stderr || `Exit code: ${code}`));
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }

  // List tables/collections
  async listTables(connectionName: string): Promise<string[]> {
    const conn = this.connections.get(connectionName);
    if (!conn) throw new Error(`Connection ${connectionName} not found`);

    switch (conn.type) {
      case 'postgresql':
        const pgResult = await this.query(connectionName, 
          "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
        );
        return pgResult.rows.map(r => r.table_name);
      
      case 'mysql':
        const mysqlResult = await this.query(connectionName, 'SHOW TABLES');
        return mysqlResult.rows.map(r => Object.values(r)[0] as string);
      
      case 'sqlite':
        const sqliteResult = await this.query(connectionName, 
          "SELECT name FROM sqlite_master WHERE type = 'table'"
        );
        return sqliteResult.rows.map(r => r.name);
      
      default:
        throw new Error(`listTables not supported for ${conn.type}`);
    }
  }

  // Get table schema
  async getSchema(connectionName: string, table: string): Promise<any[]> {
    const conn = this.connections.get(connectionName);
    if (!conn) throw new Error(`Connection ${connectionName} not found`);

    let sql: string;
    
    switch (conn.type) {
      case 'postgresql':
        sql = `
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = '${table}'
        `;
        break;
      case 'mysql':
        sql = `DESCRIBE ${table}`;
        break;
      case 'sqlite':
        sql = `PRAGMA table_info(${table})`;
        break;
      default:
        throw new Error(`getSchema not supported for ${conn.type}`);
    }

    const result = await this.query(connectionName, sql);
    return result.rows;
  }

  // Test connection
  async testConnection(connectionName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const conn = this.connections.get(connectionName);
      if (!conn) throw new Error('Connection not found');

      switch (conn.type) {
        case 'postgresql':
        case 'mysql':
        case 'sqlite':
          await this.query(connectionName, 'SELECT 1');
          break;
        case 'redis':
          await this.redisCommand(connectionName, 'PING');
          break;
        default:
          throw new Error(`Test not implemented for ${conn.type}`);
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export default DatabaseTools;
