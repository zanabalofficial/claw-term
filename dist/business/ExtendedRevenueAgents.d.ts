/**
 * Additional Revenue Agents - Agents 11-30
 * Extended business automation capabilities
 */
import { RevenueAgents } from './RevenueAgents';
export interface ExtendedAgentResult {
    agentId: string;
    success: boolean;
    revenueImpact?: number;
    costSavings?: number;
    riskReduction?: number;
    actions: string[];
    report: string;
    recommendations?: string[];
}
export declare class ExtendedRevenueAgents extends RevenueAgents {
    renewalRescue(config: {
        saasPlatform: string;
        atRiskAccounts: Array<{
            accountId: string;
            arr: number;
            healthScore: number;
            lastLogin: Date;
            ticketCount: number;
        }>;
    }): Promise<ExtendedAgentResult>;
    pricingIntelligence(config: {
        products: Array<{
            sku: string;
            currentPrice: number;
            margin: number;
        }>;
        competitorData: Array<{
            sku: string;
            price: number;
            stock: number;
        }>;
        constraints: {
            minMargin: number;
            maxDiscount: number;
        };
    }): Promise<ExtendedAgentResult>;
    refundLeakage(config: {
        refundRequests: Array<{
            id: string;
            amount: number;
            reason: string;
            customerHistory: string;
            orderAge: number;
        }>;
        policyRules: any;
    }): Promise<ExtendedAgentResult>;
    procurementNegotiation(config: {
        vendorContracts: Array<{
            vendor: string;
            spend: number;
            renewalDate: Date;
            terms: any;
        }>;
        marketBenchmarks: any;
    }): Promise<ExtendedAgentResult>;
    insuranceClaim(config: {
        claimType: 'medical' | 'dental' | 'auto' | 'property';
        patientId: string;
        serviceDate: Date;
        documentation: string[];
    }): Promise<ExtendedAgentResult>;
    priorAuthorization(config: {
        procedure: string;
        diagnosis: string;
        provider: string;
        payer: string;
        patientRecords: string[];
    }): Promise<ExtendedAgentResult>;
    bookkeepingException(config: {
        exceptions: Array<{
            id: string;
            type: string;
            description: string;
            amount: number;
            suggestedAccount?: string;
        }>;
        chartOfAccounts: string[];
    }): Promise<ExtendedAgentResult>;
    taxDocumentCollection(config: {
        clientId: string;
        taxYear: number;
        documentTypes: string[];
        existingDocuments: string[];
    }): Promise<ExtendedAgentResult>;
    freightException(config: {
        shipments: Array<{
            id: string;
            status: string;
            eta: Date;
            sla: Date;
            carrier: string;
        }>;
    }): Promise<ExtendedAgentResult>;
    marketplaceOptimization(config: {
        platform: 'amazon' | 'etsy' | 'walmart';
        listings: Array<{
            id: string;
            title: string;
            bullets: string[];
            keywords: string[];
        }>;
        competitorListings: any[];
    }): Promise<ExtendedAgentResult>;
    grantApplication(config: {
        organization: string;
        grantOpportunity: string;
        pastApplications: string[];
        budget: number;
    }): Promise<ExtendedAgentResult>;
    recruitmentPipeline(config: {
        jobRequirements: any;
        sourceChannels: string[];
        candidates: any[];
    }): Promise<ExtendedAgentResult>;
    propertyCollections(config: {
        properties: Array<{
            unitId: string;
            tenant: string;
            balance: number;
            daysOverdue: number;
            leaseEnd: Date;
        }>;
        jurisdiction: string;
    }): Promise<ExtendedAgentResult>;
    legalIntake(config: {
        prospectInfo: any;
        practiceArea: string;
        conflictDatabase: any;
    }): Promise<ExtendedAgentResult>;
    supportResolution(config: {
        tickets: Array<{
            id: string;
            subject: string;
            body: string;
            priority: string;
        }>;
        knowledgeBase: string[];
        approvedActions: string[];
    }): Promise<ExtendedAgentResult>;
    realEstateUnderwriting(config: {
        propertyAddress: string;
        omDocument: string;
        rentRoll: any[];
        comps: any[];
        taxData: any;
    }): Promise<ExtendedAgentResult>;
    fieldServiceDispatch(config: {
        jobs: Array<{
            id: string;
            type: string;
            urgency: number;
            location: any;
        }>;
        technicians: Array<{
            id: string;
            skills: string[];
            location: any;
            schedule: any;
        }>;
        parts: any;
    }): Promise<ExtendedAgentResult>;
    litigationDiscovery(config: {
        documentSet: string[];
        caseType: string;
        keyTerms: string[];
        privilegeRules: any;
    }): Promise<ExtendedAgentResult>;
    franchisePerformance(config: {
        locations: Array<{
            id: string;
            sales: number;
            labor: number;
            reviews: number;
            inventory: any;
        }>;
        benchmarks: any;
    }): Promise<ExtendedAgentResult>;
    executiveInbox(config: {
        emails: Array<{
            id: string;
            from: string;
            subject: string;
            body: string;
            timestamp: Date;
        }>;
        opportunityPatterns: string[];
    }): Promise<ExtendedAgentResult>;
    private selectIntervention;
    private calculateSaveProbability;
    private calculateOptimalPrice;
    private calculateLeverage;
    private calculateBenchmarkGap;
    private generateRedlines;
    private generateTalkTrack;
    private classifyRefundRequest;
    private recommendRefundPath;
    private assembleClaimPacket;
    private mapToPayerRequirements;
    private validateClaimCompleteness;
    private draftClaimNarrative;
    private estimateClaimValue;
    private assembleMedicalRecords;
    private extractMedicalJustification;
    private fillPriorAuthForm;
    private setupAuthTracking;
    private suggestAccountMapping;
    private calculateMappingConfidence;
    private generateClarifyingQuestions;
    private classifyDocumentUrgency;
    private generateDocumentRequest;
    private sendDocumentRequests;
    private calculateExceptionSeverity;
    private recommendFreightAction;
    private draftCustomerCommunication;
    private optimizeTitle;
    private optimizeBullet;
    private identifyKeywordGaps;
    private recommendMedia;
    private checkGrantEligibility;
    private buildGrantChecklist;
    private draftGrantNarrative;
    private createGrantTimeline;
    private enrichCandidateProfile;
    private scoreCandidateFit;
    private createOutreachSequence;
    private prioritizeCollection;
    private selectNoticeType;
    private draftLegalNotice;
    private conductIntakeInterview;
    private checkConflicts;
    private scoreCaseValue;
    private draftIntakeMemo;
    private classifyTicket;
    private findResolution;
    private canAutoResolve;
    private parseOM;
    private buildUnderwritingModel;
    private identifyKeyAssumptions;
    private draftInvestmentMemo;
    private optimizeDispatch;
    private predictNoShows;
    private clusterDocuments;
    private tagRelevance;
    private checkPrivilege;
    private calculateLocationHealth;
    private diagnoseIssues;
    private createActionPlan;
    private classifyOpportunity;
    private extractActionItems;
    private identifyRiskMarkers;
}
export default ExtendedRevenueAgents;
