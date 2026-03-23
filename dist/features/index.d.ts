/**
 * ClawTerm Features Index
 * Export all 10 advanced features
 */
export { MultiModalProcessor } from './multimodal';
export type { MultimodalConfig, ImageDisplayOptions, TerminalProtocol } from './multimodal';
export { AgentSwarm } from './swarm';
export { SwarmAgent, SwarmTask } from './swarm';
export type { SwarmConfig, SwarmRole, SwarmMessage, } from './swarm';
export { LocalLLMServer } from './local-llm';
export type { LocalModelConfig, ModelDownloadInfo } from './local-llm';
export { CodeAnalyzer } from './code-analysis';
export type { CodeAnalysis, FunctionInfo, ClassInfo, DependencyInfo, ComplexityMetrics, SecurityIssue, CodeSuggestion } from './code-analysis';
export { GitIntegration } from './git-integration';
export type { GitStatus, GitCommit, GitDiff, PullRequest } from './git-integration';
export { RemoteDevelopment } from './remote-dev';
export type { SSHConnection, ContainerInfo } from './remote-dev';
export { KnowledgeGraph } from './knowledge-graph';
export type { Node, Edge, GraphQuery } from './knowledge-graph';
export { AutomatedTesting } from './testing';
export type { TestResult, CoverageReport } from './testing';
export { PerformanceProfiler, Profile } from './profiling';
export type { ProfileResult, AsyncTrace } from './profiling';
export { NaturalLanguageShell } from './nl-shell';
export type { NLCommand } from './nl-shell';
export { MCPClient } from '../mcp';
export { SkillManager } from '../skills';
export { OpenClawBridge } from '../openclaw';
export type { MCPTool, MCPConnection } from '../mcp';
export type { Skill, SkillManifest } from '../skills';
export type { AgentWorldConfig, ClawdChatConfig, AgentInfo } from '../openclaw';
export { RevenueAgents, ExtendedRevenueAgents, PricingEngine, AgentSelector, AgentOrchestrator } from '../business';
export type { AgentRunResult, ExtendedAgentResult, PricingConfig, UsageMetrics, OutcomeMetrics, SelectionCriteria, AgentOpportunity, ScoringResult, ValidationCheck, ScheduledJob, JobResult } from '../business';
