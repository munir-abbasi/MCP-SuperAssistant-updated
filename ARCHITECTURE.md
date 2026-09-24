# Architecture — MCP SuperAssistant

> Detailed component relationships, data flow, and integration points.
> Read `SYSTEM.md` for the high-level overview; this is the deep reference.

## Behavior Ownership Map

Use this map to localize a task before editing. It is the human-readable forward-routing projection of `docs/agent-control-map.yaml`, the topology source of truth. The "owner" is the first control surface to inspect; adjacent layers are evidence only until the observed flow proves the behavior crosses that boundary.

| Behavior / symptom | Owning control surface | Observe first | Verification dimension |
|---|---|---|---|
| AI-site DOM insertion, submit, attachment, selector breakage | Site adapter | Matching adapter + live DOM/adapter contract | Site/platform |
| JSONL detection, parsing, tool-card rendering | `render_prescript/` | Observer → parser → renderer path | Renderer + affected site |
| Content initialization, local orchestration | `core/main-initializer.ts`, `index.ts` | Actual call order and emitted events | Content lifecycle |
| Application/UI state | Zustand store that owns the state | Store actions + event subscriptions | State/event contract |
| Cross-component content communication | Typed event bus | Event type + emitter + listeners | Event contract |
| Cross-tab/server connection lifecycle | Background service worker | Message handler + connection state transitions | Browser/background lifecycle |
| MCP protocol, discovery, tool invocation | `McpClient.ts` | Request/response path + regression evidence | Protocol |
| Transport behavior | Selected transport plugin | Explicit `connectionType` selection + plugin implementation | Transport |
| Shared message/type contract | `packages/shared/` or owning shared type | Producer and consumer together | Contract/type-check |
| Repository toolchain/config behavior | Repository tooling boundary | Relevant root config (`.nvmrc`, TypeScript/lint/format/ignore config) + resolved command behavior | Repository tooling |
| Regression/E2E fixture or harness behavior | Verification infrastructure | Owning test/fixture source + the evidence claim that consumes it | Test/fixture contract |
| Browser packaging/manifest behavior | Extension build/config | Generated manifest/output for each affected target | Browser/artifact |

### Boundary Rule

Trace from trigger to effect and stop at the first boundary that can fully explain the symptom. Change that owner first. Cross a second boundary only when direct evidence shows the contract between the two is wrong. This prevents fixes from spreading across layers merely because several layers participate in the same end-to-end flow.

## Bidirectional Control Graph

Forward routing answers “where does this symptom belong?” Maintenance also needs the inverse question: “what can this changed surface invalidate?” `docs/agent-control-map.yaml` provides both traversals without storing runtime state:

```text
behavior/symptom → owning boundary → primary evidence surface
changed path → boundary → matching typed interfaces + invariants
             → evidence families + verification dimensions
             → documentation owner
```

Each stable boundary ID records owned path globs, behaviors, referenced system invariants, observability surfaces, verification dimensions, documentation owners, and qualification evidence families. Each cross-boundary seam is recorded once as interface-topology metadata with an owner, participants, and `impact_when` trigger. The YAML's short `contract` text is a routing label, not a copy of the executable TypeScript/serialization contract. Interface membership identifies the smallest plausible impact set; implementation call sites and executable contracts still decide whether a specific interface is active for the change.

### Reverse-impact procedure

1. Resolve every changed path with the map's documentation-first, most-specific-path rules. A documentation override, unmatched path, or equally specific runtime match must be surfaced explicitly; do not guess.
2. Inspect the owning implementation and only the typed interfaces whose `impact_when` condition the actual change can trigger.
3. Collect referenced invariants, evidence families, and verification dimensions into the Situation Packet's `Impact` field.
4. Mark an Evidence Receipt stale or narrow its claim only when that receipt's `invalidates_on` condition fired. Interface membership alone does not invalidate evidence.
5. Select the cheapest verification that can falsify the affected claim. Interface membership never requires a full suite by itself.
6. After verification, update one authoritative documentation/evidence home; elsewhere link instead of copying.

The graph is topology canon, not behavior or qualification canon. Implementation and executable contracts determine current behavior; `docs/qualification/` determines demonstrated scope. The human tables in this document are projections. Until Stage 7 provides mechanical checking, edits to boundary topology must update the YAML and this explanation in the same change.

