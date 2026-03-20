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

## Requirements

- **Runtime**: Bun ≥ 1.0.0
- **OS**: Linux, macOS, Windows (WSL)
- **Terminal**: Any terminal with Unicode support

## License

MIT
