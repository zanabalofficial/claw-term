// @ts-nocheck
/**
 * Pricing Engine - Monetization models for Revenue Agents
 * Outcome-linked, usage-linked, seat/license, and hybrid pricing
 */

import { EventEmitter } from 'events';

export interface PricingConfig {
  model: 'outcome' | 'usage' | 'seat' | 'hybrid';
  baseFee?: number;
  outcomeRate?: number; // Percentage (0.2 = 20%)
  usageRate?: number; // Per unit
  seatFee?: number; // Per user/month
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

export class PricingEngine extends EventEmitter {
  private configs: Map<string, PricingConfig> = new Map();

  // Register pricing for an agent
  register(agentId: string, config: PricingConfig): void {
    this.configs.set(agentId, config);
  }

  // Calculate fee based on model
  calculate(agentId: string, usage: UsageMetrics, outcome: OutcomeMetrics): {
    breakdown: Record<string, number>;
    total: number;
    model: string;
  } {
    const config = this.configs.get(agentId);
    if (!config) {
      throw new Error(`No pricing config for agent: ${agentId}`);
    }

    switch (config.model) {
      case 'outcome':
        return this.calculateOutcome(config, outcome);
      case 'usage':
        return this.calculateUsage(config, usage);
      case 'seat':
        return this.calculateSeat(config, usage);
      case 'hybrid':
        return this.calculateHybrid(config, usage, outcome);
      default:
        throw new Error(`Unknown pricing model: ${config.model}`);
    }
  }

  private calculateOutcome(config: PricingConfig, outcome: OutcomeMetrics): {
    breakdown: Record<string, number>;
    total: number;
    model: string;
  } {
    const rate = config.outcomeRate || 0.2; // Default 20%
    const recovered = (outcome.recovered || 0) * rate;
    const saved = (outcome.saved || 0) * rate;
    const retained = (outcome.retained || 0) * rate;
    const won = (outcome.won || 0) * rate;
    const booked = (outcome.booked || 0) * rate;
    const captured = (outcome.captured || 0) * rate;
    const protectedAmt = (outcome.protected || 0) * rate;

    const subtotal = recovered + saved + retained + won + booked + captured + protectedAmt;
    const total = this.applyLimits(subtotal, config);

    return {
      breakdown: {
        recovered,
        saved,
        retained,
        won,
        booked,
        captured,
        protected: protectedAmt,
      },
      total,
      model: 'outcome-linked',
    };
  }

  private calculateUsage(config: PricingConfig, usage: UsageMetrics): {
    breakdown: Record<string, number>;
    total: number;
    model: string;
  } {
    const rate = config.usageRate || 1; // Default $1 per unit
    const invoices = (usage.invoices || 0) * rate;
    const contracts = (usage.contracts || 0) * rate;
    const tickets = (usage.tickets || 0) * rate;
    const shipments = (usage.shipments || 0) * rate;
    const claims = (usage.claims || 0) * rate;

    const subtotal = invoices + contracts + tickets + shipments + claims;
    const total = this.applyLimits(subtotal, config);

    return {
      breakdown: {
        invoices,
        contracts,
        tickets,
        shipments,
        claims,
      },
      total,
      model: 'usage-linked',
    };
  }

  private calculateSeat(config: PricingConfig, usage: UsageMetrics): {
    breakdown: Record<string, number>;
    total: number;
    model: string;
  } {
    const fee = config.seatFee || 99; // Default $99/seat/month
    const users = (usage.users || 1) * fee;
    const teams = (usage.teams || 0) * fee * 5; // Teams = 5x user price
    const locations = (usage.locations || 0) * fee * 10; // Locations = 10x user price

    const total = users + teams + locations;

    return {
      breakdown: {
        users,
        teams,
        locations,
      },
      total,
      model: 'seat/license',
    };
  }

