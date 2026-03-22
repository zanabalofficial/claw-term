# ClawTerm - Terminal AI Agent

A standalone terminal AI agent clone with full-screen Ink.js TUI, providing exact tool parity with the OpenClaw ecosystem.

![ClawTerm Screenshot](docs/screenshot.png)

## Features

### TUI UX Parity
- ✅ **Conversation viewport** with role styling (user/assistant/system/tool-call/tool-result/error)
- ✅ **Streaming output** with incremental rendering and thinking indicators
- ✅ **Input composer** with multi-line editing, history navigation, and keybindings
- ✅ **Markdown rendering** for code blocks, lists, and formatting
- ✅ **Session controls** - new chat, save/load transcripts
- ✅ **Tool UX** - visual affordances for tool calls and results

### Tool/Capability Parity (All 21 Tools)
1. **File Operations**: `read`, `write`, `edit`
2. **Code Execution**: `exec`, `process`
3. **Web Retrieval**: `web_search`, `web_fetch`
4. **Browser**: `browser`
5. **Presentation**: `canvas`
6. **Messaging**: `message`
7. **Audio**: `tts`
8. **Session Management**: `agents_list`, `sessions_list`, `sessions_history`, `sessions_send`, `subagents`, `sessions_spawn`, `sessions_yield`, `session_status`
9. **Memory**: `memory_search`, `memory_get`

## Installation

```bash
# Clone repository
git clone https://github.com/zanabalofficial/claw-term.git
cd claw-term

# Install dependencies
bun install

# Build
bun run build

# Run
bun run start
```

## Quick Start

```bash
# Start interactive session
claw

# With initial message
claw "Hello, what can you do?"

# With specific provider
claw --provider openai --model gpt-4

# Configuration
claw config --init  # Create .clawrc.yaml
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Submit message |
| `Tab` | Insert newline (multi-line) |
| `Shift+Tab` | Submit (multi-line) |
| `Ctrl+Enter` | Force submit |
| `↑/↓` | Navigate history |
| `Ctrl+R` | Reverse search history |
| `Ctrl+A` | Beginning of input |
| `Ctrl+E` | End of input |
| `Ctrl+K` | Kill to end of line |
| `Ctrl+U` | Kill entire line |
| `Ctrl+W` | Kill word backward |
| `Ctrl+T` | Toggle tool panel |
| `Ctrl+H` | Toggle help |
| `Ctrl+C` | Cancel stream / Exit |
| `Ctrl+L` | Clear screen |

## Configuration

### Environment Variables
```bash
export CLAW_PROVIDER=openai
export CLAW_MODEL=gpt-4
export OPENAI_API_KEY=your-key
export CLAW_WORKSPACE=/path/to/workspace
export CLAW_TOOLS_ENABLED=true
```

### Config File (.clawrc.yaml)
```yaml
workspace: /home/user/projects
provider: openai
model: gpt-4
apiKey: ${OPENAI_API_KEY}
toolsEnabled: true
streamingEnabled: true
theme: dark
showTimestamps: true
multilineInput: false
historySize: 1000
historyFile: ~/.claw_history
toolConfirmations: true
maxParallelTools: 5
memoryEnabled: true
memoryPath: ~/.claw_memory
```

## Architecture

```
claw-term/
├── src/
│   ├── cli.tsx              # CLI entry point
│   ├── ui/                  # Ink.js components
│   │   ├── App.tsx          # Main app component
│   │   ├── MessageList.tsx  # Conversation viewport
│   │   ├── InputComposer.tsx # Text input with editing
│   │   ├── StatusBar.tsx    # Bottom status bar
│   │   └── ToolPanel.tsx    # Tool inspector panel
│   ├── core/                # Core logic
│   │   ├── SessionManager.ts
│   │   ├── ConfigManager.ts
│   │   └── HistoryManager.ts
│   ├── tools/               # Tool implementations
│   │   ├── registry.ts      # All 21 tool definitions
│   │   ├── filesystem.ts    # read, write, edit
│   │   ├── system.ts        # exec, process
│   │   ├── web.ts           # web_search, web_fetch
│   │   ├── browser.ts       # browser automation
│   │   ├── session.ts       # session management
│   │   └── memory.ts        # memory search/get
│   ├── hooks/               # React hooks
│   │   ├── useStreaming.ts
│   │   └── useToolExecution.ts
│   └── providers/           # AI provider adapters
│       ├── openai.ts
│       ├── anthropic.ts
│       └── local.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Adding Custom Tools

```typescript
// src/tools/custom.ts
import { z } from 'zod';
import { registerTool } from './registry';

const MyToolSchema = z.object({
  param: z.string(),
});

registerTool({
  name: 'my_tool',
  description: 'My custom tool',
  category: 'custom',
  availability: 'always',
  schema: MyToolSchema,
  async execute(input) {
    // Tool implementation
    return result;
  },
});
```

## Provider Adapters

The provider adapter pattern allows swapping AI backends without changing UI or tool semantics:

```typescript
interface ProviderAdapter {
  streamResponse(
    messages: Message[],
    config: Config,
    callbacks: StreamCallbacks
  ): Promise<void>;
  
  supportsTools: boolean;
  supportsStreaming: boolean;
}
```

