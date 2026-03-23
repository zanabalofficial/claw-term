// @ts-nocheck
/**
 * Evaluation and Observability Tools
 * Tracing, scoring, benchmarks, error classification
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

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
    tokens?: { prompt: number; completion: number };
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

export class Observability extends EventEmitter {
  private traces: Map<string, Trace> = new Map();
  private activeSpans: Map<string, Span> = new Map();
  private evals: EvalResult[] = [];

  // Start a trace
  startTrace(name: string, metadata: Trace['metadata'] = { tools: [] }): Trace {
    const trace: Trace = {
      id: uuidv4(),
      name,
      startTime: Date.now(),
      status: 'running',
      metadata,
      spans: [],
    };

    this.traces.set(trace.id, trace);
    this.emit('trace:started', trace);
    
    return trace;
  }

  // End a trace
  endTrace(traceId: string, error?: string): Trace | null {
    const trace = this.traces.get(traceId);
    if (!trace) return null;

    trace.endTime = Date.now();
    trace.duration = trace.endTime - trace.startTime;
    trace.status = error ? 'failed' : 'completed';
    trace.error = error;

    this.emit('trace:ended', trace);
    return trace;
  }

  // Start a span
  startSpan(
    traceId: string,
    name: string,
    type: Span['type'],
    input?: any,
    metadata: Span['metadata'] = {}
  ): Span {
    const span: Span = {
      id: uuidv4(),
      name,
      startTime: Date.now(),
      type,
      input,
      metadata,
    };

    const trace = this.traces.get(traceId);
    if (trace) {
      trace.spans.push(span);
    }

    this.activeSpans.set(span.id, span);
    this.emit('span:started', { traceId, span });
    
    return span;
  }

  // End a span
  endSpan(spanId: string, output?: any, error?: string): Span | null {
    const span = this.activeSpans.get(spanId);
    if (!span) return null;

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.output = output;
    span.error = error;

    this.activeSpans.delete(spanId);
    this.emit('span:ended', span);
    
    return span;
  }

  // Get trace
  getTrace(traceId: string): Trace | undefined {
    return this.traces.get(traceId);
  }

  // Get all traces
  getAllTraces(): Trace[] {
    return Array.from(this.traces.values());
  }

  // Get traces by criteria
  findTraces(criteria: {
    name?: string;
    status?: Trace['status'];
    tool?: string;
    minDuration?: number;
    maxDuration?: number;
  }): Trace[] {
    return Array.from(this.traces.values()).filter(trace => {
      if (criteria.name && !trace.name.includes(criteria.name)) return false;
      if (criteria.status && trace.status !== criteria.status) return false;
      if (criteria.tool && !trace.metadata.tools.includes(criteria.tool)) return false;
      if (criteria.minDuration && (trace.duration || 0) < criteria.minDuration) return false;
      if (criteria.maxDuration && (trace.duration || 0) > criteria.maxDuration) return false;
      return true;
    });
  }

  // Export trace to JSON
  exportTrace(traceId: string): string {
    const trace = this.traces.get(traceId);
    if (!trace) return '{}';
    return JSON.stringify(trace, null, 2);
  }

  // Export as OpenTelemetry format
  exportAsOTel(traceId: string): any {
    const trace = this.traces.get(traceId);
    if (!trace) return null;

    return {
      resourceSpans: [{
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: 'claw-term' } },
          ],
        },
        scopeSpans: [{
          scope: { name: 'claw-term', version: '2.0.0' },
          spans: trace.spans.map(span => ({
            traceId: trace.id.replace(/-/g, ''),
            spanId: span.id.replace(/-/g, '').slice(0, 16),
            name: span.name,
            kind: 1,
            startTimeUnixNano: span.startTime * 1e6,
            endTimeUnixNano: (span.endTime || Date.now()) * 1e6,
            attributes: Object.entries(span.metadata).map(([k, v]) => ({
              key: k,
              value: { stringValue: String(v) },
            })),
          })),
        }],
      }],
    };
  }

  // Run evaluation
  evaluate(traceId: string, criteria: {
    correctness?: boolean;
    relevance?: boolean;
    toolAccuracy?: boolean;
    latency?: { max: number };
    cost?: { max: number };
  }): EvalResult {
    const trace = this.traces.get(traceId);
    if (!trace) {
      return { traceId, scores: {}, overall: 0, feedback: ['Trace not found'] };
    }

    const scores: Record<string, number> = {};
    const feedback: string[] = [];

    // Latency score
    if (criteria.latency) {
      const duration = trace.duration || 0;
      scores.latency = Math.max(0, 1 - (duration / criteria.latency.max));
      if (scores.latency < 0.5) feedback.push(`High latency: ${duration}ms`);
    }

    // Cost score
    if (criteria.cost && trace.metadata.cost) {
      scores.cost = Math.max(0, 1 - (trace.metadata.cost / criteria.cost.max));
      if (scores.cost < 0.5) feedback.push(`High cost: $${trace.metadata.cost}`);
    }

    // Tool accuracy
    if (criteria.toolAccuracy) {
      const toolSpans = trace.spans.filter(s => s.type === 'tool' && !s.error);
      const failedSpans = trace.spans.filter(s => s.type === 'tool' && s.error);
      
      if (toolSpans.length + failedSpans.length > 0) {
        scores.toolAccuracy = toolSpans.length / (toolSpans.length + failedSpans.length);
        if (failedSpans.length > 0) {
          feedback.push(`${failedSpans.length} tool call(s) failed`);
        }
      }
    }

    // Error rate
    const errorCount = trace.spans.filter(s => s.error).length;
    scores.errorRate = 1 - (errorCount / Math.max(trace.spans.length, 1));
    if (errorCount > 0) feedback.push(`${errorCount} error(s) in trace`);

    // Calculate overall
    const scoreValues = Object.values(scores);
    const overall = scoreValues.length > 0 
      ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length 
      : 0;

    const result: EvalResult = {
      traceId,
      scores,
      overall,
      feedback,
    };

    this.evals.push(result);
    this.emit('eval:completed', result);
    
    return result;
  }

  // Get evaluation summary
  getEvalSummary(): {
    total: number;
    averageScore: number;
    byCriteria: Record<string, number>;
  } {
    if (this.evals.length === 0) {
      return { total: 0, averageScore: 0, byCriteria: {} };
    }

    const allCriteria = new Set<string>();
    this.evals.forEach(e => Object.keys(e.scores).forEach(k => allCriteria.add(k)));

    const byCriteria: Record<string, number> = {};
    for (const criterion of allCriteria) {
      const scores = this.evals
        .map(e => e.scores[criterion])
        .filter(s => s !== undefined);
      
      byCriteria[criterion] = scores.length > 0 
        ? scores.reduce((a, b) => a + b, 0) / scores.length 
        : 0;
    }

    return {
      total: this.evals.length,
      averageScore: this.evals.reduce((sum, e) => sum + e.overall, 0) / this.evals.length,
      byCriteria,
    };
  }

  // Classify error
  classifyError(error: string): { 
    category: string; 
    severity: 'low' | 'medium' | 'high' | 'critical';
    recoverable: boolean;
  } {
    // Tool errors
    if (error.includes('tool') || error.includes('function')) {
      return { category: 'tool_error', severity: 'medium', recoverable: true };
    }

    // Network errors
    if (error.includes('network') || error.includes('timeout') || error.includes('ECONNREFUSED')) {
      return { category: 'network_error', severity: 'medium', recoverable: true };
    }

    // API errors
    if (error.includes('rate limit') || error.includes('429')) {
      return { category: 'rate_limit', severity: 'low', recoverable: true };
    }

    if (error.includes('401') || error.includes('403')) {
      return { category: 'auth_error', severity: 'high', recoverable: false };
    }

    // Memory/retrieval errors
    if (error.includes('memory') || error.includes('retrieval')) {
      return { category: 'memory_error', severity: 'medium', recoverable: true };
    }

    // Planning errors
    if (error.includes('plan') || error.includes('workflow')) {
      return { category: 'planning_error', severity: 'high', recoverable: false };
    }

    // Safety/policy errors
    if (error.includes('policy') || error.includes('approval')) {
      return { category: 'policy_violation', severity: 'high', recoverable: false };
    }

    // Default
    return { category: 'unknown', severity: 'medium', recoverable: true };
  }

  // Session replay
  replay(traceId: string): { events: any[]; canReplay: boolean } {
    const trace = this.traces.get(traceId);
    if (!trace) return { events: [], canReplay: false };

    const events = trace.spans.map(span => ({
      type: span.type,
      name: span.name,
      input: span.input,
      output: span.output,
      duration: span.duration,
      error: span.error,
    }));

    return { events, canReplay: true };
  }
}

export default Observability;