  private calculateHybrid(config: PricingConfig, usage: UsageMetrics, outcome: OutcomeMetrics): {
    breakdown: Record<string, number>;
    total: number;
    model: string;
  } {
    const base = config.baseFee || 500;
    
    // Usage component (30% weight)
    const usageComponent = this.calculateUsage(
      { ...config, usageRate: (config.usageRate || 1) * 0.3 },
      usage
    );

    // Outcome component (50% weight after base)
    const outcomeComponent = this.calculateOutcome(
      { ...config, outcomeRate: (config.outcomeRate || 0.2) * 0.5 },
      outcome
    );

    const subtotal = base + usageComponent.total + outcomeComponent.total;
    const total = this.applyLimits(subtotal, config);

    return {
      breakdown: {
        base,
        usage: usageComponent.total,
        outcome: outcomeComponent.total,
      },
      total,
      model: 'hybrid',
    };
  }

  private applyLimits(amount: number, config: PricingConfig): number {
    let result = amount;
    if (config.minFee && result < config.minFee) result = config.minFee;
    if (config.maxFee && result > config.maxFee) result = config.maxFee;
    return Math.round(result * 100) / 100;
  }

  // Pre-configured pricing for top agents
  initializeDefaultPricing(): void {
    // TIER 1: Outcome-linked (strongest)
    this.register('ar-recovery', {
      model: 'outcome',
      outcomeRate: 0.20, // 20% of recovered
      minFee: 500,
    });

    this.register('chargeback-dispute', {
      model: 'outcome',
      outcomeRate: 0.25, // 25% of won disputes
      minFee: 50,
    });

    this.register('subscription-dunning', {
      model: 'outcome',
      outcomeRate: 0.15, // 15% of recovered MRR
      minFee: 99,
    });

    this.register('invoice-audit', {
      model: 'outcome',
      outcomeRate: 0.30, // 30% of savings
      minFee: 1000,
    });

    // TIER 2: Usage-linked
    this.register('dormant-lead', {
      model: 'usage',
      usageRate: 5, // $5 per lead processed
    });

    this.register('sales-proposal', {
      model: 'usage',
      usageRate: 50, // $50 per proposal
    });

    this.register('change-order', {
      model: 'outcome',
      outcomeRate: 0.10, // 10% of captured revenue
    });

    // TIER 3: Seat/license
    this.register('contract-obligation', {
      model: 'seat',
      seatFee: 199, // $199/user/month
    });

    this.register('compliance-evidence', {
      model: 'seat',
      seatFee: 299, // $299/user/month
    });

    this.register('rfp-response', {
      model: 'hybrid',
      baseFee: 1000,
      usageRate: 100, // $100 per RFP
      outcomeRate: 0.05, // 5% of won contract value
    });
  }

  // Generate invoice
  generateInvoice(
    agentId: string,
    period: { start: Date; end: Date },
    usage: UsageMetrics,
    outcome: OutcomeMetrics
  ): {
    agentId: string;
    period: string;
    lineItems: Array<{ description: string; amount: number }>;
    subtotal: number;
    total: number;
  } {
    const calculation = this.calculate(agentId, usage, outcome);
    
    const lineItems = Object.entries(calculation.breakdown)
      .filter(([, amount]) => amount > 0)
      .map(([key, amount]) => ({
        description: `${key.replace(/_/g, ' ').toUpperCase()}: ${key.includes('recovered') || key.includes('saved') ? '$' + amount.toFixed(2) + ' @ ' + ((this.configs.get(agentId)?.outcomeRate || 0.2) * 100) + '%' : amount + ' units @ $' + (this.configs.get(agentId)?.usageRate || 1) + '/unit'}`,
        amount,
      }));

    return {
      agentId,
      period: `${period.start.toISOString().split('T')[0]} - ${period.end.toISOString().split('T')[0]}`,
      lineItems,
      subtotal: calculation.total,
      total: calculation.total,
    };
  }
}

export default PricingEngine;
