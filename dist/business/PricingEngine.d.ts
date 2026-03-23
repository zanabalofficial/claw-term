/**
 * Pricing Engine - Monetization models for Revenue Agents
 * Outcome-linked, usage-linked, seat/license, and hybrid pricing
 */
import { EventEmitter } from 'events';
export interface PricingConfig {
    model: 'outcome' | 'usage' | 'seat' | 'hybrid';
    baseFee?: number;
    outcomeRate?: number;
    usageRate?: number;
    seatFee?: number;
    successThreshold?: number;
    minFee?: number;
    maxFee?: number;
}
export interface UsageMetrics {
    invoices?: number;
    contracts?: number;
    tickets?: number;
    shipments?: number;
    claims?: number;
    disputes?: number;
    leads?: number;
    users?: number;
    teams?: number;
    locations?: number;
}
export interface OutcomeMetrics {
    recovered?: number;
    saved?: number;
    retained?: number;
    won?: number;
    booked?: number;
    captured?: number;
    protected?: number;
}
export declare class PricingEngine extends EventEmitter {
    private configs;
    register(agentId: string, config: PricingConfig): void;
    calculate(agentId: string, usage: UsageMetrics, outcome: OutcomeMetrics): {
        breakdown: Record<string, number>;
        total: number;
        model: string;
    };
    private calculateOutcome;
    private calculateUsage;
    private calculateSeat;
    private calculateHybrid;
    private applyLimits;
    initializeDefaultPricing(): void;
    generateInvoice(agentId: string, period: {
        start: Date;
        end: Date;
    }, usage: UsageMetrics, outcome: OutcomeMetrics): {
        agentId: string;
        period: string;
        lineItems: Array<{
            description: string;
            amount: number;
        }>;
        subtotal: number;
        total: number;
    };
}
export default PricingEngine;