## Observability Map

What an agent can actually observe, verified against the current implementation. Prefer these surfaces before adding instrumentation; do not assume a proposed contract surface exists.

**Debug globals — dev builds only.** Their absence in a packaged build is expected, not a defect.

| Surface | Exposed by | Contains | Notes |
|---|---|---|---|
| `window._appDebug.stores.{app,connection,tool,ui,adapter}` | `core/main-initializer.ts` (dev only) | Live Zustand store APIs (`getState()`) | `config` store is absent from this exposure |
| `window._appDebug.services.{globalErrorHandler,performanceMonitor,circuitBreaker,contextBridge}` | same | Service instances and stats | |
| `window._appDebug.getStats()` | same | Combined perf/error/circuit-breaker stats | |
| `window.__pluginSystem.getRegistry()` | `plugins/index.ts` (dev only) | Plugin registry (`getDebugInfo()`, `getActivePlugin()`) | |
| `window.__mcpAutomationState` | `services/automation.service.ts` | Current automation toggles for render_prescript | Refreshed on each completion event |
| `window.__automationService` | `services/automation.service.ts` (dev only) | Test triggers for insert/submit/file; delivery receipts (`listDeliveryReceipts`/`getDeliveryReceipt`), bounded delivery retry (`retryDelivery(callId)`, `MAX_RETRY_ATTEMPTS`), unified operation observation (`observeOperations()`/`formatOperations()`) | Observation derives per-callId execution/attempt IDs, status, C3–C6 states, uncertainty, blocker, and an **advisory** `nextAction` string from the tool store + receipts; ambiguous dispatch stays C3 unknown and routes to reconcile/`stop`, but the string is not formal action admission |
| `document` event `mcp:tool-execution-complete` | renderer `components.ts` | Result payload + `callId`/`functionName` when provided | The delivery trigger; consumed by automation service |
| Event bus (`event-types.ts` EventMap) | content script | Typed lifecycle events (`tool:*`, `connection:*`, `adapter:*`, …) | Dev-only wildcard listener available |

**Always-available, non-console surfaces**

| Surface | Notes |
|---|---|
| `chrome-extension/tests/*.test.ts` (`pnpm --filter chrome-extension test`) | Node `node:test` regression suite; runs without a browser |
| `packages/e2e/tests/discovery.spec.ts` | Playwright; needs built artifact + browsers installed |
| `docs/qualification/*` | Dated qualification and issue-coverage evidence (including the Stage 10 ergonomics benchmark) |
| `localStorage['mcp_delivery_receipts']` (content-script origin) | Bounded delivery receipts (30-min TTL, ≤20, text-only); survive reloads — read when the in-memory tool store has lost an execution record |
| Service-worker console at `chrome://extensions` | Background-side logs and lifecycle |

**How to use the observability map — the lookup path**

The observability map is the runtime half of the runtime↔knowledge isomorphism. When you have a runtime symptom, the first path should be deterministic: symptom → ownership map → owning boundary → smallest relevant observability surface. A boundary may expose more than one scoped surface when different claims require different evidence. If no deterministic first route exists, or the named surface is insufficient and the topology gives no scoped escalation path, that is a tower defect — record it rather than beginning with broad log reconstruction.

For a maintenance task, you usually need the implementation surface plus one evidence surface. For a runtime diagnosis, you usually need the observability hook plus the receipts. The map tells you which is which. Do not start by reading all surfaces; start by reading the one the owner names, then expand only when the first surface cannot resolve the decision.

### Current implementation constraints

This architecture document does not own defect history or qualification status. The current issue ledger records scoped evidence for repaired and open operation/control findings, including hidden `mcp:call-tool` redispatch, dispatch-attempt/C3 observation, C5/C6 checkpoint monotonicity, and message producer/consumer drift. The historical per-hop trace remains in `docs/qualification/round-trip-baseline.md`. Read those evidence objects only when the active decision depends on their disposition.

## Runtime Operation Contract

