/**
 * Tool Registry - Exact parity with OpenClaw tool inventory
 * All 21 tools from Section 1
 */

import { z } from 'zod';

// ============================================================================
// Tool Schema Definitions (exact match to OpenClaw spec)
// ============================================================================

export const FileReadSchema = z.object({
  file_path: z.string().optional(),
  path: z.string().optional(),
  offset: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).optional(),
});

export const FileWriteSchema = z.object({
  content: z.string(),
  file_path: z.string().optional(),
  path: z.string().optional(),
});

export const FileEditSchema = z.object({
  file_path: z.string().optional(),
  path: z.string().optional(),
  oldText: z.string(),
  newText: z.string(),
  old_string: z.string().optional(),
  new_string: z.string().optional(),
});

export const ExecSchema = z.object({
  command: z.string(),
  workdir: z.string().optional(),
  timeout: z.number().int().min(1).optional(),
  background: z.boolean().optional(),
  yieldMs: z.number().int().min(0).optional(),
  pty: z.boolean().optional(),
  elevated: z.boolean().optional(),
  host: z.enum(['sandbox', 'gateway', 'node']).optional(),
  node: z.string().optional(),
  env: z.record(z.string()).optional(),
  ask: z.enum(['off', 'on-miss', 'always']).optional(),
  security: z.enum(['deny', 'allowlist', 'full']).optional(),
});

export const ProcessSchema = z.object({
  action: z.enum(['list', 'poll', 'log', 'write', 'send-keys', 'paste', 'kill', 'steer', 'submit']),
  sessionId: z.string().optional(),
  data: z.string().optional(),
  keys: z.array(z.string()).optional(),
  hex: z.array(z.string()).optional(),
  literal: z.string().optional(),
  text: z.string().optional(),
  bracketed: z.boolean().optional(),
  offset: z.number().int().optional(),
  limit: z.number().int().optional(),
  timeout: z.number().int().optional(),
  eof: z.boolean().optional(),
});

