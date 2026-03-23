/**
 * Evaluation and Observability Tools
 * Tracing, scoring, benchmarks, error classification
 */
import { EventEmitter } from 'events';
export interface Trace {
    id: string;
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    status: 'running' | 'completed' | 'failed';
    error?: string;
    metadata: {
        model?: string;
        tokens?: {
            prompt: number;
            completion: number;
        };
        cost?: number;
        tools: string[];
        [key: string]: any;
    };
    spans: Span[];
    parentId?: string;
}
export interface Span {
    id: string;
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    type: 'llm' | 'tool' | 'retrieval' | 'memory' | 'planning';
    input?: any;
    output?: any;
    error?: string;
    metadata: Record<string, any>;
}
export interface EvalResult {
    traceId: string;
    scores: Record<string, number>;
    overall: number;
    feedback: string[];
}
export declare class Observability extends EventEmitter {
    private traces;
    private activeSpans;
    private evals;
    startTrace(name: string, metadata?: Trace['metadata']): Trace;
    endTrace(traceId: string, error?: string): Trace | null;
    startSpan(traceId: string, name: string, type: Span['type'], input?: any, metadata?: Span['metadata']): Span;
    endSpan(spanId: string, output?: any, error?: string): Span | null;
    getTrace(traceId: string): Trace | undefined;
    getAllTraces(): Trace[];
    findTraces(criteria: {
        name?: string;
        status?: Trace['status'];
        tool?: string;
        minDuration?: number;
        maxDuration?: number;
    }): Trace[];
    exportTrace(traceId: string): string;
    exportAsOTel(traceId: string): any;
    evaluate(traceId: string, criteria: {
        correctness?: boolean;
        relevance?: boolean;
        toolAccuracy?: boolean;
        latency?: {
            max: number;
        };
        cost?: {
            max: number;
        };
    }): EvalResult;
    getEvalSummary(): {
        total: number;
        averageScore: number;
        byCriteria: Record<string, number>;
    };
    classifyError(error: string): {
        category: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        recoverable: boolean;
    };
    replay(traceId: string): {
        events: any[];
        canReplay: boolean;
    };
}
export default Observability;
