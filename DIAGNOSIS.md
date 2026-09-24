# DIAGNOSIS.md — Remaining Issues Catalog

> Organized by severity × effort with recommended fix order.
> See `DEFERRED_ISSUES.md` for full issue details and evidence.
> This file is a triage/work-queue snapshot, not authority for current runtime behavior. Before acting on an entry, re-check the owning implementation, `docs/qualification/issue-coverage-ledger.md`, and any relevant support/qualification evidence. If current evidence changes the issue classification, update the authoritative evidence first and then revise this queue.

## How Agents Should Use This Queue

1. Treat each open/partial item as a hypothesis to re-confirm, not as proof that the defect still exists.
2. Localize the issue through `docs/agent-control-map.yaml` or its projection in `ARCHITECTURE.md` before editing; issue text may name several files without proving all are causal.
3. Prefer an existing reproducer, regression test, or live observation over the historical issue description.
4. After verification, run the control graph's invalidation pass, record durable reproduction/fix evidence in `docs/qualification/issue-coverage-ledger.md` when appropriate, then update this queue's status/priority.
5. Re-rank by current severity and evidence. Do not preserve an old phase/order merely because it appears below.

## Execution Plan for Agent Ergonomics

**Status (2026-09-23, source re-audit + focused repair):** Stage 0 remains a historical static baseline. Stage 1 now preserves logical `callId` while assigning a distinct `attemptId` to each concrete tool dispatch and exposing attempt IDs through client events and operation observation; live-browser correlation remains unqualified. Stage 2 now preserves C5 delivery separately from C6 submission evidence and submit-failure recovery resumes at C6 without reinsertion; live-browser recovery remains unqualified. Stage 3 derives a compact snapshot, keeps ambiguous post-dispatch failures at C3 `unknown`, and routes them to reconcile/`stop`; its `nextAction` remains advisory rather than formal action admission. Stage 4 prevents implicit ContextBridge redispatch of `mcp:call-tool` — tool execution is hard single-dispatch at the bridge boundary until replay-safety metadata exists, with focused regressions for dispatch count, conservative C3 handling, and attempt observation; that repair is **complete** (and now a repository-wide rule, `AGENTS.md` → Effect-Class Rule), with the stage remaining scoped only because formal effect-class/action admission and live interruption/resume behavior are not yet qualified. Stage 5's same-agent demonstration remains stale and F5 open. Stage 6's static documentation/topology structure is `verified-scoped` for this working tree after mechanical validation, while its independent cold-agent acceptance remains open. Stage 7's topology input exists and a disposable compile-on-demand shim now ships (`pnpm agent:inspect`); the full Situation Compiler remains proposed. Stage 8 remains proposed positive effect metadata. Stage 9 is completely implemented and live-browser qualified: C5/C6 evidence is monotonic, normal completion plus `retryDelivery()` share one FIFO page-mutation queue, and adapter acknowledgement is distinct from independently verified page state. Stage 10's benchmark is now fully defined with a runnable four-scenario harness (`packages/e2e/benchmark-agent.mjs`, all scenario IDs wired) and a runner/grading contract (`docs/qualification/ergonomics-benchmark.md`); the first graded cold-agent runs are outstanding.

### Current resume point — 2026-09-23

Resume at **Stage 10: run and grade the benchmark scenarios** — the harness is now fully wired (scenarios 1–4 in `packages/e2e/benchmark-agent.mjs`); the outstanding work is executing graded cold-agent runs and recording the first receipts. Alternatively pick up remaining Priority items below. Stage 9 is now complete. The live-browser qualification verified that adapter acknowledgement is promoted to C5 only when the intended input actually contains the result, that acknowledgement-only state does not trigger blind reinsertion, that concurrent completions remain serialized, and that a failed C6 recovery submits without repeating confirmed C5.