**Status: partially implemented at code level.** Identity threading now distinguishes logical operations from concrete dispatch attempts; retained-result delivery recovery, bounded delivery retry, hard single-dispatch tool messaging, conservative C3 observation, independent C5/C6 evidence for submit-failure recovery, same-input page-mutation serialization, and adapter-owned text-insertion page verification exist at source/node-test level. Formal effect-class/action admission remains unresolved, and live-browser qualification of delivery verification/serialization remains pending. The contract below remains the governing target; `DIAGNOSIS.md` and the issue ledger own implementation/qualification status. Keep one owner for each fact and derive the agent/UI view from those owners; do not introduce another independently mutable global store.

### The operation as the unit of agent reasoning

The runtime operation contract is not a contract about components. It is a contract about ONE operation and the seven facets that describe it. Every component in the system supplies authoritative facts to one or more facets of some operation. An agent driving this system reasons about the operation first, then resolves the narrow source facts needed to answer its question.

This is the fundamental organizational principle of the system. It is what makes the system legible to an agent: instead of reasoning about "the sidebar, the renderer, the MCP client, the background script" as separate things, the agent reasons about "the operation" as one thing with seven agent-facing lenses. Atomic source facts still have one narrow authoritative owner, but a lens may compose several owners. Derived projections must preserve provenance back to those owners.

### Implementation status belongs to evidence

The rules below define the target contract. Whether an element is implemented, partial, open, live-verified, or stale is an evidence question owned by `docs/qualification/issue-coverage-ledger.md` and the active dependency plan in `DIAGNOSIS.md`. Keeping status and source-audit tables out of this contract prevents dated observations from masquerading as architecture.

### Small interface, complete meaning

The intended interface answers three questions: **what is known now, what can be done next, and what changed after the action?** Start with the existing UI/result channel. Do not expose a new remote agent endpoint until a concrete caller needs it.

The key insight: these seven concepts are not seven components. They are seven lenses over ONE operation. The operation is the unit of agent reasoning; each lens resolves to one or more authoritative source facts. An agent should reason about the operation, then follow provenance to the narrow source owner for whichever fact is failing or uncertain.

| Concept | Required meaning | Authoritative source(s) / derivation |
|---|---|---|
| Intent | Tool, validated arguments, authorized scope, intended server and conversation | Existing content execution path captures intent before dispatch |
| Identity | Logical operation distinct from execution attempt; preserve existing call IDs as correlations | Execution path creates identity; background/client preserve it; do not treat content hashes as authorization or server idempotency |
| Preconditions | Selected server/transport, discovery freshness, adapter readiness, current destination and enabled automation | Background/client own connection/discovery; registry/adapter own page readiness; preferences own automation policy |
| Execution receipt | Accepted/in progress/returned/failed/unknown, with evidence and attempt identity | Background/client supplies facts about the server call |
| Delivery receipt | Not requested/pending/inserted/submitted/failed/unknown, bound to the intended destination | Automation path sequences delivery; site adapter supplies observed page evidence |
| Observation | Compact current facts, freshness, last confirmed stage, blocking reason and permitted next actions | Derived projection of the owners above; renderer/UI presents it |
| Outcome | Whether the requested task was satisfied, or what remains unknown | Assistant/user verifies against the goal; extension receipts are evidence, not semantic proof |

**Source ownership plus derived projection is the key organizational rule.** When an agent needs to know "is this tool running?", it asks the operation what checkpoint is confirmed and follows the execution-evidence provenance to the relevant store/client facts. When it needs to know "did the result reach the chat?", it follows delivery-evidence provenance to automation receipts and adapter/page evidence. The agent does not need every component in working memory; it needs the operation lens, the smallest source set that can answer the question, and a deterministic route to those sources.

These labels describe information requirements, not TypeScript identifiers to copy into code. Inspect existing types and consumers before selecting a representation. Keep the five-state connection lifecycle separate from operation progress: one connected server can have several calls with different outcomes.

### Agent Situation Interface

The runtime contract and maintenance workflow project into the same agent-facing **Situation Packet** (`AGENTS.md`). This is not a new mutable global store. It is a normalized view assembled from existing owners so the agent can make one decision without reconstructing the whole system.