export const WebSearchSchema = z.object({
  query: z.string(),
  count: z.number().int().min(1).max(10).optional(),
  country: z.string().length(2).optional(),
  language: z.string().optional(),
  search_lang: z.string().optional(),
  ui_lang: z.string().optional(),
  freshness: z.enum(['day', 'week', 'month', 'year']).optional(),
  date_after: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_before: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const WebFetchSchema = z.object({
  url: z.string().url(),
  extractMode: z.enum(['markdown', 'text']).optional(),
  maxChars: z.number().int().min(100).optional(),
});

export const BrowserSchema = z.object({
  action: z.enum(['status', 'start', 'stop', 'profiles', 'tabs', 'open', 'focus', 'close', 'snapshot', 'screenshot', 'navigate', 'console', 'pdf', 'upload', 'dialog', 'act']),
  profile: z.enum(['user', 'openclaw', 'chrome-relay']).optional(),
  target: z.enum(['sandbox', 'host', 'node']).optional(),
  node: z.string().optional(),
  url: z.string().optional(),
  targetId: z.string().optional(),
  selector: z.string().optional(),
  ref: z.string().optional(),
  kind: z.enum(['click', 'type', 'press', 'hover', 'drag', 'select', 'fill', 'resize', 'wait', 'evaluate', 'close']).optional(),
  text: z.string().optional(),
  values: z.array(z.string()).optional(),
  request: z.record(z.any()).optional(),
});

export const CanvasSchema = z.object({
  action: z.enum(['present', 'hide', 'navigate', 'eval', 'snapshot', 'a2ui_push', 'a2ui_reset']),
  url: z.string().optional(),
  javaScript: z.string().optional(),
  jsonl: z.string().optional(),
  jsonlPath: z.string().optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  x: z.number().int().optional(),
  y: z.number().int().optional(),
  quality: z.number().int().optional(),
  outputFormat: z.enum(['png', 'jpg', 'jpeg']).optional(),
  node: z.string().optional(),
  gatewayToken: z.string().optional(),
  gatewayUrl: z.string().optional(),
});

export const MessageSchema = z.object({
  action: z.enum(['send', 'poll', 'react', 'delete', 'edit', 'topic-create']),
  channel: z.string().optional(),
  target: z.string().optional(),
  message: z.string().optional(),
  messageId: z.string().optional(),
  buttons: z.array(z.any()).optional(),
  media: z.string().optional(),
  pollQuestion: z.string().optional(),
  pollOption: z.array(z.string()).optional(),
});

export const TTSSchema = z.object({
  text: z.string(),
  channel: z.string().optional(),
});

export const AgentsListSchema = z.object({});

export const SessionsListSchema = z.object({
  activeMinutes: z.number().int().min(1).optional(),
  kinds: z.array(z.string()).optional(),
  limit: z.number().int().min(1).optional(),
  messageLimit: z.number().int().min(0).optional(),
});

export const SessionsHistorySchema = z.object({
  sessionKey: z.string(),
  limit: z.number().int().min(1).optional(),
  includeTools: z.boolean().optional(),
});

export const SessionsSendSchema = z.object({
  message: z.string(),
  sessionKey: z.string().optional(),
  label: z.string().optional(),
  agentId: z.string().optional(),
  timeoutSeconds: z.number().int().min(0).optional(),
});

export const SubagentsSchema = z.object({
  action: z.enum(['list', 'kill', 'steer']).optional(),
  target: z.string().optional(),
  message: z.string().optional(),
  recentMinutes: z.number().int().min(1).optional(),
});

export const SessionsSpawnSchema = z.object({
  task: z.string(),
  runtime: z.enum(['subagent', 'acp']).optional(),
  agentId: z.string().optional(),
  mode: z.enum(['run', 'session']).optional(),
  thread: z.boolean().optional(),
  label: z.string().optional(),
  timeoutSeconds: z.number().int().min(0).optional(),
  runTimeoutSeconds: z.number().int().min(0).optional(),
  attachments: z.array(z.any()).optional(),
  cwd: z.string().optional(),
  sandbox: z.enum(['inherit', 'require']).optional(),
  model: z.string().optional(),
  thinking: z.string().optional(),
  cleanup: z.enum(['delete', 'keep']).optional(),
  resumeSessionId: z.string().optional(),
});

export const SessionsYieldSchema = z.object({
  message: z.string().optional(),
});

export const SessionStatusSchema = z.object({
  sessionKey: z.string().optional(),
  model: z.string().optional(),
});

export const MemorySearchSchema = z.object({
  query: z.string(),
  maxResults: z.number().int().optional(),
  minScore: z.number().int().optional(),
});

export const MemoryGetSchema = z.object({
  path: z.string(),
  from: z.number().int().min(1).optional(),
  lines: z.number().int().min(1).optional(),
});

// ============================================================================
// Tool Type Definitions
// ============================================================================

export type ToolName = 
  | 'read' | 'write' | 'edit'
  | 'exec' | 'process'
  | 'web_search' | 'web_fetch'
  | 'browser' | 'canvas'
  | 'message' | 'tts'
  | 'agents_list' | 'sessions_list' | 'sessions_history'
  | 'sessions_send' | 'subagents' | 'sessions_spawn'
  | 'sessions_yield' | 'session_status'
  | 'memory_search' | 'memory_get';

export interface ToolDefinition {
  name: ToolName;
  description: string;
  category: string;
  availability: 'always' | 'conditional';
  schema: z.ZodType<any>;
  requiresConfirmation?: boolean;
  sideEffects: string[];
  examples: { input: any; output: string }[];
}

// ============================================================================
// Complete Tool Registry (All 21 Tools)
// ============================================================================

export const TOOL_REGISTRY: Record<ToolName, ToolDefinition> = {
  // File Operations
  read: {
    name: 'read',
    description: 'Read file contents (text or images)',
    category: 'filesystem',
    availability: 'always',
    schema: FileReadSchema,
    sideEffects: [],
    examples: [
      { input: { file_path: '/path/to/file.txt' }, output: 'File contents...' },
    ],
  },
  
  write: {
    name: 'write',
    description: 'Create or overwrite files',
    category: 'filesystem',
    availability: 'always',
    schema: FileWriteSchema,
    requiresConfirmation: true,
    sideEffects: ['filesystem_write', 'persistence'],
    examples: [
      { input: { path: 'test.txt', content: 'Hello' }, output: 'File written successfully' },
    ],
  },
  
  edit: {
    name: 'edit',
    description: 'Surgical text replacement in files',
    category: 'filesystem',
    availability: 'always',
    schema: FileEditSchema,
    requiresConfirmation: true,
    sideEffects: ['filesystem_write', 'persistence'],
    examples: [
      { input: { file_path: 'config.ts', oldText: 'DEBUG = true', newText: 'DEBUG = false' }, output: 'Edit applied' },
    ],
  },
  
  // Code Execution
  exec: {
    name: 'exec',
    description: 'Execute shell commands',
    category: 'system',
    availability: 'always',
    schema: ExecSchema,
    requiresConfirmation: true,
    sideEffects: ['process_spawn', 'filesystem', 'network', 'elevation_possible'],
    examples: [
      { input: { command: 'ls -la' }, output: 'drwxr-xr-x ...' },
    ],
  },
  
  process: {
    name: 'process',
    description: 'Manage background processes',
    category: 'system',
    availability: 'always',
    schema: ProcessSchema,
    sideEffects: ['process_control'],
    examples: [
      { input: { action: 'list' }, output: '[{sessionId: "abc", status: "running"}]' },
    ],
  },
  
  // Web Retrieval
  web_search: {
    name: 'web_search',
    description: 'Search web using Brave API',
    category: 'web',
    availability: 'conditional',
    schema: WebSearchSchema,
    sideEffects: ['network_egress', 'external_api'],
    examples: [
      { input: { query: 'fastapi tutorial', count: 5 }, output: '[{title: "...", url: "...", snippet: "..."}]' },
    ],
  },
  
  web_fetch: {
    name: 'web_fetch',
    description: 'Fetch and extract content from URLs',
    category: 'web',
    availability: 'always',
    schema: WebFetchSchema,
    sideEffects: ['network_egress'],
    examples: [
      { input: { url: 'https://example.com', extractMode: 'markdown' }, output: '# Title\nContent...' },
    ],
  },
  
  // Browser
  browser: {
    name: 'browser',
    description: 'Control browser for automation',
    category: 'web',
    availability: 'conditional',
    schema: BrowserSchema,
    sideEffects: ['browser_control', 'network', 'screenshots'],
    examples: [
      { input: { action: 'screenshot', url: 'https://example.com' }, output: '[Image data]' },
    ],
  },
  
  // Presentation
  canvas: {
    name: 'canvas',
    description: 'Canvas presentation and rendering',
    category: 'presentation',
    availability: 'conditional',
    schema: CanvasSchema,
    sideEffects: ['visual_output'],
    examples: [
      { input: { action: 'present' }, output: 'Canvas displayed' },
    ],
  },
  
  // Messaging
  message: {
    name: 'message',
    description: 'Send messages across channels',
    category: 'communication',
    availability: 'conditional',
    schema: MessageSchema,
    sideEffects: ['external_message', 'channel_dependent'],
    examples: [
      { input: { action: 'send', channel: 'telegram', target: '@user', message: 'Hello' }, output: 'Message sent' },
    ],
  },
  
  // Audio
  tts: {
    name: 'tts',
    description: 'Text to speech conversion',
    category: 'audio',
    availability: 'conditional',
    schema: TTSSchema,
    sideEffects: ['audio_generation'],
    examples: [
      { input: { text: 'Hello world' }, output: '[Audio data]' },
    ],
  },
  
  // Session Management
  agents_list: {
    name: 'agents_list',
    description: 'List available OpenClaw agents',
    category: 'session',
    availability: 'always',
    schema: AgentsListSchema,
    sideEffects: [],
    examples: [
      { input: {}, output: '["agent-1", "agent-2"]' },
    ],
  },
  
  sessions_list: {
    name: 'sessions_list',
    description: 'List active sessions',
    category: 'session',
    availability: 'always',
    schema: SessionsListSchema,
    sideEffects: [],
    examples: [
      { input: { limit: 10 }, output: '[{sessionKey: "...", status: "active"}]' },
    ],
  },
  
  sessions_history: {
    name: 'sessions_history',
    description: 'Fetch session message history',
    category: 'session',
    availability: 'always',
    schema: SessionsHistorySchema,
    sideEffects: [],
    examples: [
      { input: { sessionKey: 'abc123', limit: 50 }, output: '[{role: "user", content: "..."}]' },
    ],
  },
  
  sessions_send: {
    name: 'sessions_send',
    description: 'Send message to another session',
    category: 'session',
    availability: 'always',
    schema: SessionsSendSchema,
    sideEffects: ['session_messaging'],
    examples: [
      { input: { message: 'Hello', sessionKey: 'abc123' }, output: 'Sent' },
    ],
  },
  
  subagents: {
    name: 'subagents',
    description: 'Manage subagent processes',
    category: 'session',
    availability: 'always',
    schema: SubagentsSchema,
    sideEffects: ['process_control'],
    examples: [
      { input: { action: 'list' }, output: '[{id: "sub-1", status: "running"}]' },
    ],
  },
  
  sessions_spawn: {
    name: 'sessions_spawn',
    description: 'Spawn new subagent or ACP session',
    category: 'session',
    availability: 'always',
    schema: SessionsSpawnSchema,
    sideEffects: ['session_creation', 'resource_allocation'],
    examples: [
      { input: { task: 'Analyze code', runtime: 'subagent' }, output: '{sessionId: "new-session"}' },
    ],
  },
  
  sessions_yield: {
    name: 'sessions_yield',
    description: 'End current turn',
    category: 'session',
    availability: 'always',
    schema: SessionsYieldSchema,
    sideEffects: ['control_yield'],
    examples: [
      { input: {}, output: 'Yielded' },
    ],
  },
  
  session_status: {
    name: 'session_status',
    description: 'Get session status and metrics',
    category: 'session',
    availability: 'always',
    schema: SessionStatusSchema,
    sideEffects: [],
    examples: [
      { input: {}, output: '{usage: {...}, time: {...}, cost: {...}}' },
    ],
  },
  
  // Memory
  memory_search: {
    name: 'memory_search',
    description: 'Semantic search across memory files',
    category: 'memory',
    availability: 'conditional',
    schema: MemorySearchSchema,
    sideEffects: [],
    examples: [
      { input: { query: 'authentication decision' }, output: '[{path: "...", content: "...", score: 0.95}]' },
    ],
  },
  
  memory_get: {
    name: 'memory_get',
    description: 'Read specific lines from memory',
    category: 'memory',
    availability: 'conditional',
    schema: MemoryGetSchema,
    sideEffects: [],
    examples: [
      { input: { path: 'MEMORY.md', from: 10, lines: 20 }, output: 'Lines 10-30 content...' },
    ],
  },
};

// ============================================================================
// Tool Categories for UI Organization
// ============================================================================

export const TOOL_CATEGORIES = {
  filesystem: ['read', 'write', 'edit'],
  system: ['exec', 'process'],
  web: ['web_search', 'web_fetch', 'browser'],
  presentation: ['canvas'],
  communication: ['message'],
  audio: ['tts'],
  session: ['agents_list', 'sessions_list', 'sessions_history', 'sessions_send', 'subagents', 'sessions_spawn', 'sessions_yield', 'session_status'],
  memory: ['memory_search', 'memory_get'],
} as const;

// ============================================================================
// Tool Helpers
// ============================================================================

export function getToolDefinition(name: ToolName): ToolDefinition {
  return TOOL_REGISTRY[name];
}

export function getToolsByCategory(category: keyof typeof TOOL_CATEGORIES): ToolDefinition[] {
  const names = TOOL_CATEGORIES[category];
  return names.map(name => TOOL_REGISTRY[name]);
}

export function validateToolInput(name: ToolName, input: unknown): { success: boolean; errors?: string[] } {
  const tool = TOOL_REGISTRY[name];
  const result = tool.schema.safeParse(input);
  
  if (result.success) {
    return { success: true };
  } else {
    return { 
      success: false, 
      errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
    };
  }
}

export const ALWAYS_AVAILABLE_TOOLS: ToolName[] = Object.entries(TOOL_REGISTRY)
  .filter(([, def]) => def.availability === 'always')
  .map(([name]) => name as ToolName);

export const CONDITIONAL_TOOLS: ToolName[] = Object.entries(TOOL_REGISTRY)
  .filter(([, def]) => def.availability === 'conditional')
  .map(([name]) => name as ToolName);
