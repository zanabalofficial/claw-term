/**
 * Revenue Agents - Top 10 Income-Generating Business Automation Agents
 * Built-in specialized agents for revenue capture, cost elimination, compliance
 */
import { EventEmitter } from 'events';
export interface AgentRunResult {
    agentId: string;
    success: boolean;
    revenueImpact?: number;
    costSavings?: number;
    timeSaved?: number;
    actions: string[];
    report: string;
}
export declare class RevenueAgents extends EventEmitter {
    private db;
    private enterprise;
    private docs;
    private memory;
    constructor();
    arRecovery(config: {
        accountingSystem: 'quickbooks' | 'xero';
        credentials: any;
        agingThreshold?: number;
        maxReminders?: number;
    }): Promise<AgentRunResult>;
    chargebackDispute(config: {
        platform: 'shopify' | 'stripe' | 'paypal';
        disputeId: string;
        autoSubmit?: boolean;
    }): Promise<AgentRunResult>;
    subscriptionDunning(config: {
        billingSystem: string;
        failedPayments: Array<{
            id: string;
            amount: number;
            customerId: string;
            failureCount: number;
        }>;
    }): Promise<AgentRunResult>;
    invoiceAudit(config: {
        vendorType: string;
        invoices: any[];
        contracts: any[];
        pos: any[];
    }): Promise<AgentRunResult>;
    dormantLeadReactivation(config: {
        crm: string;
        dormantDays: number;
        leadCount?: number;
    }): Promise<AgentRunResult>;
    salesProposal(config: {
        callTranscript?: string;
        discoveryNotes?: string;
        clientRequirements: string[];
        pricing: any;
    }): Promise<AgentRunResult>;
    changeOrderCapture(config: {
        projectId: string;
        fieldNotes: string[];
        emails: string[];
        drawings: string[];
    }): Promise<AgentRunResult>;
    contractObligation(config: {
        contracts: string[];
        alertDays: number;
    }): Promise<AgentRunResult>;
    complianceEvidence(config: {
        framework: 'soc2' | 'iso27001' | 'gdpr';
        controlIds: string[];
        evidenceSources: string[];
    }): Promise<AgentRunResult>;
    rfpResponse(config: {
        rfpDocument: string;
        pastProposals: string[];
        teamMembers: string[];
    }): Promise<AgentRunResult>;
    private connectAccounting;
    private queryOverdueInvoices;
    private calculateRecoveryScore;
    private generateReminders;
    private sendEmailReminders;
    private fetchDispute;
    private gatherDisputeEvidence;
    private draftDisputeResponse;
    private submitDisputeResponse;
    private getDunningSequence;
    private generateDunningMessage;
    private sendDunningMessages;
    private findDuplicate;
    private queryDormantLeads;
    private scoreLeadPriority;
    private generateReactivationSequence;
    private launchSequences;
    private generateSOW;
    private draftProposal;
    private createFollowUpSequence;
    private analyzeScopeDrift;
    private draftChangeOrder;
    private extractObligations;
    private generateNotice;
    private mapControlToSources;
    private collectArtifacts;
    private validateEvidence;
    private identifyGaps;
    private extractRFPRequirements;
    private findRelevantPastProposals;
    private draftRFPSection;
    private buildComplianceMatrix;
    private estimateContractValue;
}
export default RevenueAgents;