| Situation field | Runtime source(s) / derivation | Maintenance source(s) / derivation |
|---|---|---|
| Goal / acceptance | user + current assistant task | user request + explicit evidence of done |
| Scope / authority | current destination, preferences, and effect authorization | repository instructions + user-authorized surfaces/effects |
| Revision / environment identity | extension artifact, browser/site/transport/server/config | git/artifact identity + affected environment dimensions |
| Owner | narrowest boundary controlling the current blocker/decision | Behavior Ownership Map; does not own all packet facts |
| Impact | destination/checkpoint/effect dependencies | control-graph boundaries, invariants, evidence families, and verification dimensions |
| Evidence | execution/delivery receipts + page observation | implementation + focused test/qualification receipt |
| Checkpoint | C1–C6 projection | only when reproducing a live operation |
| Effect class | tool contract / explicit capability metadata when available | inspected tool semantics; otherwise labelled inference/unknown |
| Unknowns | missing checkpoint/effect/destination evidence | uncertainties that can change implementation/verification choice |
| Next action | derived bounded control action | cheapest falsifying read/test/change/reconciliation step |
| Budget | retry/retention/elapsed constraints | task-specific read/test/time scope, when bounded |
| Outcome | strongest evidenced terminal claim | acceptance criteria compared with verification evidence |

The long-term design goal is that a disposable Situation Compiler can derive this projection in one inexpensive inspection from repository identity, diff, the control graph, scoped receipts, configuration, and optional runtime observations. Every compiled field must retain its source/provenance and, where applicable, freshness/certainty so the projection can be challenged without treating the compiler as authority. The agent then expands only the evidence references needed for the selected action. `DIAGNOSIS.md` Stage 7 tracks that work; do not add a remote controller, daemon, or persistence layer merely to satisfy the shape.

#### Derived decision frontier

The Situation Compiler should derive more than a state summary. Its bounded decision frontier contains: open/closed acceptance proof obligations; the smallest current evidence references with certainty/freshness; decision-relevant unknowns paired with their cheapest safe resolver; admitted actions with supporting precondition evidence; blocked actions with the exact missing precondition or unresolved effect; and one selected next action or explicit `stop` reason.

This frontier is a disposable view of the Situation Packet, not another state store or information form. It points to detail rather than embedding logs/source by default, and it never upgrades advisory runtime text into an admitted action without rechecking the governing action contract.

### Transition and recovery rules

1. Bind the operation to its destination before dispatch. Recheck the destination and current authorization immediately before delayed insertion or submission. Navigation, server replacement, or preference changes must invalidate stale actions rather than silently retarget them.
2. Distinguish execution success, tool-reported failure, transport failure, and unknown external effect. A timeout, local abort, or disconnected client does not prove server rollback.
3. Recover delivery from the **first unconfirmed delivery checkpoint**, using retained evidence rather than replaying already confirmed work. If C4 is confirmed and C5 is not, retained-result insertion may be recovered. If C5 is confirmed and C6 fails or remains unknown, preserve C5 and recover/verify submission without inserting the result again. A new MCP execution is a separate attempt and requires a justified retry decision. For unknown external effects, reconcile through server evidence or documented idempotency; otherwise stop dependent actions.
4. An adapter returning `true` is an acknowledgement from that adapter. Claim stronger submission/delivery evidence only if the adapter verifies the corresponding page state. Expose the weaker observation when verification is unavailable.
5. Serialize edits to the same chat input. Independent read-only calls may overlap when their contracts permit it; dependent operations wait for verified prerequisites. No automatic fan-out based solely on available concurrency.
6. Bound automatic retries, elapsed time and retained result size per operation. Stop on exhausted budget, unchanged repeated failure, revoked authorization or changed destination. Numerical defaults require measurement; none are invented here.
7. On restart, restore only evidenced facts. An interrupted in-flight operation is unknown until reconciled. Do not automatically replay it or infer completion from URL history.
8. Before repeating any call after C3, classify its external-effect semantics as `read-only`, `replay-safe`, `reconcilable-write`, or `non-replayable/unknown`. This rule applies to implicit redispatch by lower-level message/transport retry helpers as well as explicit user/agent retry. For the latter two classes, reconciliation is the default next action; blind retry is forbidden when a duplicate effect could matter.
9. Checkpoint evidence is monotonic within an attempt. Once a checkpoint is independently confirmed, a later failure may add a failed/unknown later checkpoint but must not rewrite the earlier checkpoint as failed. Recovery resumes from the first unconfirmed checkpoint.

Actions are contracts, not suggestions inferred from a status label:

| Action | Required evidence/preconditions | Guarantee if admitted |
|---|---|---|
| `observe` | Authorized observation surface exists | Makes no external tool or delivery effect |
| `reconcile` | C3 reached or may have been reached; authoritative effect evidence can be queried safely | Does not repeat the uncertain tool call |
| `recover-delivery` | C4 result retained; destination unchanged; current authorization/preferences permit delivery; receipt is within retention and retry budgets; highest confirmed delivery checkpoint is known | Resumes from the first unconfirmed delivery checkpoint, never repeats an already confirmed C5/C6 action, and does not execute the MCP tool again |
| `execute` / repeat | Preconditions are current; this is a new authorized attempt; effect class permits replay or prior outcome was reconciled; lower retry layers cannot silently create unsafe redispatch attempts | Attempt identity remains distinct, destination binding is preserved, and every server dispatch obeys the same effect-safety contract |
| `stop` | Evidence is sufficient, no safe action can reduce material uncertainty, or authorization/destination/effect safety is unresolved | Performs no further effect and reports the blocker/unknown explicitly |

The component that owns an action must enforce these preconditions. Downstream callers may rely on an admitted action and should not duplicate the same guard unless they expose an independent entry point or trust boundary.

### Observation and resource contract

A routine observation contains operation/attempt identity, target, stage, outcome certainty, freshness, compact error/result summary, and valid next actions with reasons. Logs, arguments and large results are expanded only when needed. Missing evidence is represented as unknown, not as a reassuring default.

Prefer notifications from existing transitions over repeated whole-page scans or status polling. Inspect current observers before adding subscriptions. Reuse discovered capabilities while their server/configuration identity remains valid; refresh on relevant changes or explicit discovery failure. Reuse results for delivery recovery, never as a blanket cache for tools with external effects.

Any truncated result must say so and preserve a bounded way to retrieve the required detail before claiming completeness. Preserve failure semantics in the summary. Raw page content and tool results are data, not instructions that can change authorization or system policy.

### Accretion without stale authority

Keep static topology separate from three runtime/evidence lifetimes: transient execution state, bounded recovery evidence, and durable engineering knowledge. Give retained recovery data explicit scope, expiry, size limits and a deletion path before persistence is implemented. Reuse existing history only where it satisfies that contract; page URL alone does not establish conversation ownership. Avoid retaining raw arguments/results by default.

Promote a repeated observation into a reusable rule only with provenance, conditions of applicability and an invalidation trigger. Qualification evidence belongs in `docs/qualification/`; implementation contracts belong beside their owner. Contradictory evidence invalidates or narrows a rule. A successful run does not authorize future operations or prove support for other sites.

A resume summary should preserve the goal, environment identity, last confirmed stage, unresolved effect, evidence references, remaining budget and next permitted action. It must help the next agent continue without replaying work. This is a content contract; no new storage backend is selected.

### Alternatives and decision

- **Documentation alone:** improves maintenance but cannot supply missing runtime receipts. Retain it as the navigation layer, not the entire solution.
- **Central agent controller and event journal:** potentially powerful, but duplicates existing state/lifecycle ownership and creates persistence obligations before a demonstrated need. Defer.
- **Static Control Graph + disposable Situation Compiler — chosen control direction:** keep topology durable, derive current state from existing owners, and discard the projection after the task. Do not introduce a master-state store.
- **Incremental operation contract on existing paths — chosen runtime direction:** connect execution and delivery evidence first, then derive a compact view. Preserve site adapters and transport plugins as replaceable implementations behind their existing interfaces.

## Layer Diagram with File Paths

