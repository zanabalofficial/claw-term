# Business Agent Usage Guide

Complete examples for deploying revenue-generating agents with pricing and selection scoring.

---

## Quick Start: Full Business Automation

```typescript
import { ExtendedRevenueAgents, PricingEngine, AgentSelector } from 'claw-term';

// Initialize all components
const agents = new ExtendedRevenueAgents();
const pricing = new PricingEngine();
const selector = new AgentSelector();

// Initialize default pricing
pricing.initializeDefaultPricing();

// 1. SELECT: Score which agent to deploy
const score = selector.score('ar-recovery');
console.log(score);
// {
//   agentId: 'ar-recovery',
//   score: 35.4,
//   interpretation: 'strong',
//   breakdown: { pain: 7, budget: 4.8, measurability: 7.5, ... },
//   recommendation: 'Strong build candidate. High confidence this will generate revenue.'
// }

// 2. VALIDATE: Check against precision rules
const validation = selector.validate('ar-recovery', {
  manualStaffCount: 3,
  hasDeadline: true,
  artifactStandardized: true,
  hasEscalationBoundary: true,
  canLogHistory: true,
  verifySuccessDays: 14,
  successIsSubjective: false,
  workflowIsPolitical: false,
  hasSystemAccess: true,
  dependsOnBroadKnowledge: false,
  hasBudgetOwner: true,
});
// { overall: 'likely_good', checks: [...11 validation checks...] }

// 3. RUN: Execute the agent
const result = await agents.arRecovery({
  accountingSystem: 'quickbooks',
  credentials: { accessToken: process.env.QB_TOKEN },
  agingThreshold: 30,
});

// 4. PRICE: Calculate fee
const invoice = pricing.generateInvoice(
  'ar-recovery',
  { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
  {}, // Usage metrics (not needed for outcome pricing)
  { recovered: result.revenueImpact || 0 } // Outcome metrics
);

console.log(invoice);
// {
//   agentId: 'ar-recovery',
//   period: '2024-01-01 - 2024-01-31',
//   lineItems: [
//     { description: 'RECOVERED: $35420.50 @ 20%', amount: 7084.10 }
//   ],
//   subtotal: 7084.10,
//   total: 7084.10
// }
```

---

## Selection Scoring

### Score an Agent

```typescript
const selector = new AgentSelector();

// Get score for specific agent
const score = selector.score('chargeback-dispute');

// Score all agents and rank
const allScores = selector.scoreAll();
// Returns sorted array by score descending

// Get top recommendations by tier
const tier1 = selector.getRecommendations(1, 5); // Top 5 Tier 1 agents
```

### Score Interpretation

| Score Range | Interpretation | Action |
|-------------|----------------|--------|
| **30+** | Strong build candidate | Deploy immediately |
| **26-29** | Promising, needs wedge | Validate distribution |
| **22-25** | Niche only | Segment-specific |
| **<22** | Demo bait, not business | Pivot or abandon |

### Scoring Breakdown

```typescript
const score = selector.score('ar-recovery');

console.log(score.breakdown);
// {
//   pain: 7.0,           // 5 * 1.4
//   budget: 4.8,         // 4 * 1.2
//   measurability: 7.5,  // 5 * 1.5
//   automatable: 5.2,    // 4 * 1.3
//   data: 5.0,           // 5 * 1.0
//   regulation: 3.2,     // 4 * 0.8
//   wedge: 5.6           // 4 * 1.4
// }
// Total: 35.4 (Strong)
```

---

## Validation Checklist

### Precision Rules Validation

```typescript
const validation = selector.validate('subscription-dunning', {
  // Positive indicators
  manualStaffCount: 2,          // Has 2-10 people doing manually
  hasDeadline: true,            // Failed payments have aging
  artifactStandardized: true,   // Payment records are structured
  hasEscalationBoundary: true,  // Clear when to escalate to human
  canLogHistory: true,          // All actions logged
  verifySuccessDays: 7,         // Can verify recovery in 7 days
  
  // Negative indicators (should be false for good concepts)
  successIsSubjective: false,   // Recovery is measurable $
  workflowIsPolitical: false,   // Not political, just billing
  hasSystemAccess: true,        // Can access billing system
  dependsOnBroadKnowledge: false, // Narrow domain
  hasBudgetOwner: true,         // CFO/Finance owns budget
});

console.log(validation.overall); // 'likely_good' or 'likely_weak'

// Review individual checks
validation.checks.forEach(check => {
  console.log(`${check.passed ? '✅' : '❌'} ${check.rule} (${check.importance})`);
});
```

---

## Pricing Models

### Outcome-Linked (Best for Recovery Agents)

```typescript
// AR Recovery: 20% of recovered revenue
pricing.register('my-ar-agent', {
  model: 'outcome',
  outcomeRate: 0.20,  // 20%
  minFee: 500,        // Minimum $500
});

const fee = pricing.calculate('my-ar-agent', {}, {
  recovered: 50000,   // Recovered $50k
});
// Total: $10,000 (20% of $50k)
```

