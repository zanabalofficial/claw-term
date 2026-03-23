// @ts-nocheck
/**
 * Safety and Policy Tools
 * Permission gates, PII scanning, policy engine, human-in-the-loop
 */
import { EventEmitter } from 'events';
export class PolicyEngine extends EventEmitter {
    rules = [];
    pendingApprovals = new Map();
    auditLog = [];
    // Built-in dangerous patterns
    dangerousPatterns = [
        { pattern: /rm\s+-rf/i, risk: 'critical', reason: 'Mass deletion' },
        { pattern: /DROP\s+TABLE/i, risk: 'critical', reason: 'Database deletion' },
        { pattern: /DELETE\s+FROM.*WHERE/i, risk: 'high', reason: 'Data deletion' },
        { pattern: /eval\s*\(/i, risk: 'high', reason: 'Code injection' },
        { pattern: /sudo/i, risk: 'high', reason: 'Elevated privileges' },
        { pattern: />\s*\/dev\/(sda|disk)/i, risk: 'critical', reason: 'Disk overwrite' },
        { pattern: /mkfs/i, risk: 'critical', reason: 'Filesystem format' },
        { pattern: /curl.*\|.*sh/i, risk: 'high', reason: 'Pipe to shell' },
        { pattern: /password|secret|token|key/i, risk: 'medium', reason: 'Potential secret' },
    ];
    constructor() {
        super();
        this.initializeDefaultRules();
    }
    initializeDefaultRules() {
        // Read-only operations are generally allowed
        this.addRule({
            id: 'allow-read',
            name: 'Allow Read Operations',
            condition: (action) => action.scope === 'read',
            action: 'allow',
        });
        // Write operations need check
        this.addRule({
            id: 'prompt-write',
            name: 'Prompt for Write Operations',
            condition: (action) => action.scope === 'write' && action.risk !== 'low',
            action: 'prompt',
            reason: 'Write operation requires approval',
        });
        // Delete operations always prompt
        this.addRule({
            id: 'prompt-delete',
            name: 'Prompt for Delete Operations',
            condition: (action) => action.scope === 'delete',
            action: 'prompt',
            reason: 'Delete operation requires approval',
        });
        // Critical risk always prompts
        this.addRule({
            id: 'prompt-critical',
            name: 'Prompt for Critical Risk',
            condition: (action) => action.risk === 'critical',
            action: 'prompt',
            reason: 'Critical risk operation',
        });
        // Irreversible operations always prompt
        this.addRule({
            id: 'prompt-irreversible',
            name: 'Prompt for Irreversible Actions',
            condition: (action) => action.irreversible,
            action: 'prompt',
            reason: 'This action cannot be undone',
        });
    }
    addRule(rule) {
        this.rules.push(rule);
    }
    // Evaluate action against policies
    evaluate(action) {
        // First check for dangerous patterns
        const dangerCheck = this.checkDangerousPatterns(action);
        if (dangerCheck.found) {
            action.risk = dangerCheck.risk;
        }
        // Evaluate against rules
        for (const rule of this.rules) {
            if (rule.condition(action)) {
                this.logAudit(action, rule.action, rule.reason);
                switch (rule.action) {
                    case 'allow':
                        return { allowed: true };
                    case 'deny':
                        return { allowed: false, reason: rule.reason };
                    case 'prompt':
                        return { allowed: false, prompt: true, reason: rule.reason };
                }
            }
        }
        // Default: allow low risk, prompt others
        if (action.risk === 'low') {
            return { allowed: true };
        }
        return { allowed: false, prompt: true, reason: 'Action requires approval' };
    }
    checkDangerousPatterns(action) {
        const paramsStr = JSON.stringify(action.params).toLowerCase();
        for (const { pattern, risk, reason } of this.dangerousPatterns) {
            if (pattern.test(paramsStr)) {
                return { found: true, risk, pattern: reason };
            }
        }
        return { found: false };
    }
    // Request human approval
    requestApproval(action) {
        const request = {
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            action,
            timestamp: new Date(),
        };
        this.pendingApprovals.set(request.id, request);
        this.emit('approval:requested', request);
        return request;
    }
    // Grant approval
    grantApproval(requestId, approvedBy, reason) {
        const request = this.pendingApprovals.get(requestId);
        if (!request)
            return false;
        request.approved = true;
        request.approvedBy = approvedBy;
        request.reason = reason;
        this.pendingApprovals.delete(requestId);
        this.emit('approval:granted', request);
        return true;
    }
    // Deny approval
    denyApproval(requestId, deniedBy, reason) {
        const request = this.pendingApprovals.get(requestId);
        if (!request)
            return false;
        request.approved = false;
        request.approvedBy = deniedBy;
        request.reason = reason;
        this.pendingApprovals.delete(requestId);
        this.emit('approval:denied', request);
        return true;
    }
    // PII Scanner
    scanPII(text) {
        const patterns = [
            { type: 'email', regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g },
            { type: 'phone', regex: /\b(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b/g },
            { type: 'ssn', regex: /\b\d{3}-\d{2}-\d{4}\b/g },
            { type: 'credit_card', regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g },
            { type: 'ip_address', regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g },
        ];
        const matches = [];
        for (const { type, regex } of patterns) {
            let match;
            while ((match = regex.exec(text)) !== null) {
                matches.push({
                    type,
                    value: match[0],
                    position: match.index,
                });
            }
        }
        return { found: matches.length > 0, matches };
    }
    // Redact PII
    redactPII(text) {
        const { matches } = this.scanPII(text);
        let redacted = text;
        // Sort by position descending to avoid offset issues
        matches.sort((a, b) => b.position - a.position);
        for (const match of matches) {
            const before = redacted.slice(0, match.position);
            const after = redacted.slice(match.position + match.value.length);
            const redaction = `[REDACTED_${match.type.toUpperCase()}]`;
            redacted = before + redaction + after;
        }
        return redacted;
    }
    // Secret scanner
    scanSecrets(text) {
        const patterns = [
            { type: 'aws_key', regex: /AKIA[0-9A-Z]{16}/g },
            { type: 'github_token', regex: /gh[pousr]_[A-Za-z0-9_]{36,}/g },
            { type: 'api_key', regex: /[a-zA-Z0-9]{32,64}/g },
            { type: 'private_key', regex: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g },
        ];
        const matches = [];
        for (const { type, regex } of patterns) {
            let match;
            while ((match = regex.exec(text)) !== null) {
                matches.push({ type, value: match[0] });
            }
        }
        return { found: matches.length > 0, matches };
    }
    // Budget checker
    checkBudget(usage, limits) {
        const warnings = [];
        if (limits.tokens && usage.tokens && usage.tokens > limits.tokens * 0.9) {
            warnings.push(`Token usage at ${Math.round((usage.tokens / limits.tokens) * 100)}%`);
        }
        if (limits.cost && usage.cost && usage.cost > limits.cost * 0.9) {
            warnings.push(`Cost at $${usage.cost.toFixed(2)} of $${limits.cost} limit`);
        }
        if (limits.time && usage.time && usage.time > limits.time * 0.9) {
            warnings.push(`Time at ${Math.round((usage.time / limits.time) * 100)}%`);
        }
        const withinBudget = !((limits.tokens && usage.tokens && usage.tokens > limits.tokens) ||
            (limits.cost && usage.cost && usage.cost > limits.cost) ||
            (limits.time && usage.time && usage.time > limits.time));
        return { withinBudget, warnings };
    }
    logAudit(action, decision, reason) {
        this.auditLog.push({
            timestamp: new Date(),
            action,
            decision,
            reason,
        });
    }
    getAuditLog() {
        return [...this.auditLog];
    }
    getPendingApprovals() {
        return Array.from(this.pendingApprovals.values());
    }
}
export default PolicyEngine;