```
┌──────────────────────────────────────────────────────────────────────┐
│ Layer 5: UI                                                          │
│ pages/content/src/components/                                        │
│   sidebar/           Main sidebar (connection, tools, settings)      │
│   mcpPopover/        Tool call detection overlay                     │
│   websites/gemini/   Gemini-specific overrides                       │
│   ui/                Shared primitives (buttons, cards, inputs)       │
│ packages/ui/         Reusable components (shadcn/ui base)            │
├──────────────────────────────────────────────────────────────────────┤
│ Layer 4: Plugin System                                               │
│ pages/content/src/plugins/                                           │
│   plugin-registry.ts     Central lifecycle manager                   │
│   plugin-types.ts        TypeScript contracts                         │
│   plugin-context.ts      Factory for plugin contexts                 │
│   base.adapter.ts        Abstract adapter base class                 │
│   adapters/              Site-specific implementations; registry is   │
│                         executable truth for current registration     │
│   sidebar.plugin.ts     Universal sidebar plugin                     │
│   remote-config.plugin.ts Content-side remote-config plugin           │
│   index.ts               Public API exports                          │
├──────────────────────────────────────────────────────────────────────┤
│ Layer 3: Content Script                                              │
│ pages/content/src/                                                   │
│   index.ts                Entry point + message handler               │
│   initializer.ts          Legacy wrapper (delegates to main-init)    │
│   core/                                                               │
│     main-initializer.ts   Initialization orchestrator                 │
│     mcp-client.ts         Content-side MCP client reference           │
│     circuit-breaker.ts    Failure rate monitoring                     │
│     error-handler.ts      Centralized error handling                  │
│     performance.ts        Timing + memory monitoring                  │
│     context-bridge.ts     Chrome extension cross-context messaging    │
│     ui-initializer.ts     React app mounting utilities                │
│   stores/                                                             │
│     app.store.ts          Global lifecycle state                      │
│     connection.store.ts   MCP connection health                       │
│     tool.store.ts         Tool discovery + execution tracking         │
│     adapter.store.ts      Plugin/adapter state                        │
│     ui.store.ts           Sidebar, theme, notifications               │
│     config.store.ts       Remote config + feature flags               │
│   events/                                                             │
│     event-bus.ts          Typed pub/sub event system                  │
│     event-types.ts        Event map definitions                       │
│     event-handlers.ts     Global event listeners                      │
│     event-system.ts       Event system orchestrator                   │
│   hooks/                                                              │
│     useStores.ts          Zustand store hooks                         │
│     useEventBus.ts        Event system hooks                          │
│     useAdapter.ts         Adapter management hooks                    │
│     useShadowDomStyles.ts Shadow DOM style utilities                  │
│   render_prescript/       JSONL function call detection               │
│     src/observer/         DOM mutation observers                      │
│     src/parser/           Function call extraction                    │
│     src/renderer/         Tool call card rendering                    │
├──────────────────────────────────────────────────────────────────────┤
│ Layer 2: MCP Client                                                  │
│ chrome-extension/src/mcpclient/                                       │
│   core/                                                               │
│     McpClient.ts          Main client (connect, callTool, getPrims)  │
│     PluginRegistry.ts     Transport plugin management                 │
│     EventEmitter.ts       Custom event emitter                        │
│     BrowserJsonSchemaValidator.ts  CSP-safe schema validation        │
│   plugins/                                                            │
│     ITransportPlugin.ts   Transport interface contract                │
│     sse/                  Server-Sent Events transport                │
│     websocket/            WebSocket transport                         │
│     streamable-http/      Streamable HTTP transport                   │
│   types/                                                              │
│     config.ts             Client configuration types                  │
│     plugin.ts             Plugin metadata types                       │
│     primitives.ts         Tool/resource/prompt types                  │
│     events.ts             Event type definitions                      │
├──────────────────────────────────────────────────────────────────────┤
│ Layer 1: Background Script                                           │
│ chrome-extension/src/background/index.ts                             │
│   - Service worker lifecycle                                         │
│   - Connection management (retry, backoff, periodic health)          │
│   - Message routing (content ↔ MCP client)                          │
│   - Broadcast to all tabs (status, tools, config)                    │
│   - Install/update handlers                                          │
└──────────────────────────────────────────────────────────────────────┘
```

## Initialization Sequence

The current top-level initialization flow is split between `index.ts` and
`core/main-initializer.ts`:

```
index.ts
  ├─ Initializes the function-call renderer early
  ├─ Calls applicationInit()
  └─ Initializes additional services after applicationInit()

applicationInit() in core/main-initializer.ts
  ├─ Core services
  ├─ Plugin system
  ├─ Sidebar activation
  ├─ Application state
  └─ Analytics
```

`initializeCoreServices()` contains the lower-level setup for the environment,
event bus, core components, global handlers, and stores. The code does not define
a fixed eight-phase architecture.