### Usage-Linked (Best for Volume)

```typescript
// Invoice Audit: $5 per invoice processed
pricing.register('my-audit-agent', {
  model: 'usage',
  usageRate: 5,  // $5 per invoice
});

const fee = pricing.calculate('my-audit-agent', {
  invoices: 1000,  // Processed 1000 invoices
}, {});
// Total: $5,000
```

### Seat/License (Best for Workflow Tools)

```typescript
// Compliance: $299/user/month
pricing.register('my-compliance-agent', {
  model: 'seat',
  seatFee: 299,
});

const fee = pricing.calculate('my-compliance-agent', {
  users: 5,  // 5 users
}, {});
// Total: $1,495/month
```

### Hybrid (Usually Strongest)

```typescript
// RFP Response: Base + usage + success
pricing.register('my-rfp-agent', {
  model: 'hybrid',
  baseFee: 1000,      // $1,000 base
  usageRate: 100,     // $100 per RFP
  outcomeRate: 0.05,  // 5% of won contracts
});

const fee = pricing.calculate('my-rfp-agent', {
  contracts: 5,  // 5 RFPs processed
}, {
  won: 500000,   // Won $500k in contracts
});
// Total: $1,000 + $150 + $25,000 = $26,150
// Breakdown: base + usage + outcome
```

---

## Complete Agent Deployment Examples

### Example 1: AR Recovery (Outcome-Linked)

```typescript
// Setup
const agents = new ExtendedRevenueAgents();
const pricing = new PricingEngine();
pricing.initializeDefaultPricing();

// Run monthly
async function runMonthlyARRRecovery() {
  // Execute agent
  const result = await agents.arRecovery({
    accountingSystem: 'quickbooks',
    credentials: { accessToken: process.env.QB_TOKEN },
    agingThreshold: 30,
  });
  
  // Generate invoice
  const invoice = pricing.generateInvoice(
    'ar-recovery',
    { start: new Date(), end: new Date() },
    {},
    { recovered: result.revenueImpact || 0 }
  );
  
  // Send invoice
  await sendInvoiceToClient(invoice);
  
  return {
    recovered: result.revenueImpact,
    fee: invoice.total,
    roi: (result.revenueImpact || 0) / invoice.total, // Client ROI
  };
}

// Expected: $35k recovered → $7k fee (20%) → Client keeps $28k
```

### Example 2: Subscription Dunning (Outcome-Linked)

```typescript
async function runDailyDunning() {
  // Get failed payments from Stripe
  const failedPayments = await stripe.paymentIntents.list({
    status: 'requires_payment_method',
    created: { gte: Date.now() - 86400000 }, // Last 24h
  });
  
  // Run agent
  const result = await agents.subscriptionDunning({
    billingSystem: 'stripe',
    failedPayments: failedPayments.data.map(p => ({
      id: p.id,
      amount: p.amount / 100,
      customerId: p.customer,
      failureCount: p.last_payment_error ? 1 : 0,
    })),
  });
  
  // Monthly billing
  const invoice = pricing.generateInvoice(
    'subscription-dunning',
    getMonthPeriod(),
    {},
    { recovered: result.revenueImpact || 0 }
  );
  
  return result;
}

// Expected: $10k MRR saved → $1.5k fee (15%)
```

### Example 3: Invoice Audit (Outcome-Linked)

```typescript
async function runMonthlyAudit() {
  // Fetch data
  const [invoices, contracts, pos] = await Promise.all([
    fetchInvoices(),
    fetchContracts(),
    fetchPurchaseOrders(),
  ]);
  
  // Run agent
  const result = await agents.invoiceAudit({
    vendorType: 'software',
    invoices,
    contracts,
    pos,
  });
  
  // Bill on savings
  const invoice = pricing.generateInvoice(
    'invoice-audit',
    getMonthPeriod(),
    {},
    { saved: result.costSavings || 0 }
  );
  
  return {
    savings: result.costSavings,
    fee: invoice.total, // 30% of savings
    netSavings: (result.costSavings || 0) - invoice.total,
  };
}

// Expected: $50k overbilling found → $15k fee (30%) → Client saves $35k
```

### Example 4: Contract Obligation (Seat-License)

```typescript
// Monthly subscription model
async function runContractTracking() {
  const result = await agents.contractObligation({
    contracts: await fetchContractFiles(),
    alertDays: 30,
  });
  
  // Fixed monthly fee per user
  const invoice = pricing.generateInvoice(
    'contract-obligation',
    getMonthPeriod(),
    { users: 10 }, // 10 users on platform
    {}
  );
  
  return {
    obligationsTracked: result.actions[0],
    deadlinesFlagged: result.actions[1],
    fee: invoice.total, // $199 × 10 = $1,990
    penaltiesAvoided: result.costSavings,
  };
}
```

---

## Comparing Multiple Opportunities

