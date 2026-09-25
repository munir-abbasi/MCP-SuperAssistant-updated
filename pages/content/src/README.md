# Content Script Source

Root source directory for the MCP SuperAssistant content script.

## Architecture

Event-driven system responsible for:
- Interacting with AI platform web pages
- Managing injected UI components
- Executing MCP tools via site-specific adapters
- Maintaining application state
- Communicating with the background script

## Directory Structure

```
src/
├── index.ts              Entry point + message handler
├── initializer.ts        Legacy wrapper (delegates to main-initializer)
├── core/                 Initialization orchestrator + architectural services
├── stores/               Zustand state management
├── events/               Typed event bus
├── hooks/                React hooks for component integration
├── plugins/              Adapter system (plugin registry + adapters)
│   └── adapters/         Site-specific adapter implementations
├── components/           React UI components
│   ├── sidebar/          Main sidebar interface
│   ├── mcpPopover/       Tool execution popover
│   └── websites/         Site-specific component overrides
├── render_prescript/     JSONL function call detection + rendering
├── services/             Automation and background services
├── utils/                Helper functions
├── types/                TypeScript definitions
└── lib/                  Shared library code
```

## Key Files

| File | Purpose |
|------|---------|
| `index.ts` | Entry point, message handling, renderer setup |
| `initializer.ts` | Legacy wrapper → `core/main-initializer.ts` |
| `core/main-initializer.ts` | Application initialization orchestrator |
| `events/event-bus.ts` | Typed pub/sub event system |
| `stores/index.ts` | Zustand store exports |
| `hooks/index.ts` | React hook exports |
| `plugins/plugin-registry.ts` | Adapter lifecycle management |

## Communication

Three channels:
1. **Content ↔ Background** — Chrome runtime messages
2. **Background MCP client ↔ MCP Server** — Via transport plugins; content requests pass through runtime messaging
3. **Internal** — Typed event bus