The plugin registry currently registers site adapter factories lazily. The
`RemoteConfigPlugin` still emits `remote-config:*` messages and config-store
events, but the former Firebase/background handlers are absent from the current
background implementation. Treat it as a content-side plugin, not a functioning
Firebase Remote Config backend integration.

## Event System

### Event Namespaces

| Namespace | Purpose | Key Events |
|-----------|---------|------------|
| `app:*` | Application lifecycle | `initialized`, `shutdown`, `site-changed`, `version-updated` |
| `connection:*` | MCP connection | `status-changed`, `error`, `reconnecting` |
| `tool:*` | Tool operations | `execution-started`, `execution-completed`, `execution-failed` |
| `adapter:*` | Plugin system | `activated`, `deactivated`, `error`, `connection-status-changed` |
| `plugin:*` | Plugin lifecycle | `registered`, `activation-requested` |
| `ui:*` | Interface | `toggle-sidebar`, `show-with-outputs`, `refresh-content` |
| `sidebar:*` | Sidebar control | `toggle-requested`, `show-with-outputs`, `refresh-content` |
| `feature-flags:*` | Remote config | `updated` |
| `remote-config:*` | Config sync | `updated`, `adapter-configs-updated` |
| `error:*` | Error handling | `unhandled` |

### Current Tool-Execution Flow

Do not model this path as purely event-bus driven. The renderer deliberately crosses a legacy/global seam and awaits the content MCP client directly; delivery then uses a DOM completion event. The current control-relevant path is:

```text
RUN on renderer card (`callId` already bound)
  → window.mcpClient.callTool(functionName, parameters, callId)
  → content McpClient creates its separate execution record, retaining renderer callId
  → contextBridge `mcp:call-tool` → background
  → compatibility wrapper → background MCP client / selected transport → MCP server
  ← result returns on the same awaited path
  → tool store/event bus records execution outcome
  → renderer displays result
  → DOM `mcp:tool-execution-complete` with operation identity
  → automation service records delivery receipt
  → active site adapter inserts result and optionally submits
```

The typed event bus remains important for state/observability, but it is not the renderer's result-return mechanism. Preserve this distinction until a demonstrated defect justifies unifying the channels.

## State Management Details

### Store Relationships

The six stores are separate domain owners. Their names and ownership are maintained in `pages/content/src/stores/README.md`; this architecture document does not duplicate their field inventory.

### State Synchronization Pattern

Cross-store synchronization is not an automatic invariant. Where the implementation explicitly emits and consumes a typed event, the event bus is the contract; otherwise the owning orchestrator or service remains responsible for the transition. Inspect the concrete producer and consumer before relying on a relationship or adding a new one.

## Message Protocol

### Content → Background Messages

| Message Type | Payload | Response |
|-------------|---------|----------|
| `mcp:call-tool` | actual runtime payload `{ toolName, args, adapterName, callId? }` | result payload inside the context-bridge response envelope, or envelope error; `callId` is forwarded into the MCP client but is not the response-envelope id |
| `mcp:get-tools` | `{ forceRefresh }` | `NormalizedTool[]` |
| `mcp:force-reconnect` | `{}` | `{ isConnected, error? }` |
| `mcp:get-server-config` | `{}` | `{ uri, connectionType }` |
| `mcp:update-server-config` | `{ config: { uri, connectionType } }` | `{ success }` |
| `mcp:get-connection-status` | `{}` | `{ status, isConnected }` |
| `mcp:heartbeat` | `{ timestamp }` | `{ timestamp, isConnected }` |

### Background → Content Broadcasts

| Broadcast Type | Payload | Purpose |
|---------------|---------|---------|
| `connection:status-changed` | `{ status, isConnected, error? }` | Connection state updates |
| `mcp:tool-update` | `{ tools: NormalizedTool[] }` | Tool list changes |
| `mcp:server-config-updated` | `{ config }` | Server config changes |
| `mcp:heartbeat-response` | `{ timestamp, isConnected }` | Keepalive response |

**Contract-status note:** these tables describe the currently observed runtime payloads, not a claim that every TypeScript wrapper agrees with them. `pages/content/src/types/messages.ts` currently models wrapper responses for `mcp:call-tool`, `mcp:get-tools`, and `mcp:get-server-config` while the background places the corresponding bare values in the context-bridge response payload. The `mcp:tool-update` broadcaster sends `{ tools }`, but the current content listener accepts only an array payload. Those producer/consumer mismatches are tracked in `docs/qualification/issue-coverage-ledger.md`; inspect both ends before changing the contract.

