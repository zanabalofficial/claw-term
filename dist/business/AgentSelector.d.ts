/**
 * Agent Selection Scoring - 7-factor model for choosing which agent to deploy
 * Based on the Frame document's exact scoring methodology
 */
import { EventEmitter } from 'events';
export interface SelectionCriteria {
    pain: number;
    budget: number;
    measurability: number;
    automatable: number;
    data: number;
    regulation: number;
    wedge: number;
}
export interface AgentOpportunity {
    id: string;
    name: string;
    tier: 1 | 2 | 3;
    category: 'revenue_capture' | 'cost_elimination' | 'risk_compliance';
    buyer: string;
    pain: string;
    artifact: string;
    criteria: SelectionCriteria;
    estimatedSetupDays: number;
    estimatedMonthlyValue: number;
}
export interface ScoringResult {
    agentId: string;
    score: number;
    interpretation: 'strong' | 'promising' | 'niche' | 'demo_bait';
    breakdown: Record<string, number>;
    recommendation: string;
}
export interface ValidationCheck {
    rule: string;
    passed: boolean;
    importance: 'critical' | 'high' | 'medium';
    details?: string;
}
export declare class AgentSelector extends EventEmitter {
    private opportunities;
    private readonly WEIGHTS;
    constructor();
    private initializeOpportunities;
    private addOpportunity;
    score(agentId: string): ScoringResult;
    scoreAll(): ScoringResult[];
    getRecommendations(tier?: 1 | 2 | 3, limit?: number): AgentOpportunity[];
    validate(agentId: string, context: {
        manualStaffCount?: number;
        hasDeadline?: boolean;
        artifactStandardized?: boolean;
        hasEscalationBoundary?: boolean;
        canLogHistory?: boolean;
        verifySuccessDays?: number;
        successIsSubjective?: boolean;
        workflowIsPolitical?: boolean;
        hasSystemAccess?: boolean;
        dependsOnBroadKnowledge?: boolean;
        hasBudgetOwner?: boolean;
    }): {
        overall: 'likely_good' | 'likely_weak';
        checks: ValidationCheck[];
    };
    compare(agentIds: string[]): string;
}
export default AgentSelector;
