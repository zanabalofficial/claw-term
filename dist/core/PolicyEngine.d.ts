/**
 * Safety and Policy Tools
 * Permission gates, PII scanning, policy engine, human-in-the-loop
 */
import { EventEmitter } from 'events';
export interface PolicyRule {
    id: string;
    name: string;
    condition: (action: Action) => boolean;
    action: 'allow' | 'deny' | 'prompt';
    reason?: string;
}
export interface Action {
    type: string;
    tool: string;
    params: Record<string, any>;
    risk: 'low' | 'medium' | 'high' | 'critical';
    irreversible: boolean;
    scope: 'read' | 'write' | 'delete' | 'execute';
}
export interface ApprovalRequest {
    id: string;
    action: Action;
    timestamp: Date;
    approved?: boolean;
    approvedBy?: string;
    reason?: string;
}
export declare class PolicyEngine extends EventEmitter {
    private rules;
    private pendingApprovals;
    private auditLog;
    private dangerousPatterns;
    constructor();
    private initializeDefaultRules;
    addRule(rule: PolicyRule): void;
    evaluate(action: Action): {
        allowed: boolean;
        prompt?: boolean;
        reason?: string;
    };
    private checkDangerousPatterns;
    requestApproval(action: Action): ApprovalRequest;
    grantApproval(requestId: string, approvedBy: string, reason?: string): boolean;
    denyApproval(requestId: string, deniedBy: string, reason?: string): boolean;
    scanPII(text: string): {
        found: boolean;
        matches: Array<{
            type: string;
            value: string;
            position: number;
        }>;
    };
    redactPII(text: string): string;
    scanSecrets(text: string): {
        found: boolean;
        matches: Array<{
            type: string;
            value: string;
        }>;
    };
    checkBudget(usage: {
        tokens?: number;
        cost?: number;
        time?: number;
    }, limits: {
        tokens?: number;
        cost?: number;
        time?: number;
    }): {
        withinBudget: boolean;
        warnings: string[];
    };
    private logAudit;
    getAuditLog(): any[];
    getPendingApprovals(): ApprovalRequest[];
}
export default PolicyEngine;
