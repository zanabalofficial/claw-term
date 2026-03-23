// @ts-nocheck
/**
 * Agent Selection Scoring - 7-factor model for choosing which agent to deploy
 * Based on the Frame document's exact scoring methodology
 */
import { EventEmitter } from 'events';
export class AgentSelector extends EventEmitter {
    opportunities = new Map();
    // Weights from the Frame document
    WEIGHTS = {
        pain: 1.4,
        budget: 1.2,
        measurability: 1.5,
        automatable: 1.3,
        data: 1.0,
        regulation: 0.8,
        wedge: 1.4,
    };
    constructor() {
        super();
        this.initializeOpportunities();
    }
    initializeOpportunities() {
        // TIER 1: Fastest path to revenue
        this.addOpportunity({
            id: 'ar-recovery',
            name: 'AR Recovery Agent',
            tier: 1,
            category: 'revenue_capture',
            buyer: 'agencies, wholesalers, clinics',
            pain: 'unpaid invoices pile up, owners manually chase',
            artifact: 'invoice',
            criteria: {
                pain: 5, // Extremely painful
                budget: 4, // Will pay % of recovered
                measurability: 5, // Recovered $ is crystal clear
                automatable: 4, // Structured follow-up sequences
                data: 5, // Accounting systems have APIs
                regulation: 4, // Some collections rules
                wedge: 4, // "We recovered $X" sells itself
            },
            estimatedSetupDays: 7,
            estimatedMonthlyValue: 15000,
        });
        this.addOpportunity({
            id: 'chargeback-dispute',
            name: 'Chargeback Dispute Agent',
            tier: 1,
            category: 'revenue_capture',
            buyer: 'Shopify brands, subscription businesses',
            pain: 'chargebacks destroy margin, evidence gathering is manual',
            artifact: 'dispute',
            criteria: {
                pain: 5,
                budget: 4,
                measurability: 5, // Disputes won = $ saved
                automatable: 4,
                data: 4, // Platform APIs available
                regulation: 3, // Platform policies change
                wedge: 4, // Win rate case studies
            },
            estimatedSetupDays: 14,
            estimatedMonthlyValue: 8500,
        });
        this.addOpportunity({
            id: 'invoice-audit',
            name: 'Invoice Audit Agent',
            tier: 1,
            category: 'cost_elimination',
            buyer: 'AP departments, franchises',
            pain: 'overbilling passes unnoticed',
            artifact: 'invoice',
            criteria: {
                pain: 4,
                budget: 4, // % of savings
                measurability: 5, // $ saved is clear
                automatable: 4,
                data: 3, // PO matching complexity
                regulation: 4,
                wedge: 4,
            },
            estimatedSetupDays: 21,
            estimatedMonthlyValue: 12000,
        });
        this.addOpportunity({
            id: 'subscription-dunning',
            name: 'Subscription Dunning Agent',
            tier: 1,
            category: 'revenue_capture',
            buyer: 'SaaS, memberships, education',
            pain: 'failed renewals quietly erode MRR',
            artifact: 'failed_payment',
            criteria: {
                pain: 4,
                budget: 5, // SaaS companies love MRR tools
                measurability: 5, // Recovered MRR
                automatable: 5, // Fully automatable
                data: 5, // Billing system APIs
                regulation: 4, // Some compliance
                wedge: 5, // Retention is sexy
            },
            estimatedSetupDays: 5,
            estimatedMonthlyValue: 8000,
        });
        // TIER 2: Strong monetization
        this.addOpportunity({
            id: 'dormant-lead',
            name: 'Dormant Lead Reactivation',
            tier: 2,
            category: 'revenue_capture',
            buyer: 'home services, real estate, med spas',
            pain: 'thousands of ignored old leads',
            artifact: 'lead_record',
            criteria: {
                pain: 4,
                budget: 3,
                measurability: 4, // Booked appointments
                automatable: 4,
                data: 4, // CRM data
                regulation: 3, // Outreach compliance
                wedge: 4,
            },
            estimatedSetupDays: 10,
            estimatedMonthlyValue: 6000,
        });
        this.addOpportunity({
            id: 'sales-proposal',
            name: 'Sales Proposal-to-Close Agent',
            tier: 2,
            category: 'revenue_capture',
            buyer: 'agencies, consultancies, dev shops',
            pain: 'leads go cold between discovery and SOW',
            artifact: 'proposal',
            criteria: {
                pain: 4,
                budget: 4,
                measurability: 4, // Close rate improvement
                automatable: 3, // Needs some human touch
                data: 3, // CRM + call data
                regulation: 5,
                wedge: 4,
            },
            estimatedSetupDays: 14,
            estimatedMonthlyValue: 10000,
        });
        this.addOpportunity({
            id: 'change-order',
            name: 'Construction Change-Order Agent',
            tier: 2,
            category: 'revenue_capture',
            buyer: 'contractors, subs, PM firms',
            pain: 'undocumented work, revenue leakage',
            artifact: 'field_notes',
            criteria: {
                pain: 5,
                budget: 4,
                measurability: 5, // Captured revenue
                automatable: 3, // Needs field verification
                data: 2, // Scattered sources
                regulation: 4,
                wedge: 5, // "We captured $X" is powerful
            },
            estimatedSetupDays: 21,
            estimatedMonthlyValue: 18000,
        });
        // TIER 3: Enterprise value
        this.addOpportunity({
            id: 'contract-obligation',
            name: 'Contract Obligation Tracking Agent',
            tier: 3,
            category: 'risk_compliance',
            buyer: 'legal ops, procurement',
            pain: 'obligations hidden in contracts get missed',
            artifact: 'contract',
            criteria: {
                pain: 4,
                budget: 3, // Cost avoidance harder to sell
                measurability: 4, // Penalties avoided
                automatable: 4,
                data: 3, // Document processing
                regulation: 4,
                wedge: 3,
            },
            estimatedSetupDays: 30,
            estimatedMonthlyValue: 5000,
        });
        this.addOpportunity({
            id: 'compliance-evidence',
            name: 'Compliance Evidence Collection Agent',
            tier: 3,
            category: 'risk_compliance',
            buyer: 'SaaS, MSPs, fintech',
            pain: 'audit prep is laborious',
            artifact: 'checklist',
            criteria: {
                pain: 4,
                budget: 4, // Audit costs are real
                measurability: 4, // Auditor hours saved
                automatable: 4,
                data: 4,
                regulation: 3, // Heavy regulation
                wedge: 3,
            },
            estimatedSetupDays: 45,
            estimatedMonthlyValue: 8000,
        });
        this.addOpportunity({
            id: 'rfp-response',
            name: 'RFP Response Agent',
            tier: 3,
            category: 'revenue_capture',
            buyer: 'gov contractors, IT firms',
            pain: 'RFP responses are labor-intensive',
            artifact: 'proposal',
            criteria: {
                pain: 4,
                budget: 4,
                measurability: 4, // Win rate, deal size
                automatable: 3, // Needs review
                data: 3, // Past proposals
                regulation: 4,
                wedge: 4,
            },
            estimatedSetupDays: 60,
            estimatedMonthlyValue: 15000,
        });
    }
    addOpportunity(opp) {
        this.opportunities.set(opp.id, opp);
    }
    // Score a specific opportunity
    score(agentId) {
        const opp = this.opportunities.get(agentId);
        if (!opp) {
            throw new Error(`Unknown agent: ${agentId}`);
        }
        const c = opp.criteria;
        const w = this.WEIGHTS;
        // Calculate weighted score
        const score = c.pain * w.pain +
            c.budget * w.budget +
            c.measurability * w.measurability +
            c.automatable * w.automatable +
            c.data * w.data +
            c.regulation * w.regulation +
            c.wedge * w.wedge;
        // Determine interpretation
        let interpretation;
        let recommendation;
        if (score >= 30) {
            interpretation = 'strong';
            recommendation = 'Strong build candidate. High confidence this will generate revenue.';
        }
        else if (score >= 26) {
            interpretation = 'promising';
            recommendation = 'Promising opportunity. Needs strong distribution wedge.';
        }
        else if (score >= 22) {
            interpretation = 'niche';
            recommendation = 'Niche opportunity. Only viable for specific segments.';
        }
        else {
            interpretation = 'demo_bait';
            recommendation = 'Likely demo bait, not a real business. Consider pivoting.';
        }
        return {
            agentId,
            score: Math.round(score * 10) / 10,
            interpretation,
            breakdown: {
                pain: c.pain * w.pain,
                budget: c.budget * w.budget,
                measurability: c.measurability * w.measurability,
                automatable: c.automatable * w.automatable,
                data: c.data * w.data,
                regulation: c.regulation * w.regulation,
                wedge: c.wedge * w.wedge,
            },
            recommendation,
        };
    }
    // Score all opportunities
    scoreAll() {
        return Array.from(this.opportunities.keys())
            .map(id => this.score(id))
            .sort((a, b) => b.score - a.score);
    }
    // Get top recommendations by tier
    getRecommendations(tier, limit = 5) {
        let opps = Array.from(this.opportunities.values());
        if (tier) {
            opps = opps.filter(o => o.tier === tier);
        }
        // Sort by estimated monthly value
        return opps
            .sort((a, b) => b.estimatedMonthlyValue - a.estimatedMonthlyValue)
            .slice(0, limit);
    }
    // Validate an agent concept against precision rules
    validate(agentId, context) {
        const checks = [];
        // Positive indicators
        checks.push({
            rule: 'Buyer has 2-10 people doing this manually',
            passed: context.manualStaffCount !== undefined && context.manualStaffCount >= 2 && context.manualStaffCount <= 10,
            importance: 'critical',
            details: `Staff count: ${context.manualStaffCount}`,
        });
        checks.push({
            rule: 'There is a deadline or aging clock',
            passed: context.hasDeadline === true,
            importance: 'critical',
        });
        checks.push({
            rule: 'Artifact is standardized (invoice, claim, contract, etc.)',
            passed: context.artifactStandardized === true,
            importance: 'critical',
        });
        checks.push({
            rule: 'Clear escalation boundary exists',
            passed: context.hasEscalationBoundary === true,
            importance: 'high',
        });
        checks.push({
            rule: 'Action history can be logged for audit',
            passed: context.canLogHistory === true,
            importance: 'high',
        });
        checks.push({
            rule: 'Success verifiable in under 30 days',
            passed: context.verifySuccessDays !== undefined && context.verifySuccessDays <= 30,
            importance: 'critical',
            details: `Verification time: ${context.verifySuccessDays} days`,
        });
        // Negative indicators
        checks.push({
            rule: 'Success is NOT subjective',
            passed: context.successIsSubjective !== true,
            importance: 'critical',
        });
        checks.push({
            rule: 'Workflow is NOT mostly political',
            passed: context.workflowIsPolitical !== true,
            importance: 'high',
        });
        checks.push({
            rule: 'Agent CAN access systems of record',
            passed: context.hasSystemAccess === true,
            importance: 'critical',
        });
        checks.push({
            rule: 'Does NOT depend on broad world knowledge',
            passed: context.dependsOnBroadKnowledge !== true,
            importance: 'high',
        });
        checks.push({
            rule: 'Someone owns the budget line',
            passed: context.hasBudgetOwner === true,
            importance: 'critical',
        });
        // Calculate overall
        const criticalPassed = checks.filter(c => c.importance === 'critical' && c.passed).length;
        const criticalTotal = checks.filter(c => c.importance === 'critical').length;
        const overall = criticalPassed >= criticalTotal - 1 ? 'likely_good' : 'likely_weak';
        return { overall, checks };
    }
    // Generate comparison report
    compare(agentIds) {
        const scores = agentIds.map(id => this.score(id));
        let report = 'Agent Comparison Report\n';
        report += '='.repeat(50) + '\n\n';
        scores.forEach(s => {
            const opp = this.opportunities.get(s.agentId);
            report += `${opp?.name}\n`;
            report += `  Score: ${s.score} (${s.interpretation})\n`;
            report += `  Est. Value: $${opp?.estimatedMonthlyValue}/month\n`;
            report += `  Setup: ${opp?.estimatedSetupDays} days\n`;
            report += `  ${s.recommendation}\n\n`;
        });
        return report;
    }
}
export default AgentSelector;
