# Types

TypeScript type definitions organized by functional domain.

## Files

### `mcp.ts`

MCP protocol types:
- `PrimitiveType`, `PrimitiveValue`, `Primitive` — MCP server response structures
- `Tool` — Tool definition for UI display
- `ToolCallCallback`, `ConnectionStatusCallback` — Operation callbacks
- `ToolCallRequest` — Request tracking
- `BackgroundCommunication` — Background script interface

### `stores.ts`

Shared domain shapes used by the Zustand stores:
- `ConnectionType`, `ServerConfig`, and the five-state `ConnectionStatus` union
- tool detection, execution, and delivery state
- sidebar, user-preference, and notification data

The Zustand store state/action interfaces themselves live beside their implementations in `stores/*.store.ts`; do not duplicate their inventories here.

### `messages.ts`

Chrome extension message types:
- `BaseMessage` — Common message structure
- `RequestMessage`, `ResponseMessage` — Request/response patterns
- `McpMessageType` — MCP message type union
- `CallToolRequest`, `GetToolsRequest` — Specific request types
- Broadcast types (`ConnectionStatusChangedBroadcast`, `ToolUpdateBroadcast`)

**Current contract debt:** do not infer the live wire shape from `McpMessageMap` alone. The source
re-audit recorded response-wrapper drift for `mcp:call-tool`, `mcp:get-tools`, and
`mcp:get-server-config`, plus a `mcp:tool-update` producer/consumer payload mismatch. Inspect the
background producer and content consumer together and use `docs/qualification/issue-coverage-ledger.md`
until the executable contracts are aligned.

### Plugin Types

Re-exported by `plugins.ts` from `../plugins/plugin-types`:
- `AdapterPlugin` — Plugin contract
- `AdapterConfig` — Configuration schema
- `PluginContext` — Runtime context
- `AdapterCapability` — Capability definitions
- `PluginRegistration` — Registry structure

### Event Types

Re-exported by `events.ts` from `../events/event-types`:
- `EventMap` — Event name to payload mapping
- `TypedEventCallback` — Typed callback
- `WildcardEventCallback` — Wildcard callback
- `UnsubscribeFunction` — Cleanup function

## Usage

```typescript
import type { Tool, Primitive } from './mcp';
import type { ConnectionStatus } from './stores';
import type { BaseMessage, CallToolRequest } from './messages';
```

## Adding Types

- Keep types in the appropriate domain file
- Use `interface` for extendable shapes, `type` for unions/intersections
- Export all public types
- Avoid `any` — use `unknown` and narrow with type guards
