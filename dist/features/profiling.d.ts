/**
 * Performance Profiling - Built-in profiler for code
 * CPU, memory, and async operation profiling
 */
import { EventEmitter } from 'events';
export interface ProfileResult {
    name: string;
    startTime: number;
    duration: number;
    cpuUsage: {
        user: number;
        system: number;
    };
    memoryUsage: {
        heapUsed: number;
        heapTotal: number;
        external: number;
    };
    calls: number;
}
export interface AsyncTrace {
    id: number;
    type: string;
    startTime: number;
    duration: number;
    parentId?: number;
}
export declare class PerformanceProfiler extends EventEmitter {
    private profiles;
    private activeProfiles;
    private asyncTraces;
    private traceId;
    private obs?;
    constructor();
    private setupPerformanceObserver;
    start(name: string): void;
    end(name: string): ProfileResult | null;
    profile<T>(name: string, fn: () => Promise<T>): Promise<T>;
    getProfiles(): ProfileResult[];
    getProfile(name: string): ProfileResult | undefined;
    getSlowest(count?: number): ProfileResult[];
    getTotalTime(): number;
    generateFlameGraph(): object;
    exportToChrome(): object;
    saveToFile(path: string): void;
    detectMemoryLeaks(): Array<{
        name: string;
        growth: number;
    }>;
    clear(): void;
    benchmark<T>(name: string, fn: () => Promise<T>, iterations?: number): Promise<{
        mean: number;
        median: number;
        min: number;
        max: number;
        stdDev: number;
    }>;
    dispose(): void;
}
export declare function Profile(target: any, propertyKey: string, descriptor: PropertyDescriptor): void;
export default PerformanceProfiler;