## Development

```bash
# Watch mode
bun run dev

# Type check
bun run typecheck

# Lint
bun run lint

# Test
bun test
```

## Advanced Features (10 Built-in)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Multi-Modal** | Image rendering (kitty/iterm/sixel), OCR, audio transcription |
| 2 | **Agent Swarm** | Coordinator + worker agents, task distribution, consensus |
| 3 | **Local LLM** | llama.cpp integration, model downloads, local inference |
| 4 | **Code Analysis** | AST parsing, dependency graphs, security scanning |
| 5 | **Git Integration** | Native git ops, blame, diff, stash, PR review |
| 6 | **Remote Dev** | SSH connections, container management, port forwarding |
| 7 | **Knowledge Graph** | Graph DB of code relationships, pathfinding, DOT export |
| 8 | **Auto Testing** | Test generation, coverage analysis, Jest/Vitest/Bun |
| 9 | **Profiling** | CPU/memory profiling, flame graphs, benchmarks |
| 10 | **NL Shell** | Natural language → bash with safety validation |

## OpenClaw Ecosystem Integration

### MCP (Model Context Protocol)
Connect to MCP servers for extended capabilities:

```typescript
import { MCPClient } from 'claw-term';

const mcp = new MCPClient();

// Connect to stdio server
await mcp.connect('linear', {
  type: 'stdio',
  command: 'npx',
  args: ['-y', '@linear/sdk/mcp'],
});

// Connect to HTTP server
await mcp.connect('custom', {
  type: 'http',
  url: 'https://api.example.com/mcp',
});

// Use tools
const result = await mcp.callTool('linear', 'list_issues', { limit: 10 });
```

### Skills System
Load and execute OpenClaw/AgentSkills:

```typescript
import { SkillManager } from 'claw-term';

const skills = new SkillManager('./skills');
await skills.loadSkills();

// Execute skill script
const result = await skills.executeScript('pdf-editor', 'rotate.py', ['doc.pdf']);

// Read reference
const guide = skills.readReference('bigquery', 'schema.md');
```

### AgentWorld Bridge
Connect to AgentWorld and ClawdChat:

```typescript
import { OpenClawBridge } from 'claw-term';

const bridge = new OpenClawBridge();

// Connect to AgentWorld
bridge.connectAgentWorld({
  apiUrl: 'https://agentworld.example.com',
  apiKey: 'your-key',
});

// Connect to ClawdChat
bridge.connectClawdChat({
  relayUrl: 'wss://relay.clawd.chat',
  did: 'did:key:z123...',
  privateKey: '...',
});

// List agents
const agents = await bridge.listAgents();

// Send A2A message
await bridge.sendA2A('did:key:z456...', 'Hello from ClawTerm!');

// Subscribe to world events
bridge.subscribeToWorld((msg) => {
  console.log('World event:', msg);
});
```

### Full Ecosystem Example

```typescript
// Complete integration example
import { 
  MCPClient, 
  SkillManager, 
  OpenClawBridge,
  AgentSwarm,
  KnowledgeGraph 
} from 'claw-term';

// Initialize all components
const mcp = new MCPClient();
const skills = new SkillManager();
const bridge = new OpenClawBridge();
const swarm = new AgentSwarm();
const graph = new KnowledgeGraph();

// Connect to OpenClaw services
await Promise.all([
  mcp.connect('github', { type: 'stdio', command: 'npx', args: ['-y', '@github/mcp'] }),
  skills.loadSkills(),
  bridge.connectAgentWorld({ apiUrl: process.env.AGENTWORLD_URL! }),
]);

// Register ClawTerm as an agent in AgentWorld
await bridge.registerAsSkill({
  name: 'claw-term',
  description: 'Terminal AI agent with full OpenClaw tool parity',
  version: '2.0.0',
  tools: ['read', 'write', 'edit', 'exec', 'web_search', 'browser'],
});

// Deploy swarm to AgentWorld
await swarm.deployToAgentWorld(bridge, {
  coordinator: true,
  workers: 5,
});
```

## Configuration - OpenClaw Section

```yaml
# .clawrc.yaml

# MCP Servers
mcp:
  servers:
    linear:
      type: stdio
      command: npx
      args: ['-y', '@linear/sdk/mcp']
    custom:
      type: http
      url: https://api.example.com/mcp
      headers:
        Authorization: Bearer ${API_TOKEN}

# Skills
skills:
  directory: ./skills
  autoLoad: true
  preloaded:
    - pdf-editor
    - bigquery

# OpenClaw Bridge
openclaw:
  agentworld:
    url: https://agentworld.example.com
    apiKey: ${AGENTWORLD_KEY}
  clawdchat:
    relay: wss://relay.clawd.chat
    did: ${DID}
    privateKey: ${PRIVATE_KEY}
```

## Requirements

- **Runtime**: Bun ≥ 1.0.0
- **OS**: Linux, macOS, Windows (WSL)
- **Terminal**: Any terminal with Unicode support
- **Optional**: llama.cpp (for local LLM), Docker (for remote dev)

## License

MIT
