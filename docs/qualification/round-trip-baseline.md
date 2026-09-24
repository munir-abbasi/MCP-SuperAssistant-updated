# Round-Trip Baseline — Stage 0

> **Evidence class: static trace.** Every claim below was verified by reading the cited
> implementation on the working tree (HEAD `be60d93` + working changes). No live browser,
> live MCP server, or runtime capture was used. Per the fork's qualification rules, this
> establishes code-path facts, not live-site behavior. The DIAGNOSIS.md Stage 0 acceptance
> criterion ("distinguish fixture evidence from live-site evidence") requires a live
> observation to complete; the live column below records what must be captured.

## Environment

| Field | Value |
|---|---|
| Revision | `be60d93` (docs and cleanup) + working-tree changes |
| Node / pnpm | v24.12.0 / 9.15.1 (matches `.nvmrc` and `package.json` engines) |
| Type-check | `pnpm type-check` — 11/11 packages pass (after fixing three latent errors surfaced by this gate, see "Gate repairs") |
| Chrome build | `pnpm build` — 12/12 turbo tasks pass; MV3 manifest at `dist/manifest.json` |
| Firefox build | `pnpm build:firefox` — 12/12 turbo tasks pass |
| Node regression suite | `pnpm --filter chrome-extension test` — 10/10 pass (state machine, discovery state, schema validator, streamable-http framing) |
| Live browser verification | **not performed** (this pass) |

## The traced path (manual RUN click)

| # | Hop | File | What crosses | Identity present |
|---|---|---|---|---|
| 1 | Renderer builds card | `render_prescript/src/renderer/components.ts` (`addExecuteButton` area, ~L593–815) | `callId` assigned; stored as `data-call-id` attr | **`callId`** (content-side, per-card) |
| 2 | RUN click → client | `components.ts` L730: `const mcpClient = (window as any).mcpClient` → L756 `callTool(functionName, parameters)` | tool name + args only | `callId` **not passed**; `window.mcpClient` is the content singleton (`core/mcp-client.ts` L726), set at `index.ts` L320/L664 |
| 3 | Content client wrapper | `core/mcp-client.ts` `callTool()` (~L374) | `contextBridge.sendMessage('background','mcp:call-tool',{toolName,args,adapterName},{timeout:30000})` | **`executionId`** = `useToolStore.startToolExecution()` — generated here, recorded in tool store, emitted in `tool:execution-completed`/`tool:execution-failed` |
| 4 | Chrome message | `types/messages.ts` `createRequestMessage()` | `{ toolName, args, adapterName }` payload | `id` = `msg_<ts>_<rand>` on the envelope; response carries it back (`createResponseMessage` echoes `originalMessage.id`) |
| 5 | Background handler | `background/index.ts` L659: destructures `{ toolName, args, adapterName }` → `callToolWithBackwardsCompatibility(getServerUrl(), toolName, args, adapterName)` | forwards name/args/adapter | **message `id` dropped** — `result` is returned as bare payload; no correlation id threaded |
| 6 | Compat wrapper | `mcpclient/index.ts` L167 `callToolWithBackwardsCompatibility()` → `client.callTool(toolName, args, adapterName, signal)` | same | — |
| 7 | MCP client | `mcpclient/core/McpClient.ts` L381: `const callId = crypto.randomUUID()` | JSON-RPC over transport | **`callId` (background-side)** — local only, used for abort bookkeeping (`activeCalls` map), never returned to the caller, never correlated with hop 3 |
| 8 | Result return | same chain reversed | result object | bare payload; no identity |
| 9 | Completion event (content) | `core/mcp-client.ts` → `eventBus.emit('tool:execution-completed', { execution })` | execution record | carries `executionId` (hop 3) — but the renderer does **not** listen on the event bus; see hop 10 |
| 10 | Renderer learns result | `components.ts` L756 `await` resolution in the click handler | displayResult() | continuation is positional (the awaiting closure), not identity-based |
| 11 | Delivery trigger | `displayResult()` → `document.dispatchEvent(new CustomEvent('mcp:tool-execution-complete', { detail }))` | result text | **identity depends on path**: text-insert path detail has NO `callId`/`functionName` (L1719–1730); file-attach path DOES carry `callId` + `functionName` (L1050ff detail) |
| 12 | Automation service | `services/automation.service.ts` listens on the DOM event | insert → submit via adapter | `ToolExecutionCompleteDetail.callId` is optional; on the text path it is `undefined` |
| 13 | Adapter execution | adapter `insertText()` / `submitForm()` → booleans | page DOM | no receipt; outcome is a boolean, not persisted |

