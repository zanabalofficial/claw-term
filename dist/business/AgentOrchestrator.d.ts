/**
 * Agent Orchestrator - Production deployment and scheduling
 * Schedule, monitor, and orchestrate revenue agents in production
 */
import { EventEmitter } from 'events';
export interface ScheduledJob {
    id: string;
    agentId: string;
    name: string;
    schedule: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
    cronExpression?: string;
    config: any;
    enabled: boolean;
    lastRun?: Date;
    nextRun?: Date;
    runCount: number;
    totalRevenue: number;
    totalCost: number;
}
export interface JobResult {
    jobId: string;
    agentId: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    success: boolean;
    result?: any;
    error?: string;
    revenueImpact?: number;
    costSavings?: number;
    fee?: number;
}
export declare class AgentOrchestrator extends EventEmitter {
    private agents;
    private pricing;
    private selector;
    private jobs;
    private jobHistory;
    private timers;
    constructor();
    schedule(jobConfig: Omit<ScheduledJob, 'id' | 'runCount' | 'totalRevenue' | 'totalCost'>): ScheduledJob;
    private startJob;
    stopJob(jobId: string): void;
    executeJob(jobId: string): Promise<JobResult>;
    private runAgent;
    private calculateFee;
    private calculateInterval;
    getJob(jobId: string): ScheduledJob | undefined;
    getAllJobs(): ScheduledJob[];
    getJobHistory(jobId?: string, limit?: number): JobResult[];
    getStats(): {
        totalJobs: number;
        activeJobs: number;
        totalRuns: number;
        totalRevenue: number;
        totalFees: number;
        successRate: number;
    };
    setJobEnabled(jobId: string, enabled: boolean): void;
    deleteJob(jobId: string): void;
    runAll(): Promise<JobResult[]>;
    stopAll(): void;
    healthCheck(): {
        status: 'healthy' | 'degraded' | 'unhealthy';
        activeJobs: number;
        failedRuns: number;
        last24h: number;
    };
}
export default AgentOrchestrator;
