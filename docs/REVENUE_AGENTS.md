# Revenue Agents - 30 Income-Generating Business Automation Agents

ClawTerm now includes **30 built-in specialized business agents** designed to generate real revenue, eliminate costs, and reduce risk for businesses.

---

## Quick Start

```typescript
import { RevenueAgents, ExtendedRevenueAgents } from 'claw-term';

const agents = new ExtendedRevenueAgents();

// Run AR Recovery Agent
const result = await agents.arRecovery({
  accountingSystem: 'quickbooks',
  credentials: { /* OAuth tokens */ },
  agingThreshold: 30,
});

console.log(result.report);
// "AR Recovery Report: $35,420.50 projected recovery from $101,201.43 at risk"
```

---

## The 30 Revenue Agents

### TIER 1: Fastest Path to Revenue

| # | Agent | Buyer | Pain | Monetization | Impact Metric |
|---|-------|-------|------|--------------|---------------|
| 1 | **AR Recovery** | Agencies, wholesalers, clinics | Unpaid invoices | % of recovered | Recovered $ |
| 2 | **Chargeback Dispute** | Shopify brands, subscriptions | Chargeback losses | Per dispute + success | Disputes won |
| 3 | **Subscription Dunning** | SaaS, memberships | Failed renewals | % recovered MRR | MRR saved |
| 4 | **Invoice Audit** | AP departments, franchises | Overbilling leakage | % savings share | $ protected |
| 5 | **Dormant Lead Reactivation** | Home services, real estate | Dead lead database | Per booking | Leads revived |
| 6 | **Sales Proposal-to-Close** | Agencies, consultancies | Leads going cold | % uplift | Close rate % |
| 7 | **Construction Change-Order** | Contractors, subs | Undocumented work | % captured | $ recovered |
| 8 | **Contract Obligation** | Legal ops, procurement | Missed deadlines | License fee | Penalties avoided |
| 9 | **Compliance Evidence** | SaaS, fintech | Audit prep labor | Subscription | Auditor hours saved |
| 10 | **RFP Response** | Gov contractors, IT firms | Proposal labor | Per response | Win rate % |

### TIER 2: Strong Monetization

| # | Agent | Buyer | Pain | Monetization | Impact Metric |
|---|-------|-------|------|--------------|---------------|
| 11 | **Renewal Rescue** | B2B SaaS | Churn risk | Retained ARR bonus | ARR retained |
| 12 | **Pricing Intelligence** | Amazon sellers, distributors | Margin loss | SKU-based sub | Margin % gain |
| 13 | **Refund Leakage** | E-commerce | Policy abuse | % savings share | $ protected |
| 14 | **Procurement Negotiation** | Mid-market companies | Vendor overpayment | Savings share | $ saved |
| 15 | **Insurance Claim** | Clinics, repair shops | Denied claims | Per claim | Acceptance rate |
| 16 | **Prior Authorization** | Specialty clinics | Staff hours wasted | Per auth | Hours saved |
| 17 | **Bookkeeping Exception** | SMBs, CFO firms | Reconciliation breaks | Monthly sub | Exceptions resolved |
| 18 | **Tax Document Collection** | Accountants | Client chase time | Per client | Hours saved |
| 19 | **Freight Exception** | 3PLs, shippers | SLA breaches | Per shipment | Escalations avoided |
| 20 | **Marketplace Listing** | Amazon/Etsy sellers | Listing decay | Catalog-based sub | Conversion lift % |

### TIER 3: Enterprise Value

