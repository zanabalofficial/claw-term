// @ts-nocheck
/**
 * Agent Orchestrator - Production deployment and scheduling
 * Schedule, monitor, and orchestrate revenue agents in production
 */
import { EventEmitter } from 'events';
import { ExtendedRevenueAgents } from './ExtendedRevenueAgents';
import { PricingEngine } from './PricingEngine';
import { AgentSelector } from './AgentSelector';
export class AgentOrchestrator extends EventEmitter {
    agents;
    pricing;
    selector;
    jobs = new Map();
    jobHistory = [];
    timers = new Map();
    constructor() {
        super();
        this.agents = new ExtendedRevenueAgents();
        this.pricing = new PricingEngine();
        this.selector = new AgentSelector();
        this.pricing.initializeDefaultPricing();
    }
    // Schedule a new job
    schedule(jobConfig) {
        const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const job = {
            ...jobConfig,
            id,
            runCount: 0,
            totalRevenue: 0,
            totalCost: 0,
        };
        this.jobs.set(id, job);
        if (job.enabled) {
            this.startJob(id);
        }
        this.emit('job:scheduled', job);
        return job;
    }
    // Start a scheduled job
    startJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job || !job.enabled)
            return;
        const interval = this.calculateInterval(job.schedule, job.cronExpression);
        const timer = setInterval(async () => {
            await this.executeJob(jobId);
        }, interval);
        this.timers.set(jobId, timer);
        // Calculate next run
        job.nextRun = new Date(Date.now() + interval);
        this.jobs.set(jobId, job);
    }
    // Stop a scheduled job
    stopJob(jobId) {
        const timer = this.timers.get(jobId);
        if (timer) {
            clearInterval(timer);
            this.timers.delete(jobId);
        }
        const job = this.jobs.get(jobId);
        if (job) {
            job.nextRun = undefined;
            this.jobs.set(jobId, job);
        }
        this.emit('job:stopped', { jobId });
    }
    // Execute a job immediately
    async executeJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job)
            throw new Error(`Job ${jobId} not found`);
        const startTime = new Date();
        this.emit('job:started', { jobId, agentId: job.agentId, startTime });
        try {
            // Execute the agent
            const result = await this.runAgent(job.agentId, job.config);
            // Calculate fee
            const fee = this.calculateFee(job.agentId, result);
            const endTime = new Date();
            const jobResult = {
                jobId,
                agentId: job.agentId,
                startTime,
                endTime,
                duration: endTime.getTime() - startTime.getTime(),
                success: true,
                result,
                revenueImpact: result.revenueImpact,
                costSavings: result.costSavings,
                fee,
            };
            // Update job stats
            job.runCount++;
            job.lastRun = endTime;
            job.totalRevenue += result.revenueImpact || 0;
            job.totalCost += fee;
            this.jobs.set(jobId, job);
            // Store history
            this.jobHistory.push(jobResult);
            this.emit('job:completed', jobResult);
            return jobResult;
        }
        catch (error) {
            const endTime = new Date();
            const jobResult = {
                jobId,
                agentId: job.agentId,
                startTime,
                endTime,
                duration: endTime.getTime() - startTime.getTime(),
                success: false,
                error: error.message,
            };
            this.jobHistory.push(jobResult);
            this.emit('job:failed', jobResult);
            throw error;
        }
    }
    // Run specific agent by ID
    async runAgent(agentId, config) {
        switch (agentId) {
            case 'ar-recovery':
                return this.agents.arRecovery(config);
            case 'chargeback-dispute':
                return this.agents.chargebackDispute(config);
            case 'subscription-dunning':
                return this.agents.subscriptionDunning(config);
            case 'invoice-audit':
                return this.agents.invoiceAudit(config);
            case 'dormant-lead':
                return this.agents.dormantLeadReactivation(config);
            case 'sales-proposal':
                return this.agents.salesProposal(config);
            case 'change-order':
                return this.agents.changeOrderCapture(config);
            case 'contract-obligation':
                return this.agents.contractObligation(config);
            case 'compliance-evidence':
                return this.agents.complianceEvidence(config);
            case 'rfp-response':
                return this.agents.rfpResponse(config);
            case 'renewal-rescue':
                return this.agents.renewalRescue(config);
            case 'pricing-intelligence':
                return this.agents.pricingIntelligence(config);
            case 'refund-leakage':
                return this.agents.refundLeakage(config);
            case 'procurement-negotiation':
                return this.agents.procurementNegotiation(config);
            case 'insurance-claim':
                return this.agents.insuranceClaim(config);
            case 'prior-auth':
                return this.agents.priorAuthorization(config);
            case 'bookkeeping-exception':
                return this.agents.bookkeepingException(config);
            case 'tax-document':
                return this.agents.taxDocumentCollection(config);
            case 'freight-exception':
                return this.agents.freightException(config);
            case 'marketplace-optimization':
                return this.agents.marketplaceOptimization(config);
            case 'grant-application':
                return this.agents.grantApplication(config);
            case 'recruitment-pipeline':
                return this.agents.recruitmentPipeline(config);
            case 'property-collections':
                return this.agents.propertyCollections(config);
            case 'legal-intake':
                return this.agents.legalIntake(config);
            case 'support-resolution':
                return this.agents.supportResolution(config);
            case 'real-estate-underwriting':
                return this.agents.realEstateUnderwriting(config);
            case 'field-service-dispatch':
                return this.agents.fieldServiceDispatch(config);
            case 'litigation-discovery':
                return this.agents.litigationDiscovery(config);
            case 'franchise-performance':
                return this.agents.franchisePerformance(config);
            case 'executive-inbox':
                return this.agents.executiveInbox(config);
            default:
                throw new Error(`Unknown agent: ${agentId}`);
        }
    }
    // Calculate fee for a job run
    calculateFee(agentId, result) {
        try {
            const calculation = this.pricing.calculate(agentId, {}, {
                recovered: result.revenueImpact,
                saved: result.costSavings,
                retained: result.revenueImpact,
                protected: result.costSavings,
            });
            return calculation.total;
        }
        catch {
            return 0;
        }
    }
    // Calculate interval in milliseconds
    calculateInterval(schedule, cronExpression) {
        const hour = 60 * 60 * 1000;
        const day = 24 * hour;
        switch (schedule) {
            case 'hourly':
                return hour;
            case 'daily':
                return day;
            case 'weekly':
                return 7 * day;
            case 'monthly':
                return 30 * day;
            case 'custom':
                // Parse simple cron (e.g., "0 */6 * * *" = every 6 hours)
                if (cronExpression) {
                    const parts = cronExpression.split(' ');
                    if (parts[1].startsWith('*/')) {
                        const hours = parseInt(parts[1].slice(2));
                        return hours * hour;
                    }
                }
                return day;
            default:
                return day;
        }
    }
    // Get job status
    getJob(jobId) {
        return this.jobs.get(jobId);
    }
    // Get all jobs
    getAllJobs() {
        return Array.from(this.jobs.values());
    }
    // Get job history
    getJobHistory(jobId, limit = 100) {
        let history = this.jobHistory;
        if (jobId) {
            history = history.filter(h => h.jobId === jobId);
        }
        return history.slice(-limit);
    }
    // Get orchestrator stats
    getStats() {
        const jobs = this.getAllJobs();
        const history = this.jobHistory;
        const successful = history.filter(h => h.success).length;
        return {
            totalJobs: jobs.length,
            activeJobs: jobs.filter(j => j.enabled).length,
            totalRuns: jobs.reduce((sum, j) => sum + j.runCount, 0),
            totalRevenue: jobs.reduce((sum, j) => sum + j.totalRevenue, 0),
            totalFees: jobs.reduce((sum, j) => sum + j.totalCost, 0),
            successRate: history.length > 0 ? successful / history.length : 0,
        };
    }
    // Enable/disable job
    setJobEnabled(jobId, enabled) {
        const job = this.jobs.get(jobId);
        if (!job)
            return;
        job.enabled = enabled;
        this.jobs.set(jobId, job);
        if (enabled) {
            this.startJob(jobId);
        }
        else {
            this.stopJob(jobId);
        }
        this.emit('job:updated', job);
    }
    // Delete job
    deleteJob(jobId) {
        this.stopJob(jobId);
        this.jobs.delete(jobId);
        this.emit('job:deleted', { jobId });
    }
    // Run all enabled jobs immediately
    async runAll() {
        const enabledJobs = this.getAllJobs().filter(j => j.enabled);
        const results = [];
        for (const job of enabledJobs) {
            try {
                const result = await this.executeJob(job.id);
                results.push(result);
            }
            catch (error) {
                // Continue with other jobs
            }
        }
        return results;
    }
    // Stop all jobs
    stopAll() {
        for (const jobId of this.jobs.keys()) {
            this.stopJob(jobId);
        }
    }
    // Health check
    healthCheck() {
        const jobs = this.getAllJobs();
        const recentHistory = this.jobHistory.filter(h => h.startTime.getTime() > Date.now() - 24 * 60 * 60 * 1000);
        const failed = recentHistory.filter(h => !h.success).length;
        let status = 'healthy';
        if (failed > recentHistory.length * 0.5) {
            status = 'unhealthy';
        }
        else if (failed > recentHistory.length * 0.2) {
            status = 'degraded';
        }
        return {
            status,
            activeJobs: jobs.filter(j => j.enabled).length,
            failedRuns: failed,
            last24h: recentHistory.length,
        };
    }
}
export default AgentOrchestrator;