## Transport Plugin Architecture

Each transport plugin implements `ITransportPlugin`:

```typescript
interface ITransportPlugin {
  readonly name: string;
  readonly transportType: TransportType;

  connect(config: TransportConfig): Promise<void>;
  disconnect(): Promise<void>;
  send(message: JsonRpcMessage): Promise<void>;
  onMessage(handler: MessageHandler): void;
  onError(handler: ErrorHandler): void;
  onClose(handler: CloseHandler): void;

  isConnected(): boolean;
  getHealthStatus(): HealthStatus;
}
```

### Transport Selection

At the client/registry interface, transport selection is explicit. `McpClient.connect()` uses the requested
`connectionType` / `TransportType` to obtain the corresponding plugin from the
`PluginRegistry`. The selected plugin then validates the configured URI via
`isSupported(uri)`. The compatibility wrappers in `chrome-extension/src/mcpclient/index.ts` use the supplied transport type or fall back to `detectTransportType(uri)` when omitted. Trace the caller as well as the registry when diagnosing selection.

## Adding a New Adapter

Adapters are registered as **lazy factories** — they're only instantiated when their hostname is visited.

```typescript
// 1. Create adapter file
// pages/content/src/plugins/adapters/my-site.adapter.ts
import { BaseAdapterPlugin } from '../base.adapter';
import type { AdapterCapability } from '../plugin-types';

export class MySiteAdapter extends BaseAdapterPlugin {
  readonly name = 'my-site-adapter';
  readonly version = '1.0.0';
  readonly hostnames = ['my-site.com'];
  readonly capabilities: AdapterCapability[] = [
    'text-insertion', 'form-submission'
  ];

  async insertText(text: string): Promise<boolean> {
    const el = document.querySelector('.chat-input');
    if (!el) return false;
    // ... insert logic
    return true;
  }

  async submitForm(): Promise<boolean> {
    const btn = document.querySelector('.send-button');
    if (!btn) return false;
    (btn as HTMLButtonElement).click();
    return true;
  }
}

// 2. Register as lazy factory in plugin-registry.ts
// Add to registerBuiltInAdapters():
this.registerAdapterFactory({
  name: 'my-site-adapter',
  version: '1.0.0',
  type: 'website-adapter',
  hostnames: ['my-site.com'],
  capabilities: ['text-insertion', 'form-submission'],
  create: () => new MySiteAdapter(),
  config: {
    id: 'my-site-adapter',
    name: 'My Site Adapter',
    description: 'Adapter for my-site.com',
    version: '1.0.0',
    enabled: true,
    priority: 10,
    settings: {}
  },
});
```

## Verification Map

Verification procedure has one owner: `AGENT_GUIDE.md`. The Behavior Ownership Map above names the affected verification dimension; executable script names live in `package.json`. Do not maintain a second command matrix here.

## Debugging

For a cold start, `pnpm agent:inspect [--json]` (`packages/e2e/agent-inspect.mjs`) compiles a
disposable Situation Packet seed — repository revision identity, topology inventory, evidence
inventory with dated staleness candidates, and the dev-build observation entry points listed
below. It is a derivation only: it stores nothing and replaces neither the owning implementation
surface nor this map.

### Browser Console (Development Mode)

```javascript
// Full system status
window._appDebug.getStats()

// Store states
window._appDebug.stores.app.getState()
window._appDebug.stores.connection.getState()
window._appDebug.stores.tool.getState()

// Plugin system
window.__pluginSystem.getRegistry().getDebugInfo()
window.__pluginSystem.getRegistry().getActivePlugin()

// MCP client
window.mcpClient.isConnected()
window.mcpClient.getPrimitives()
```

### Common Debug Queries

| What | How |
|------|-----|
| Connection status | `window._appDebug.stores.connection.getState().status` |
| Available tools | `window._appDebug.stores.tool.getState().availableTools` |
| Active adapter | `window._appDebug.stores.adapter.getState().activeAdapterName` |
| Error history | `window._appDebug.services.globalErrorHandler.getErrorStats()` |
| Performance | `window._appDebug.services.performanceMonitor.getStats()` |