| # | Agent | Buyer | Pain | Monetization | Impact Metric |
|---|-------|-------|------|--------------|---------------|
| 21 | **Grant Application** | Nonprofits, universities | Administrative burden | Per org | Funding won |
| 22 | **Recruitment Pipeline** | Staffing firms | Sourcing labor | Per placement | Time to fill |
| 23 | **Property Collections** | Landlords, PMs | Rent delinquency | % recovered | $ collected |
| 24 | **Legal Intake** | Law firms | Qualification labor | Per qualified lead | Lead conversion % |
| 25 | **Support Resolution** | SaaS, marketplaces | Ticket volume | Per resolution | Tickets deflected |
| 26 | **Real Estate Underwriting** | Brokers, investors | Manual underwriting | Per deal | Deals analyzed |
| 27 | **Field Service Dispatch** | HVAC, plumbing | Dispatch inefficiency | Per tech | Jobs per day |
| 28 | **Litigation Discovery** | Law firms, e-discovery | First-pass review | Per matter | Docs reviewed |
| 29 | **Franchise Performance** | Franchisors | Underperforming units | Per location | Revenue stabilized |
| 30 | **Executive Inbox** | Founders, investors | Deal flow chaos | Premium sub | Opportunities captured |

---

## Usage Examples

### 1. AR Recovery Agent

```typescript
const result = await agents.arRecovery({
  accountingSystem: 'quickbooks',
  credentials: { accessToken: 'xxx' },
  agingThreshold: 30,
  maxReminders: 3,
});

// Returns:
{
  agentId: 'ar-recovery',
  success: true,
  revenueImpact: 35420.50,
  actions: [
    'Analyzed 47 overdue invoices',
    'Sent 32 personalized reminders',
    'Escalated 8 to legal review'
  ],
  report: 'AR Recovery Report: $35,420.50 projected recovery from $101,201.43 at risk'
}
```

### 2. Chargeback Dispute Agent

```typescript
const result = await agents.chargebackDispute({
  platform: 'shopify',
  disputeId: 'dis_12345',
  autoSubmit: true,
});

// Returns:
{
  agentId: 'chargeback-dispute',
  success: true,
  revenueImpact: 850.00,
  actions: [
    'Gathered 5 evidence items',
    'Drafted 3-page response',
    'Auto-submitted to platform'
  ],
  report: 'Chargeback Response: Strong case for $850'
}
```

### 3. Subscription Dunning Agent

```typescript
const result = await agents.subscriptionDunning({
  billingSystem: 'stripe',
  failedPayments: [
    { id: 'pi_123', amount: 99, customerId: 'cus_123', failureCount: 1 },
    { id: 'pi_124', amount: 299, customerId: 'cus_124', failureCount: 2 },
  ],
});

// Returns:
{
  agentId: 'dunning',
  success: true,
  revenueImpact: 179.10, // 45% recovery of $398
  actions: [
    'Processed 2 failed payments',
    'Sent 2 recovery messages',
    'Escalated 1 high-value account'
  ],
  report: 'Dunning Recovery: $179.10 MRR projected recovery'
}
```

### 4. Sales Proposal Agent

```typescript
const result = await agents.salesProposal({
  callTranscript: 'Client wants...',
  discoveryNotes: 'Budget: $50k, Timeline: 3 months',
  clientRequirements: ['API integration', 'SSO', 'Reporting'],
  pricing: { total: 50000, breakdown: {...} },
});

// Returns:
{
  agentId: 'sales-proposal',
  success: true,
  revenueImpact: 12500, // 25% close probability
  actions: [
    'Generated Statement of Work',
    'Created 10-page proposal',
    'Scheduled 5-touch follow-up sequence'
  ],
  report: 'Proposal Generated: $50,000 opportunity with 25% close probability'
}
```

### 5. Contract Obligation Tracking

```typescript
const result = await agents.contractObligation({
  contracts: ['/path/to/msa.pdf', '/path/to/sow.pdf'],
  alertDays: 30,
});

// Returns:
{
  agentId: 'contract-obligation',
  success: true,
  costSavings: 15000, // Avoided auto-renewal penalties
  actions: [
    'Parsed 2 contracts',
    'Extracted 12 obligations',
    '3 upcoming deadlines flagged'
  ],
  report: 'Contract Tracking: 3 obligations require action in next 30 days'
}
```

---

## Agent Architecture

Each agent follows the 5-layer architecture:

