/**
 * Performance Profiling - Built-in profiler for code
 * CPU, memory, and async operation profiling
 */

import { performance, PerformanceObserver } from 'perf_hooks';
import { writeFileSync } from 'fs';
import { EventEmitter } from 'events';

export interface ProfileResult {
  name: string;
  startTime: number;
  duration: number;
  cpuUsage: { user: number; system: number };
  memoryUsage: { heapUsed: number; heapTotal: number; external: number };
  calls: number;
}

export interface AsyncTrace {
  id: number;
  type: string;
  startTime: number;
  duration: number;
  parentId?: number;
}

export class PerformanceProfiler extends EventEmitter {
  private profiles: Map<string, ProfileResult> = new Map();
  private activeProfiles: Map<string, number> = new Map();
  private asyncTraces: AsyncTrace[] = [];
  private traceId = 0;
  private obs?: PerformanceObserver;

  constructor() {
    super();
    this.setupPerformanceObserver();
  }

  private setupPerformanceObserver(): void {
    this.obs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.asyncTraces.push({
          id: ++this.traceId,
          type: entry.name,
          startTime: entry.startTime,
          duration: entry.duration,
        });
      }
    });
    
    this.obs.observe({ entryTypes: ['async', 'function'] });
  }

  // Start profiling a function
  start(name: string): void {
    const startTime = performance.now();
    const startCpu = process.cpuUsage();
    const startMem = process.memoryUsage();

    this.activeProfiles.set(name, startTime);
    
    this.profiles.set(name, {
      name,
      startTime,
      duration: 0,
      cpuUsage: { user: 0, system: 0 },
      memoryUsage: startMem,
      calls: (this.profiles.get(name)?.calls || 0) + 1,
    });
  }

  // End profiling
  end(name: string): ProfileResult | null {
    const startTime = this.activeProfiles.get(name);
    if (!startTime) return null;

    const endTime = performance.now();
    const duration = endTime - startTime;
    const endCpu = process.cpuUsage();
    const endMem = process.memoryUsage();

    const profile = this.profiles.get(name);
    if (!profile) return null;

    const result: ProfileResult = {
      name,
      startTime,
      duration,
      cpuUsage: {
        user: endCpu.user - (this.profiles.get(name)?.cpuUsage.user || 0),
        system: endCpu.system - (this.profiles.get(name)?.cpuUsage.system || 0),
      },
      memoryUsage: {
        heapUsed: endMem.heapUsed - profile.memoryUsage.heapUsed,
        heapTotal: endMem.heapTotal,
        external: endMem.external,
      },
      calls: profile.calls,
    };

    this.profiles.set(name, result);
    this.activeProfiles.delete(name);
    
    this.emit('profileEnd', result);
    return result;
  }

  // Profile a function automatically
  async profile<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.start(name);
    try {
      return await fn();
    } finally {
      this.end(name);
    }
  }

  // Get all profiles
  getProfiles(): ProfileResult[] {
    return Array.from(this.profiles.values());
  }

  // Get profile by name
  getProfile(name: string): ProfileResult | undefined {
    return this.profiles.get(name);
  }

  // Get slowest profiles
  getSlowest(count: number = 5): ProfileResult[] {
    return this.getProfiles()
      .sort((a, b) => b.duration - a.duration)
      .slice(0, count);
  }

  // Get total time
  getTotalTime(): number {
    return this.getProfiles().reduce((sum, p) => sum + p.duration, 0);
  }

  // Generate flame graph data (for visualization)
  generateFlameGraph(): object {
    const root = {
      name: 'root',
      value: this.getTotalTime(),
      children: [] as any[],
    };

    for (const profile of this.getProfiles()) {
      root.children.push({
        name: profile.name,
        value: profile.duration,
        calls: profile.calls,
      });
    }

    return root;
  }

  // Export to Chrome DevTools format
  exportToChrome(): object {
    const events: any[] = [];
    
    for (const profile of this.getProfiles()) {
      events.push({
        name: profile.name,
        ph: 'X', // Complete event
        ts: profile.startTime * 1000, // microseconds
        dur: profile.duration * 1000,
        pid: process.pid,
        tid: 1,
      });
    }

    return { traceEvents: events };
  }

  // Save profile to file
  saveToFile(path: string): void {
    const data = {
      profiles: this.getProfiles(),
      asyncTraces: this.asyncTraces,
      summary: {
        totalTime: this.getTotalTime(),
        profileCount: this.profiles.size,
        slowest: this.getSlowest(5),
      },
    };
    
    writeFileSync(path, JSON.stringify(data, null, 2));
  }

  // Memory leak detection
  detectMemoryLeaks(): Array<{ name: string; growth: number }> {
    const leaks: Array<{ name: string; growth: number }> = [];
    
    for (const profile of this.getProfiles()) {
      if (profile.memoryUsage.heapUsed > 50 * 1024 * 1024) { // > 50MB
        leaks.push({
          name: profile.name,
          growth: profile.memoryUsage.heapUsed / (1024 * 1024),
        });
      }
    }

    return leaks.sort((a, b) => b.growth - a.growth);
  }

  // Clear all profiles
  clear(): void {
    this.profiles.clear();
    this.activeProfiles.clear();
    this.asyncTraces = [];
  }

  // Benchmark a function multiple times
  async benchmark<T>(name: string, fn: () => Promise<T>, iterations: number = 100): Promise<{
    mean: number;
    median: number;
    min: number;
    max: number;
    stdDev: number;
  }> {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      times.push(performance.now() - start);
    }

    times.sort((a, b) => a - b);
    
    const mean = times.reduce((a, b) => a + b, 0) / times.length;
    const median = times[Math.floor(times.length / 2)];
    const min = times[0];
    const max = times[times.length - 1];
    
    const variance = times.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / times.length;
    const stdDev = Math.sqrt(variance);

    return { mean, median, min, max, stdDev };
  }

  dispose(): void {
    this.obs?.disconnect();
  }
}

// Decorator for profiling class methods
export function Profile(target: any, propertyKey: string, descriptor: PropertyDescriptor): void {
  const originalMethod = descriptor.value;
  const profiler = new PerformanceProfiler();

  descriptor.value = async function (...args: any[]) {
    const name = `${target.constructor.name}.${propertyKey}`;
    return profiler.profile(name, () => originalMethod.apply(this, args));
  };
}

export default PerformanceProfiler;