```typescript
const selector = new AgentSelector();

// Compare top 3 Tier 1 agents
const comparison = selector.compare([
  'ar-recovery',
  'chargeback-dispute',
  'subscription-dunning',
]);

console.log(comparison);
// Agent Comparison Report
// ==================================================
// 
// AR Recovery Agent
//   Score: 35.4 (strong)
//   Est. Value: $15000/month
//   Setup: 7 days
//   Strong build candidate. High confidence...
// 
// Chargeback Dispute Agent
//   Score: 33.2 (strong)
//   Est. Value: $8500/month
//   Setup: 14 days
//   ...
//
// Subscription Dunning Agent
//   Score: 36.5 (strong)
//   Est. Value: $8000/month
//   Setup: 5 days
//   ...
```

---

## Event Monitoring

```typescript
// Track all agent executions
agents.on('agent:start', ({ agent, config }) => {
  console.log(`[${new Date().toISOString()}] Agent started: ${agent}`);
  // Log to analytics
});

agents.on('agent:complete', (result) => {
  console.log(`[${new Date().toISOString()}] Agent completed: ${result.agentId}`);
  console.log(`  Revenue impact: $${result.revenueImpact}`);
  console.log(`  Actions: ${result.actions.length}`);
  
  // Calculate and log fee
  const invoice = pricing.generateInvoice(
    result.agentId,
    getCurrentPeriod(),
    {},
    { recovered: result.revenueImpact }
  );
  
  console.log(`  Fee earned: $${invoice.total}`);
});

agents.on('agent:error', ({ agent, error }) => {
  console.error(`[${new Date().toISOString()}] Agent failed: ${agent}`);
  console.error(error);
  // Alert on-call
});
```

---

## Best Practices

### 1. Always Validate Before Building

```typescript
const validation = selector.validate(agentId, context);
if (validation.overall !== 'likely_good') {
  console.warn('Agent concept weak, reconsider');
  // Show failed checks
  validation.checks
    .filter(c => !c.passed && c.importance === 'critical')
    .forEach(c => console.log(`❌ ${c.rule}`));
}
```

### 2. Start with Outcome-Linked Pricing

Outcome-linked pricing aligns incentives and makes ROI obvious:

```typescript
// Good: We win when client wins
pricing.register('good-agent', {
  model: 'outcome',
  outcomeRate: 0.20, // 20% of recovered
});

// Risky: Fixed fee regardless of results
pricing.register('risky-agent', {
  model: 'seat',
  seatFee: 1000, // Client pays even if no value
});
```

### 3. Set Minimum Fees

Protect against low-value months:

```typescript
pricing.register('protected-agent', {
  model: 'outcome',
  outcomeRate: 0.25,
  minFee: 500,    // Always at least $500
  maxFee: 50000,  // Cap at $50k
});
```

### 4. Hybrid for Complex Workflows

When there's setup work + usage + outcomes:

```typescript
pricing.register('complex-agent', {
  model: 'hybrid',
  baseFee: 2000,    // Setup/configuration
  usageRate: 50,    // Per transaction
  outcomeRate: 0.10, // Success bonus
});
```

---

## Revenue Projection

```typescript
// Project annual revenue from agent portfolio
function projectRevenue(selectedAgents: string[]) {
  return selectedAgents.map(id => {
    const opp = selector.getOpportunity(id);
    const score = selector.score(id);
    
    // Only count strong/promising agents
    if (score.interpretation === 'demo_bait') {
      return { id, annualRevenue: 0, note: 'Likely to fail' };
    }
    
    const monthly = opp.estimatedMonthlyValue;
    const confidence = score.score / 40; // Normalize to 0-1
    
    return {
      id,
      monthlyPotential: monthly,
      annualRevenue: monthly * 12 * confidence,
      score: score.score,
      interpretation: score.interpretation,
    };
  });
}

// Example
const portfolio = projectRevenue([
  'ar-recovery',
  'chargeback-dispute',
  'subscription-dunning',
]);

console.log(`Portfolio value: $${portfolio.reduce((sum, p) => sum + p.annualRevenue, 0)}`);
```

---

## Complete System Architecture

```
┌─────────────────────────────────────────────┐
│  ClawTerm Business Automation System        │
├─────────────────────────────────────────────┤
│                                             │
│  1. SELECTION (AgentSelector)               │
│     • Score opportunities (7-factor)        │
│     • Validate against precision rules      │
│     • Compare and rank agents               │
│                                             │
│  2. PRICING (PricingEngine)                 │
│     • Outcome-linked (20-30%)               │
│     • Usage-linked ($/unit)                 │
│     • Seat-license ($/user)                 │
│     • Hybrid (base + usage + success)       │
│                                             │
│  3. EXECUTION (ExtendedRevenueAgents)       │
│     • 30 specialized agents                 │
│     • Integration with tools                │
│     • Action tracking                       │
│                                             │
│  4. BILLING                                 │
│     • Generate invoices                     │
│     • Calculate fees                        │
│     • Track ROI                             │
│                                             │
└─────────────────────────────────────────────┘
```

---

**Ready to deploy revenue-generating agents with proper pricing and selection validation.**