```
┌─────────────────────────────────────────────┐
│  Layer 5: Escalation                        │
│  • Human review triggers                    │
│  • Edge case routing                        │
│  • Approval checkpoints                     │
├─────────────────────────────────────────────┤
│  Layer 4: Memory                            │
│  • Customer state                           │
│  • Case history                             │
│  • Policy rules                             │
├─────────────────────────────────────────────┤
│  Layer 3: Action                            │
│  • Send message                             │
│  • Draft document                           │
│  • Update record                            │
│  • File dispute                             │
├─────────────────────────────────────────────┤
│  Layer 2: Diagnosis                         │
│  • What happened                            │
│  • What matters                             │
│  • What to do next                          │
│  • Confidence level                         │
├─────────────────────────────────────────────┤
│  Layer 1: Perception                        │
│  • Accounting data                          │
│  • CRM records                              │
│  • Contracts                                │
│  • Emails                                   │
│  • Event streams                            │
└─────────────────────────────────────────────┘
```

---

## Selection Scoring Model

Use the 7-factor scoring model to prioritize which agent to deploy:

| Variable | Weight | Description |
|----------|--------|-------------|
| P (Pain) | 1.4 | Intensity of customer pain |
| B (Budget) | 1.2 | Availability of buyer budget |
| M (Measurability) | 1.5 | How clear is ROI |
| A (Automatable) | 1.3 | Depth of possible automation |
| D (Data) | 1.0 | Accessibility of data |
| R (Regulation) | 0.8 | Low regulatory drag |
| W (Wedge) | 1.4 | Distribution advantage |

**Score Interpretation:**
- **30+**: Strong build candidate
- **26-29**: Promising, needs wedge
- **22-25**: Niche only
- **<22**: Demo bait, not business

---

## Event Monitoring

All agents emit events for monitoring:

```typescript
agents.on('agent:start', ({ agent, config }) => {
  console.log(`Agent ${agent} started`);
});

agents.on('agent:complete', (result) => {
  console.log(`Agent ${result.agentId} completed`);
  console.log(`Revenue impact: $${result.revenueImpact}`);
});

agents.on('agent:error', ({ agent, error }) => {
  console.error(`Agent ${agent} failed:`, error);
});
```

---

## Best Practices

### Start with Leakage-First (Fastest Revenue)

1. **AR Recovery** - Money already owed
2. **Chargeback Dispute** - Contested revenue
3. **Dunning** - Failed renewals
4. **Invoice Audit** - Overbilling
5. **Change-Order** - Undocumented work

### Then Move to Analyst-to-Agent

1. **Contract Tracking** - Document synthesis
2. **RFP Response** - Workflow orchestration
3. **Compliance** - Evidence collection
4. **Underwriting** - Decision support

### Service Replacement (Scale)

1. **Support Resolution** - Ticket deflection
2. **Prior Auth** - Administrative tasks
3. **Recruitment Ops** - Sourcing pipeline
4. **Bookkeeping** - Exception handling

---

## Pricing Models

Agents support multiple pricing structures:

| Model | Best For | Example |
|-------|----------|---------|
| **Outcome-linked** | Savings/recovery visible | 20% of recovered AR |
| **Usage-linked** | Volume-driven value | $5 per invoice audited |
| **Seat/license** | Workflow backbone | $99/user/month |
| **Hybrid** | Maximum value capture | $500 + $2/invoice + 10% savings |

---

## Integration

All agents integrate with:

- **DatabaseTools** - SQL, NoSQL queries
- **EnterpriseConnectors** - GitHub, Slack, Notion, Jira
- **DocumentParsers** - PDF, DOCX, OCR
- **EnhancedMemory** - Multi-layer memory system
- **PolicyEngine** - Safety and approval gates
- **Observability** - Tracing and evaluation

---

## Repository

**GitHub:** https://github.com/zanabalofficial/claw-term

**Files:**
- `src/business/RevenueAgents.ts` - Agents 1-10
- `src/business/ExtendedRevenueAgents.ts` - Agents 11-30
- `src/business/index.ts` - Exports

---

*Transform ClawTerm from a terminal AI into a revenue-generating business automation platform.*