## Checkpoint ladder coverage (vocabulary per SYSTEM.md)

| Checkpoint | Observable today? | Where | Notes |
|---|---|---|---|
| C1 detect | yes | parser (`render_prescript/src/parser/`) | — |
| C2 render | yes | `components.ts` card + RUN button | — |
| C3 execute | yes, locally | hop 7; content `executionId` (hop 3) and background `callId` (hop 7) are **two uncorrelated identities** | no single id spans content→background |
| C4 receive | yes, locally | hop 8–10 | only positional continuation; no receipt |
| C5 deliver | partial | hop 11–12 | boolean from adapter; text path drops identity |
| C6 submit | partial | hop 12–13 | boolean; no persistence |
| C7 consumed | **no** | — | outside extension observation boundary (per SYSTEM.md) |

## Confirmed findings (static)

1. **Gap 1 confirmed at code level:** three identity systems coexist on one round trip —
   content `executionId` (tool store), chrome-message envelope `id`, background `callId`
   (`crypto.randomUUID()`) — and none is threaded end to end. The renderer↔automation
   handoff additionally drops even the renderer's own `callId` on the text-insert path.
2. **The completion event has two inconsistent shapes.** File-attachment dispatches carry
   `callId`/`functionName`; text-insert dispatches do not. Any Stage 1 contract must unify
   these producers (multiple dispatch sites in `components.ts`, plus legacy
   `insertTextIntoInput` fallbacks).
3. **Background response is uncorrelated:** `handleMcpMessage` returns bare `result`
   payloads; the message envelope `id` is generated at hop 4 and echoed in the response
   envelope but never mapped to an operation.
4. **Renderer↔content decoupling:** the renderer does not consume the typed event bus
   (`tool:execution-completed`); it uses the `window.mcpClient` global and positional
   awaits. Any identity threading must cross this seam deliberately.
5. **History is display-grade, not receipt-grade:** `mcpexecute/storage.ts` records
   `functionName/callId/contentSignature/executedAt/params` keyed by URL — useful for
   dedupe/history UI, but it proves nothing about server effects or delivery (matches the
   runtime operation contract's warning).

## Gate repairs made while establishing this baseline

The build gate surfaced three latent type errors that had never been exercised because
turbo stopped at the first failing package (`test-mcp-fixture`):

| File | Error | Fix |
|---|---|---|
| `packages/test-mcp-fixture/package.json` | TS2688/TS6053 — extends `@extension/tsconfig/module` without declaring `@extension/tsconfig` (pnpm strict isolation) | added `"@extension/tsconfig": "workspace:*"` devDependency; lockfile resynced (`--no-frozen-lockfile`; pre-existing drift: lockfile still listed removed `firebase`) |
| `chrome-extension/src/mcpclient/index.ts` | TS2304 — `ClientConfig`/`TransportType` used in signatures but never imported (re-exports don't bind) | added local `import type` lines |
| `chrome-extension/src/mcpclient/core/McpClient.ts` | TS2367 — state comparison after `await` flagged as no-overlap | added private `getConnectionState()` accessor (method calls are never narrowed) and read through it |
| `pages/content/src/.../streamObserver.ts`, `themeDetector.ts` | TS2488/TS2322 — NodeList iteration + `number` timer type | `Array.from(...)` at 5 iteration sites; `ReturnType<typeof setTimeout>` (matches `mutationObserver.ts` convention) |
| `pages/content/.../functionBlock.ts`, `functionResultObserver.ts` | TS2488 — NodeList iteration | `Array.from(...)` |

## What Stage 1 must decide (inputs recorded for the plan)

- One identity to thread: content `executionId` is the natural candidate (already flows
  through tool store + typed events); the chrome-envelope `id` is per-message, not
  per-operation; the background `callId` is transport-scoped.
- Producers to unify: every `mcp:tool-execution-complete` dispatch site in
  `components.ts` (text, file, legacy fallbacks) plus `functionHistory.ts` re-execution.
- Consumers to preserve: `automation.service.ts` (optional `callId` today), tool store,
  and any UI reading `executionHistory`.
- Destination binding: hops 11–13 currently have no conversation/destination identity at
  all; Stage 1's acceptance criterion (navigation during delay prevents wrong-destination
  insertion) has nothing to bind to yet — this is the first design decision, not a detail.
