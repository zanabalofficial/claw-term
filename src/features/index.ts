/**
 * ClawTerm Features Index
 * Export all 10 advanced features
 */

// Feature 1: Multi-Modal Support
export { MultiModalProcessor, TerminalProtocol } from './multimodal';
export type { MultimodalConfig, ImageDisplayOptions } from './multimodal';

// Feature 2: Agent Swarm Mode
export { AgentSwarm, SwarmAgent, SwarmTask } from './swarm';
export type { SwarmConfig, SwarmRole, SwarmMessage } from './swarm';

// Feature 3: Local LLM Hosting
export { LocalLLMServer } from './local-llm';
export type { LocalModelConfig, ModelDownloadInfo } from './local-llm';

// Feature 4: Advanced Code Analysis
export { CodeAnalyzer } from './code-analysis';
export type { 
  CodeAnalysis, 
  FunctionInfo, 
  ClassInfo, 
  DependencyInfo, 
  ComplexityMetrics,
  SecurityIssue,
  CodeSuggestion 
} from './code-analysis';

// Feature 5: Git Integration
export { GitIntegration } from './git-integration';
export type { GitStatus, GitCommit, GitDiff, PullRequest } from './git-integration';

// Feature 6: Remote Development
export { RemoteDevelopment } from './remote-dev';
export type { SSHConnection, ContainerInfo } from './remote-dev';

// Feature 7: Knowledge Graph
export { KnowledgeGraph } from './knowledge-graph';
export type { Node, Edge, GraphQuery } from './knowledge-graph';

// Feature 8: Automated Testing
export { AutomatedTesting } from './testing';
export type { TestResult, CoverageReport } from './testing';

// Feature 9: Performance Profiling
export { PerformanceProfiler, Profile } from './profiling';
export type { ProfileResult, AsyncTrace } from './profiling';

// Feature 10: Natural Language Shell
export { NaturalLanguageShell } from './nl-shell';
export type { NLCommand } from './nl-shell';
