// @ts-nocheck
/**
 * Remote Development - SSH and container management
 * Connect to remote servers, manage containers, deploy applications
 */
import { Client as SSHClient } from 'ssh2';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { readFileSync } from 'fs';
export class RemoteDevelopment extends EventEmitter {
    connections = new Map();
    // Connect via SSH
    async connect(id, config) {
        return new Promise((resolve, reject) => {
            const conn = new SSHClient();
            conn.on('ready', () => {
                this.connections.set(id, conn);
                this.emit('connected', id);
                resolve();
            });
            conn.on('error', (err) => {
                reject(err);
            });
            const connectConfig = {
                host: config.host,
                port: config.port || 22,
                username: config.username,
            };
            if (config.privateKey) {
                connectConfig.privateKey = readFileSync(config.privateKey);
            }
            else if (config.password) {
                connectConfig.password = config.password;
            }
            conn.connect(connectConfig);
        });
    }
    // Execute command on remote server
    async exec(connectionId, command) {
        const conn = this.connections.get(connectionId);
        if (!conn) {
            throw new Error(`Connection ${connectionId} not found`);
        }
        return new Promise((resolve, reject) => {
            conn.exec(command, (err, stream) => {
                if (err) {
                    reject(err);
                    return;
                }
                let stdout = '';
                let stderr = '';
                stream.on('close', (code) => {
                    resolve({ stdout, stderr, code });
                });
                stream.on('data', (data) => {
                    stdout += data.toString();
                });
                stream.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
            });
        });
    }
    // Get remote file
    async getFile(connectionId, remotePath, localPath) {
        const conn = this.connections.get(connectionId);
        if (!conn)
            throw new Error('Not connected');
        return new Promise((resolve, reject) => {
            conn.sftp((err, sftp) => {
                if (err) {
                    reject(err);
                    return;
                }
                sftp.fastGet(remotePath, localPath, (err) => {
                    if (err)
                        reject(err);
                    else
                        resolve();
                });
            });
        });
    }
    // Put remote file
    async putFile(connectionId, localPath, remotePath) {
        const conn = this.connections.get(connectionId);
        if (!conn)
            throw new Error('Not connected');
        return new Promise((resolve, reject) => {
            conn.sftp((err, sftp) => {
                if (err) {
                    reject(err);
                    return;
                }
                sftp.fastPut(localPath, remotePath, (err) => {
                    if (err)
                        reject(err);
                    else
                        resolve();
                });
            });
        });
    }
    // List Docker containers
    async listContainers(connectionId) {
        const result = await this.exec(connectionId, 'docker ps -a --format "{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}|{{.CreatedAt}}"');
        return result.stdout.split('\n')
            .filter(Boolean)
            .map(line => {
            const parts = line.split('|');
            return {
                id: parts[0],
                name: parts[1],
                image: parts[2],
                status: parts[3].includes('Up') ? 'running' : 'stopped',
                ports: parts[4] ? parts[4].split(', ') : [],
                created: new Date(parts[5]),
            };
        });
    }
    // Start container
    async startContainer(connectionId, containerId) {
        await this.exec(connectionId, `docker start ${containerId}`);
    }
    // Stop container
    async stopContainer(connectionId, containerId) {
        await this.exec(connectionId, `docker stop ${containerId}`);
    }
    // Get container logs
    async getContainerLogs(connectionId, containerId, lines = 100) {
        const result = await this.exec(connectionId, `docker logs --tail ${lines} ${containerId}`);
        return result.stdout;
    }
    // Execute in container
    async execInContainer(connectionId, containerId, command) {
        const result = await this.exec(connectionId, `docker exec ${containerId} ${command}`);
        return result.stdout;
    }
    // Deploy application
    async deploy(connectionId, options) {
        // Sync files
        await this.syncDirectory(connectionId, options.localPath, options.remotePath);
        // Build if needed
        if (options.buildCommand) {
            await this.exec(connectionId, `cd ${options.remotePath} && ${options.buildCommand}`);
        }
        // Start application
        await this.exec(connectionId, `cd ${options.remotePath} && ${options.startCommand}`);
    }
    // Sync directory via rsync
    async syncDirectory(connectionId, localPath, remotePath) {
        const conn = this.connections.get(connectionId);
        if (!conn)
            throw new Error('Not connected');
        // Use rsync over SSH
        return new Promise((resolve, reject) => {
            const rsync = spawn('rsync', [
                '-avz',
                '-e', 'ssh',
                '--delete',
                localPath + '/',
                `${conn}@${remotePath}`,
            ]);
            rsync.on('close', (code) => {
                if (code === 0)
                    resolve();
                else
                    reject(new Error(`rsync exited with code ${code}`));
            });
            rsync.on('error', reject);
        });
    }
    // Port forwarding
    async forwardPort(connectionId, localPort, remoteHost, remotePort) {
        const conn = this.connections.get(connectionId);
        if (!conn)
            throw new Error('Not connected');
        conn.forwardIn(remoteHost, remotePort, (err) => {
            if (err) {
                this.emit('error', err);
            }
            else {
                this.emit('portForwarded', { localPort, remoteHost, remotePort });
            }
        });
    }
    // Disconnect
    disconnect(connectionId) {
        const conn = this.connections.get(connectionId);
        if (conn) {
            conn.end();
            this.connections.delete(connectionId);
            this.emit('disconnected', connectionId);
        }
    }
    // Get connection status
    isConnected(connectionId) {
        return this.connections.has(connectionId);
    }
    // List active connections
    listConnections() {
        return Array.from(this.connections.keys());
    }
}
export default RemoteDevelopment;
