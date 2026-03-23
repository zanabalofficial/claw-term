/**
 * Remote Development - SSH and container management
 * Connect to remote servers, manage containers, deploy applications
 */
import { EventEmitter } from 'events';
export interface SSHConnection {
    host: string;
    port: number;
    username: string;
    privateKey?: string;
    password?: string;
}
export interface ContainerInfo {
    id: string;
    name: string;
    image: string;
    status: 'running' | 'stopped' | 'paused';
    ports: string[];
    created: Date;
}
export declare class RemoteDevelopment extends EventEmitter {
    private connections;
    connect(id: string, config: SSHConnection): Promise<void>;
    exec(connectionId: string, command: string): Promise<{
        stdout: string;
        stderr: string;
        code: number;
    }>;
    getFile(connectionId: string, remotePath: string, localPath: string): Promise<void>;
    putFile(connectionId: string, localPath: string, remotePath: string): Promise<void>;
    listContainers(connectionId: string): Promise<ContainerInfo[]>;
    startContainer(connectionId: string, containerId: string): Promise<void>;
    stopContainer(connectionId: string, containerId: string): Promise<void>;
    getContainerLogs(connectionId: string, containerId: string, lines?: number): Promise<string>;
    execInContainer(connectionId: string, containerId: string, command: string): Promise<string>;
    deploy(connectionId: string, options: {
        localPath: string;
        remotePath: string;
        buildCommand?: string;
        startCommand: string;
    }): Promise<void>;
    syncDirectory(connectionId: string, localPath: string, remotePath: string): Promise<void>;
    forwardPort(connectionId: string, localPort: number, remoteHost: string, remotePort: number): Promise<void>;
    disconnect(connectionId: string): void;
    isConnected(connectionId: string): boolean;
    listConnections(): string[];
}
export default RemoteDevelopment;