The governing runtime contract is [ARCHITECTURE.md](ARCHITECTURE.md#runtime-operation-contract). The governing agent-control abstraction is the Situation Packet in `AGENTS.md`; static ownership/impact topology is `docs/agent-control-map.yaml`; evidence lifecycle is defined by `docs/qualification/README.md`. The system model is intentionally three-plane: control, execution, and evidence/knowledge. New work should strengthen the links among those planes rather than adding another independent state or memory subsystem.

### The organizing principle: one operation, seven facets

Every stage in this plan is about making the system more legible to an agent that reasons about ONE operation. The operation has seven agent-facing facets (intent, identity, preconditions, execution evidence, delivery evidence, observation, outcome). These are lenses over authoritative source facts, not seven storage owners: atomic facts have narrow owners, a facet may compose several owners, observation is derived, and outcome is judged against acceptance. The stages are about making those source contracts, joins, provenance, and recovery paths explicit without adding another source of truth.

- Stages 0–4: close the gaps between facets (identity threading, delivery recovery, compact observation, bounded continuation)
- Stage 5: demonstrate that the documentation tower lets an agent resolve the canonical scenario from scoped evidence alone
- Stage 6: unify the agent's working state (Situation Packet) and evidence lifecycle (Evidence Receipt) without adding a mutable store
- Stage 7: compile a disposable Situation Packet from the control graph + receipts + observations
- Stage 8: make effect class explicit so retry decisions are evidenced, not guessed
- Stage 9: strengthen delivery truth (serialization, page-state verification, acknowledgement vs verification)
- Stage 10: benchmark the agent system, not document elegance

| Stage | System gap / owner | Current status | Acceptance / stop rule |
|---|---|---|---|
| 0. Baseline one round trip | Execution-plane trace across renderer → content → background/client → completion → automation/adapter | **Static baseline complete** in `round-trip-baseline.md`; live capture outstanding | Record exact revision/artifact/browser/site/server/transport and highest confirmed checkpoint. Reuse existing observation when sufficient |
| 1. Preserve operation identity + destination | Execution/control seam | **Implemented in current source; live qualification pending** — logical `callId` crosses the explicit path, each concrete dispatch has a distinct `attemptId`, client events/operation observation expose attempts, and destination binding exists | One operation identity remains correlated while every actual dispatch has distinguishable attempt evidence; stale destination is refused rather than silently retargeted |
| 2. Make delivery recoverable | Execution/evidence seam | **Implemented at source/node-test level; live qualification pending** — retained-result recovery preserves confirmed C5 separately from C6 submission evidence, and submit-failure retry resumes at C6 without reinsertion or MCP execution | Failed C5 recovery reuses retained C4 result; failed/unknown C6 preserves confirmed C5 and resumes at submission without duplicate insertion or server execution |
| 3. Expose compact operation control | Evidence/control seam | **Partial** — compact snapshot includes execution/attempt identity, independent C5/C6 submit-failure evidence, and conservative C3 `unknown` handling with reconcile/`stop` advice; formal action admission remains absent | Caller can determine status, blocker and uncertainty without log reconstruction; no action recommendation requires guessing whether dispatch/effect occurred; ambiguous post-dispatch failures route to reconcile/`stop` |
| 4. Bound continuation + resume | Control plane | **Scoped; core repair complete** — delivery retry/delay/destination bounds exist; `mcp:call-tool` is hard single-dispatch in ContextBridge (repository-wide effect-class rule declared in `AGENTS.md`); attempt observability and conservative post-dispatch handling are implemented. Remains scoped because formal effect-class/action admission (Stage 8) and live interruption/resume behavior are not yet qualified | Retry/delay budgets are enforced at every layer; `mcp:call-tool` is never silently redispatched after uncertain dispatch unless a replay-safe contract explicitly admits it; interruption resumes from evidence rather than replaying completed work |
| 5. Demonstrate accretion | Knowledge plane | **Historical same-agent receipt stale; partial independent recheck recorded; F5 outstanding** | Cold independent agent resolves canonical delivery scenario through normal scoped retrieval without re-deriving closed facts |
| 6. Unify agent control state + evidence lifecycle | Documentation/control + knowledge planes | **Static structure verified-scoped; cold validation outstanding**: Frame-first Situation Packet, bidirectional interface-topology Control Graph, versionable documentation/evidence paths, Evidence Receipt provenance/freshness/invalidation, three-plane model | No competing task-state schema remains in core docs; a cold agent can route both symptom→owner and changed path→impact, then name acceptance, authority, evidence, uncertainty, outcome, and cheapest next action after the router + one scoped read |
| 7. Compile a one-shot Situation Packet | Agent tooling, generated projection only | **Proposed; static topology input implemented** | A disposable Situation Compiler derives goal/acceptance/authority, repository/scope/owners/impact, current-stale-missing evidence, runtime checkpoint/effect, unknowns, verification, outcome, and next actions without maintaining mutable master state. Output is reproducible, bounded, and disposable |
| 8. External-effect semantics + reconciliation | Tool/operation control contract | **Proposed positive metadata; conservative safety rule applies now** | Every repeat decision after C3 has an evidenced effect class (`read-only`, `replay-safe`, `reconcilable-write`, `non-replayable/unknown`). Stage 4 must already prevent blind implicit redispatch when this evidence is absent; Stage 8 adds trustworthy positive capability metadata/reconciliation semantics rather than postponing basic safety |
| 9. Strengthen delivery truth + serialization | Adapter/automation boundary | **Implemented and live-browser qualified** — C5/C6 evidence is independently monotonic; same-input page mutations share one serialized queue; adapter acknowledgement remains weaker evidence until page state is verified; acknowledgement-only recovery reconciles before reinsertion; C6-only recovery is verified. | Same-input edits are serialized; adapter acknowledgement is distinguished from verified page state; C5 and C6 evidence remain independently monotonic; recovery resumes from the first unconfirmed checkpoint and never repeats confirmed insertion merely because submission failed |
| 10. Independent ergonomics benchmark | Whole agent system | **Instrument runnable; graded runs outstanding** — fixed cold-agent scenarios, harness wiring, and grading/runner contract are complete (`docs/qualification/ergonomics-benchmark.md`, `packages/e2e/benchmark-agent.mjs`) | Run fixed cold-agent scenarios across protocol, adapter, delivery, change-impact, and resume failures. Measure first-correct-owner rate, reads before useful action, decision-changing read/test share, stale-evidence detection, minimum-sufficient verification, bad replay/duplicate effects, destination mistakes, outcome classification, handoff replay, and cold-agent recovery |

Stage 10 is now runnable end to end (`packages/e2e/benchmark-agent.mjs` wires scenarios 1–4; scenario 4 targets the ContextBridge single-dispatch path). The graded runs and receipts remain outstanding.

### Stage 4 re-audit safety repair — before richer effect metadata

> **Resolution status.** Steps 1–5 below are all **complete** (the first already carried a "Done" marker; the others did not, which read as open work next to the stage table's "Partial"). This section is retained as the historical rationale for the repair. The remaining scope that keeps Stage 4 scoped rather than complete is exactly what the stage table says: formal effect-class/action admission and live interruption/resume qualification — Stage 8 work, not this repair.

The source re-audit found a control-plane safety gap below the existing operation abstraction: `ContextBridge.sendMessage()` retried retryable failures by default, while content `McpClient.callTool()` did not override that policy for `mcp:call-tool`. The current working tree repairs that implicit redispatch path at its owner: `ContextBridge` hard-caps `mcp:call-tool` to zero retries until replay-safety metadata exists. `chrome-extension/tests/context-bridge-retry-safety.test.ts` forces a response timeout and proves one tool dispatch even when generic retries are requested, while a non-tool message still uses its configured retry budget. This closes the silent redispatch defect but does not by itself make Stage 4 complete.

Minimum implementation sequence:

1. **Done (2026-09-12):** make `mcp:call-tool` single-dispatch at the generic bridge boundary while preserving retries for ordinary messages.
2. **Done (2026-09-12):** preserve logical `callId` while assigning a distinct `attemptId` to each concrete tool dispatch; expose attempt IDs through client events and operation observation. This remains correlation evidence, not exactly-once proof.
3. **Done (2026-09-12):** operation observation treats timeout/error with uncertain dispatch as C3 `unknown`; only proven `not-dispatched` failure marks C3 failed.
4. **Done for the current observation surface (2026-09-12):** ambiguous dispatch no longer receives re-execution advice; it routes to reconciliation or `stop`. Formal effect-class/action admission remains future contract work.
5. **Done (2026-09-12):** focused timeout regression asserts that an unknown-effect tool is dispatched at most once and that ordinary retryable bridge messages still honor their retry budget.
6. **Done (2026-09-23):** declared and applied the repository-wide effect-class rule — no lower layer may silently redispatch an effectful operation (see `AGENTS.md` → **Effect-Class Rule (repository-wide)**) — so the single-dispatch guarantee is a named constraint, not one file's local habit.

Stage 8 remains valuable after this repair: it should provide trustworthy positive effect metadata and reconciliation profiles so replay-safe operations can be retried deliberately. It is not a reason to leave an unsafe implicit retry path in place until then.

### Stage 7 design constraints — Situation Compiler without another source of truth

The compiler should **derive**, not store, current state. Its inputs are task goal/acceptance/authority/scope, git or artifact identity, dirty paths, `docs/agent-control-map.yaml`, package/config files, scoped Evidence Receipts, and optional runtime observations. It may cache within one invocation but must not become an independently mutable `CURRENT_STATE.md`, database, daemon, or agent-memory subsystem that can disagree with the repository. Machine-readable output is required so agents can select fields without reading prose.

Minimum useful output:

- repository/artifact identity, scope, and relevant dirty paths;
- acceptance evidence and currently authorized reads/writes/effects/destinations;
- likely owners, changed/affected boundaries, and affected invariants;
- evidence partitioned as current, stale, or missing, with receipt references rather than copied logs;
- runtime checkpoint, effect class, destination, and retry budget when observations exist;
- material unknowns, recommended reads, required verification dimensions, and ranked next permitted actions.
- strongest terminal outcome currently supported: `satisfied`, `unsatisfied`, or `unknown`.

Every compiled field must carry enough provenance to identify its authoritative source or derivation; freshness/certainty is required where it can change the next decision. The compiler may join facts but must never promote a derived field into a new authoritative fact merely because it appears in the packet.

The compiler should expose `getAgentSnapshot()`-equivalent semantics for runtime and offline work: runtime state projects from existing stores/receipts/adapter capabilities; offline state projects from git/control graph/qualification/config. It should not dump full logs, source, or all documentation by default. A thin command such as `pnpm agent:inspect --json` is one possible interface, not the design itself.

**Workflow contract:** trigger compilation only for a concrete task/scope. Resolve acceptance and authority first, then repository/artifact identity; classify documentation paths before runtime paths and choose the most-specific match; stop on an unmatched or ambiguous path; match symptoms to a primary owner with evidence-gated escalation; traverse only interface-topology entries whose impact trigger can fire, then inspect executable contracts where the decision depends on payload/type semantics; partition the smallest relevant receipt set by freshness; merge optional runtime observations while preserving source provenance; and rank permitted actions by safety then information gain. Output the normalized Situation Packet as JSON and make no repository/runtime mutation.

**Verification:** fixed fixtures must demonstrate deterministic forward and reverse routing, event-triggered staleness, bounded output, explicit unknowns for unmatched paths or unavailable observations, and zero writes. A cold agent must choose the same safe next action from the compiled packet as from the authoritative sources.

**Failure behavior:** stale topology, ambiguous scope, malformed receipts, or unavailable runtime observations become named unknowns with recommended scoped reads. They never trigger a whole-repository dump, implicit evidence upgrade, invented effect class, or automatic execution. If no safe action remains, emit `stop` with the unresolved precondition.

### Stage 8 design constraints — effect-aware control

MCP tool descriptions do not automatically establish replay safety. Effect class must come from a trustworthy contract/profile, a server-enforced idempotency mechanism, or explicit user/context knowledge. If the evidence is absent, classify the operation conservatively as `non-replayable/unknown` after dispatch. A future metadata extension should be additive and local; do not fork protocol semantics or advertise guarantees the server does not enforce.

### Stage 10 benchmark — test the agent system, not document elegance

Use the same frozen scenarios before and after a change. Score the *decision trajectory*: whether the agent selected the correct owner, whether each read/test changed a material uncertainty, whether it preserved external-effect safety, whether it stopped when evidence was sufficient, and whether the next agent could resume without replay. A shorter answer or fewer tool calls is not an improvement if it weakens outcome classification.

Optimize in this order: safety and authorization, truthful outcome classification, decision-relevant uncertainty reduction, then resource cost. `stop` is a successful decision when evidence is sufficient, no available action can reduce a material uncertainty, or an unknown external effect cannot be reconciled safely.

Implement one stage at a time. Prefer existing regression tests; add only a main-path and critical-failure test when changed behavior lacks coverage. Client state/discovery tests and Streamable HTTP framing tests under `chrome-extension/tests/` establish their own scope; they do not prove live insertion or submission. Record browser/site/artifact qualification only after observing those dimensions.

This sequence replaces the old quick-wins ordering for agent ergonomics. The catalog below is a historical inventory of estimates and proposed remedies requiring revalidation; it is not a second active plan.

## Summary

| Status | Count |
|--------|-------|
| ✅ Fixed | 15 |
| 🟡 Partial | 7 |
| 🔴 Open | 21 |
| ⚪ Won't Fix | 13 (feature requests) |

**Historical prioritization:** The inventory originally favored quick wins. For new agent-ergonomics work, use the staged plan above and current evidence.

---

## Priority 1: Quick Wins (< 1 hour each)

These are low-effort fixes that resolve real user pain.

### 1.1 — Sidebar recovery on hide (#150)
- **Severity:** High — Users lose access to sidebar permanently
- **Effort:** Quick
- **What:** Sidebar hides immediately and cannot be recovered
- **Fix:** Add recovery mechanism or keyboard shortcut to re-show
- **Code:** `pages/content/src/components/sidebar/` — visibility toggle logic
- **Related:** The sidebar recovery mechanism in `index.ts` (setInterval check) may need adjustment

### 1.2 — Auto Submit not working (#201)
- **Severity:** Medium — Automation workflow broken
- **Effort:** Quick
- **What:** Auto-submit toggle exists in UI but doesn't fire on some sites
- **Fix:** Verify auto-submit listener is attached and triggers correctly
- **Code:** `pages/content/src/stores/ui.store.ts` — auto-submit preference
- **Related:** #195 (Grok-specific auto-submit)

### 1.3 — Configurable request timeout (#80)
- **Severity:** Medium — 30s hardcoded timeout too short for slow servers
- **Effort:** Quick
- **What:** Users can't adjust the 30-second timeout
- **Fix:** Add timeout to `ServerConfig` type and wire through to MCP client
- **Code:** `pages/content/src/types/stores.ts` (ServerConfig already has `timeout` field), `chrome-extension/src/mcpclient/core/McpClient.ts`

### 1.4 — [FIXED] Server settings page content cutoff (#90)
- **Severity:** Low — UI display issue
- **Effort:** Quick
- **What:** Server settings page doesn't display all content
- **Fix:** Adjust CSS/layout in settings component
- **Code:** `pages/content/src/components/sidebar/` — server settings section

### 1.5 — [FIXED] Cannot change URI without reconnect (#186)
- **Severity:** Medium — UX friction
- **Effort:** Quick
- **What:** Users can't change server URI without manual reconnect
- **Fix:** Auto-reconnect on URI change (partially implemented in background script)
- **Code:** `chrome-extension/src/background/index.ts` — `mcp:update-server-config` handler

---

## Priority 2: High Severity, Medium Effort (1-4 hours)

These break core functionality for specific platforms.

### 2.1 — [FIXED] ChatGPT: Function-call card unreliable (#192)
- **Severity:** High — ChatGPT is the most popular platform
- **Effort:** Medium
- **What:** Function-call card unreliable, Run/Auto-Execute broken
- **Fix:** Audit ChatGPT adapter selectors against current DOM
- **Code:** `pages/content/src/plugins/adapters/chatgpt.adapter.ts`
- **Note:** #174 (tools not executed) is likely same root cause

### 2.2 — [FIXED] ChatGPT: Forces GPT-4o fallback (#175)
- **Severity:** High — Degrades AI reasoning quality
- **Effort:** Medium
- **What:** Extension forces ChatGPT to fall back to GPT-4o
- **Fix:** Likely caused by tool call format or system prompt injection
- **Code:** `pages/content/src/plugins/adapters/chatgpt.adapter.ts`, `pages/content/src/render_prescript/`

### 2.3 — [FIXED] DeepSeek: Broken textarea selector (#193)
- **Severity:** High — DeepSeek integration non-functional
- **Effort:** Medium
- **What:** Textarea selector broken, insert buttons do nothing
- **Fix:** Update selectors for current DeepSeek DOM
- **Code:** `pages/content/src/plugins/adapters/deepseek.adapter.ts`
- **Note:** #172 (insert buttons do nothing) is same root cause

### 2.4 — [FIXED] Grok: No MCP button (#111)
- **Severity:** High — Grok integration non-functional
- **Effort:** Medium
- **What:** MCP button not appearing on Grok
- **Fix:** Audit Grok adapter selectors and injection logic
- **Code:** `pages/content/src/plugins/adapters/grok.adapter.ts`

### 2.5 — [FIXED] Google AI Studio: Response stall (#169)
- **Severity:** High — AI Studio integration broken
- **Effort:** Medium
- **What:** Response stall / incompatibility with Google AI Studio
- **Fix:** Audit AI Studio adapter for DOM changes
- **Code:** `pages/content/src/plugins/adapters/aistudio.adapter.ts`

### 2.6 — Tool discovery shows 0 tools (#202)
- **Severity:** High — Core functionality broken for some users
- **Effort:** Medium
- **What:** Shows no tools but MCP server connected (CLI detects them)
- **Fix:** Add diagnostic logging to schema validation path
- **Code:** `chrome-extension/src/mcpclient/core/BrowserJsonSchemaValidator.ts`, `chrome-extension/src/mcpclient/core/McpClient.ts`
- **Note:** #176 (no tools detected) is umbrella issue

### 2.7 — Extension context invalidated on Linux (#92)
- **Severity:** High — Extension crashes on Linux/Chrome
- **Effort:** Medium
- **What:** Extension context invalidated unexpectedly
- **Fix:** Investigate Chrome MV3 lifecycle on Linux
- **Code:** `chrome-extension/src/background/index.ts` — lifecycle handlers

### 2.8 — Sidebar shadow host detachment (#190)
- **Severity:** High — UI disappears randomly
- **Effort:** Medium
- **What:** React hydration race detaches/flaps sidebar shadow host
- **Fix:** Stabilize shadow host lifecycle in React rendering
- **Code:** `pages/content/src/index.ts` — sidebar recovery mechanism

---

## Priority 3: High Severity, Large Effort (4+ hours)

These require significant investigation or architectural changes.

### 3.1 — Streamable HTTP: SSE responses ignored (#200)
- **Severity:** High — Streamable HTTP transport partially broken
- **Effort:** Large
- **What:** Extension ignores SSE responses in POST Streamable HTTP
- **Fix:** Audit Streamable HTTP plugin SSE handling
- **Code:** `chrome-extension/src/mcpclient/plugins/streamable-http/`
- **Note:** #189 (empty response body) and #95 (headers not sent) are related

### 3.2 — MCP version compatibility (#160)
- **Severity:** High — Some MCP servers can't connect
- **Effort:** Large
- **What:** Failed to connect with some MCP versions
- **Fix:** Audit MCP protocol version handling, test against multiple server versions
- **Code:** `chrome-extension/src/mcpclient/core/McpClient.ts`

### 3.3 — Plugin freezes on Base64 images (#151)
- **Severity:** High — Extension becomes unresponsive
- **Effort:** Large
- **What:** Plugin freezes and fails to render Base64 images
- **Fix:** Add size limits, lazy rendering, or streaming for large images
- **Code:** `pages/content/src/render_prescript/src/renderer/`

### 3.4 — Chinese UI JSONL copy breakage (#166)
- **Severity:** Medium — Breaks tool execution for Chinese users
- **Effort:** Large
- **What:** Chinese UI injects `json复制代码` into code blocks
- **Fix:** Detect and strip localized UI text from code blocks before parsing
- **Code:** `pages/content/src/render_prescript/src/parser/`

### 3.5 — MCP spec version mismatch (#120)
- **Severity:** Medium — Tool calls fail with certain servers
- **Effort:** Large
- **What:** Unexpected keyword argument `'description'` in tool calls
- **Fix:** Audit MCP protocol version handling and field mapping
- **Code:** `chrome-extension/src/mcpclient/core/McpClient.ts`

---

## Priority 4: Medium Severity

### 4.1 — Streamable HTTP type mismatch (#157)
- **Severity:** Medium
- **Effort:** Quick
- **What:** Config supports `streamable-http` but some servers report bare `'http'`
- **Fix:** Add `'http'` as alias for `'streamable-http'` in type union
- **Code:** `pages/content/src/types/stores.ts` — `ConnectionType`

### 4.2 — Grok: Disable prompt modification toggle (#136)
- **Severity:** Medium
- **Effort:** Quick
- **What:** No toggle to disable prompt HTML modification on Grok
- **Fix:** Add per-site setting in adapter config
- **Code:** `pages/content/src/plugins/adapters/grok.adapter.ts`

### 4.3 — Grok: Firefox compatibility (#105)
- **Severity:** Medium
- **Effort:** Medium
- **What:** Firefox and Grok don't work together
- **Fix:** Audit Firefox-specific behavior in Grok adapter
- **Code:** `pages/content/src/plugins/adapters/grok.adapter.ts`

### 4.4 — Gemini: XML format error (#93)
- **Severity:** Medium
- **Effort:** Medium
- **What:** XML format error in Google AI Studio
- **Fix:** Audit AI Studio adapter for XML handling
- **Code:** `pages/content/src/plugins/adapters/aistudio.adapter.ts`

### 4.5 — Gemini: Markdown file retrieval breaks (#91)
- **Severity:** Medium
- **Effort:** Medium
- **What:** Markdown file retrieval breaks Gemini integration
- **Fix:** Handle markdown content in tool results
- **Code:** `pages/content/src/plugins/adapters/gemini.adapter.ts`

### 4.6 — Perplexity: XML parse error (#94)
- **Severity:** Medium
- **Effort:** Medium
- **What:** XML parse error in Perplexity
- **Fix:** Audit Perplexity adapter for XML handling
- **Code:** `pages/content/src/plugins/adapters/perplexity.adapter.ts`

### 4.7 — Error forwarding to assistant (#149)
- **Severity:** Medium — Enhancement
- **Effort:** Medium
- **What:** Errors from invoked tools not forwarded to assistant
- **Fix:** Include error messages in tool result payload
- **Code:** `pages/content/src/render_prescript/src/renderer/`

### 4.8 — Run button missing (#167)
- **Severity:** Medium
- **Effort:** Medium
- **What:** No "Run" button to execute JSONL
- **Fix:** Verify function call renderer is injecting Run buttons
- **Code:** `pages/content/src/render_prescript/src/renderer/`

---

## Priority 5: Low Severity / Intermittent

### 5.1 — Sometimes doesn't execute (#162)
- **Severity:** Low — Intermittent
- **Effort:** Unknown
- **What:** Tool calls sometimes don't execute
- **Fix:** Add diagnostic logging, harden dedup logic
- **Code:** `pages/content/src/render_prescript/src/`

### 5.2 — Cannot execute MCP tools (#154)
- **Severity:** Low — Umbrella issue
- **Effort:** Unknown
- **What:** Cannot execute MCP tools (likely connection or schema issue)
- **Fix:** Depends on root cause — check connection, schema, adapter
- **Code:** Multiple

### 5.3 — No tool response registering (#126)
- **Severity:** Low
- **Effort:** Unknown
- **What:** Tool responses not being registered
- **Fix:** Audit tool execution result handling
- **Code:** `pages/content/src/render_prescript/src/renderer/`

### 5.4 — SSE disconnection recovery (#89/86/73)
- **Severity:** Low — Partially addressed
- **Effort:** Medium
- **What:** Various SSE connection initialization failures
- **Fix:** Already hardened; verify edge cases
- **Code:** `chrome-extension/src/mcpclient/plugins/sse/`

---

## Fork Maintenance Items

### Must Do Before Release
| Item | Effort | Notes |
|------|--------|-------|
| Verify build succeeds post-cleanup | Quick | Run `pnpm build` and `pnpm build:firefox` |
| Install Playwright browsers | Quick | `npx playwright install chromium` for E2E tests |

### Should Do Soon
| Item | Effort | Notes |
|------|--------|-------|
| Set up CI (GitHub Actions) | Medium | Lint + build + test gating |
| Remove `GITHUB_TOKEN` from shell config | Quick | Credential override issue |
| Verify icon-16.png size | Quick | Should be crisp 16×16 |

### Nice to Have
| Item | Effort | Notes |
|------|--------|-------|
| Enable TypeScript strict mode | Large | 200+ `any` types across 18+ files |
| Audit all `any` types in MCP client | Large | 18+ files with eslint-disable |
| Rename remote `upstream` → `origin` | Quick | Cosmetic |

---

## Recommended Fix Order

```
Phase 1: Quick Wins (build momentum)
  1.1  Sidebar recovery (#150)
  1.2  Auto Submit (#201)
  1.3  Configurable timeout (#80)
  1.4  Settings page layout (#90)
  1.5  URI change auto-reconnect (#186)
  + Fork: Verify build, install Playwright

Phase 2: Platform Adapter Fixes (high impact)
  2.1  ChatGPT function-call card (#192)
  2.2  ChatGPT GPT-4o fallback (#175)
  2.3  DeepSeek broken selectors (#193)
  2.4  Grok no MCP button (#111)
  2.5  AI Studio response stall (#169)
  + 4.1  Streamable HTTP type alias (#157)

Phase 3: Core Reliability
  2.6  Tool discovery 0 tools (#202)
  2.7  Linux context invalidation (#92)
  2.8  Shadow host detachment (#190)
  + Fork: Set up CI

Phase 4: Transport & Protocol
  3.1  Streamable HTTP SSE handling (#200)
  3.2  MCP version compatibility (#160)
  3.5  MCP spec version mismatch (#120)

Phase 5: Rendering & Edge Cases
  3.3  Base64 image freeze (#151)
  3.4  Chinese UI JSONL breakage (#166)
  4.7  Error forwarding (#149)
  4.8  Run button visibility (#167)

Phase 6: Platform-Specific Polish
  4.2  Grok prompt toggle (#136)
  4.3  Grok Firefox compat (#105)
  4.4  AI Studio XML error (#93)
  4.5  Gemini markdown retrieval (#91)
  4.6  Perplexity XML error (#94)

Phase 7: Code Quality
  TypeScript strict mode
  any type audit
  CI pipeline
```

---

## Impact Matrix

```
                    Low Effort          High Effort
                ┌─────────────────┬─────────────────┐
 High Severity  │ #150 Sidebar    │ #200 Streamable  │
                │ #201 Auto Submit│     HTTP         │
                │ #192 ChatGPT    │ #160 MCP compat  │
                │ #193 DeepSeek   │ #151 Base64      │
                │ #111 Grok       │ #92 Linux        │
                │ #169 AI Studio  │ #190 Shadow host │
                │ #202 0 tools    │                  │
                ├─────────────────┼─────────────────┤
 Low Severity   │ #80 Timeout     │ #166 Chinese UI  │
                │ #90 Settings    │ #120 MCP spec    │
                │ #186 URI change │ #149 Error fwd   │
                │ #157 Type alias │ #167 Run button  │
                └─────────────────┴─────────────────┘
```
