# Agent Guide — Driving MCP SuperAssistant

> This guide is written from the perspective of an AI agent working on this codebase.
> It answers: "How do I understand what's happening, make the right changes, and verify they work?"

## Mental Model

Use the canonical driver model in `SYSTEM.md`: one operation carried from intent to evidenced outcome, with components supplying narrowly owned source facts to agent-facing operation lenses. This guide operationalizes that model through the control loop `Frame → Observe → Localize → Select owner → Change → Verify → Invalidate → Accrete`; it does not maintain another copy of the seven facets, layer model, or ownership inventory.

The practical rule is simple: identify the decision you need to make, route it to the first controlling owner, load only the smallest source/evidence set that can change that decision, and either take one admitted action or `stop`.

## Quick Orientation

When you land in this codebase:

1. Read `SYSTEM.md` for the current system model if the task crosses modules.
2. Identify the observable symptom or requested behavior.
3. Use `docs/agent-control-map.yaml` (or its human projection in `ARCHITECTURE.md` → **Behavior Ownership Map**) to choose the first implementation surface to inspect.
4. Read that implementation directly before searching broadly.
5. Gather one relevant evidence surface: an existing test, qualification entry, runtime observation, or producer/consumer contract.
6. For a change, inspect the matched boundary's typed interfaces before choosing verification; expand only when the change can fire an interface's `impact_when` trigger.

### Situation Packet

Use the canonical Situation Packet in `AGENTS.md` as the only working-state abstraction. Do not create a parallel task capsule, scratch status schema, or free-form memory record for the same facts.

At task start, populate only what is needed to make the first decision: goal, acceptance evidence, scope, authority, relevant revision/environment identity, initial owner hypothesis, one evidence surface, material unknowns, and the cheapest discriminating next action. Once paths will change, add the control graph's affected boundaries, invariants, evidence families, and verification dimensions under `Impact`. Add checkpoint/effect-class/budget fields only when the task actually involves an operation or bounded recovery.

At task close, classify the outcome as `satisfied`, `unsatisfied`, or `unknown` against the acceptance evidence, then compile the packet rather than copying it wholesale:

- verification result with reusable scope → an Evidence Receipt under `docs/qualification/`;
- module-local behavioral contract → owning module README, linked to evidence when useful;
- cross-module invariant/model change → `SYSTEM.md` or `ARCHITECTURE.md`;
- agent routing/policy change → `AGENTS.md`;
- no durable learning → no write-back.

On interruption or handoff, preserve goal, acceptance, authority, revision/environment identity, highest confirmed checkpoint, unresolved external effect, active evidence references, remaining bounded budget, and the single next permitted action. This is enough for another agent to resume without replaying completed work.

For a complex decision, derive the packet's **decision frontier** explicitly:

1. Split acceptance into proof obligations and mark only those actually evidenced.
2. Keep only unknowns that can change the next decision; pair each with its cheapest safe resolver.
3. Separate actions into admitted versus blocked. A blocked action names the missing authority, checkpoint, effect, destination, or evidence precondition.
4. Rank admitted actions by safety first, then expected information gain per relevant cost.
5. Select one next action. If no admitted action can improve the decision, select `stop` and preserve the blocker.

The frontier is a derived view of the same Situation Packet. Do not persist it independently or turn every possible action into a to-do list.

### Decision policy: spend work where it changes the decision

For each candidate next action, ask: **what uncertainty will this resolve, what decision will change if it succeeds/fails, and what does it cost?** Prefer a source read over a repository-wide search when the owner is known; a focused test over a full build when it can falsify the change; reconciliation over replay when external effects may already have happened. Stop gathering evidence once the current decision is sufficiently determined.

## Task Routing

Structural topology has one owner: `docs/agent-control-map.yaml`. Use it forward to route behavior→owner and in reverse to route changed path→impact. `ARCHITECTURE.md` → **Behavior Ownership Map** is the human-readable forward projection. Return here for procedure; do not maintain another symptom→file or path→test table in this guide.

If the map cannot route an observed behavior or relevant changed path without broad searching, treat that as a topology defect and repair the control map after the task is understood.

### Reverse impact and invalidation

Before declaring a change verified:

1. Resolve changed paths with the control map's documentation-first and most-specific-path rules; stop on an unmatched or equally specific runtime match.
2. Confirm which typed interfaces have an `impact_when` trigger that the real change can fire.
3. Select checks from the resulting verification dimensions, using the smallest check that can falsify the changed claim.
4. Compare affected evidence families with each relevant receipt's `invalidates_on` field.
5. Mark or narrow only receipts whose trigger fired; retain superseded evidence as provenance.
6. Update the one documentation owner if a durable contract or invariant changed.

Do not treat interface membership as proof that every participant or receipt is affected. The map bounds the question; implementation and receipt triggers answer it.

## Verification Workflow

Verification follows impact. Start narrow; broaden when the change or evidence crosses a qualification dimension. Invalidation follows verification and is part of task completion, not optional documentation cleanup.

| Change type | Minimum useful verification | Broaden when |
|---|---|---|
| Documentation only | Contradiction/search sweep + `git diff --check` | Claim depends on implementation or qualification evidence that was not already inspected |
| Local TypeScript logic | Existing focused test if present + changed-scope type/lint check | Shared types, build wiring, or adjacent contracts changed |
| MCP client/protocol | Relevant MCP regression/contract test | Transport or browser messaging behavior also changed |
| Transport plugin | Transport-specific test/fixture | Protocol selection, packaging, or browser behavior changed |
| Site adapter/DOM | Adapter contract + manual/live-site verification for that site when available | Shared renderer or content orchestration changed |
| Background lifecycle/message routing | Relevant state/message test + browser runtime verification | Both browser targets share affected packaging/runtime behavior |
| Manifest/build/config | Build/package affected target | Change applies to both Chrome and Firefox, then verify both |
| Shared cross-boundary contract | Type-check/build/test producer and consumer | Runtime serialization or browser boundary also changed |

Common repository checks remain available:

```bash
pnpm type-check
pnpm lint
pnpm build
pnpm build:firefox
pnpm --filter chrome-extension test   # node:test MCP regression suite (no browser needed)
```

The node test suite covers MCP client state, discovery state, schema validation, and Streamable HTTP framing — the fastest way to falsify client/protocol changes without a browser.

Required repository checks still apply; focused checks do not waive an explicit gate. Do not run all four mechanically. Run the subset that can actually falsify the changed behavior, then expand if a failure or cross-boundary dependency justifies it.

### Testing rules (repository policy)

These rules govern any test written in this repository. They are ordered by priority; when
they conflict, higher rules win.

1. **Failure-mode first.** Before writing implementation code for a feature or fix, list
   the important ways it can fail (or the key behavioral scenarios), then implement against
   that list. The list belongs in the Situation Packet's acceptance obligations; each
   failure mode maps to a scenario that can falsify it.
2. **Prefer high-value E2E/integration tests for complex features.** If a behavior spans
   boundaries (renderer → bridge → background → client → adapter), verify it at the
   integrated seam, not as a pile of isolated mocks.
3. **Use medium-to-hard scenarios, not just the trivial happy path.** A test that only
   proves the happy path proves almost nothing: the failure modes (ambiguous dispatch,
   stale destination, consumed budget, mid-pipeline failure) are the behavior.
4. **End every E2E test with a verifiable, repeatable artifact** — screenshot, response
   dump, receipt/DB snapshot, log, or recording — stored under the run's evidence path.
   An E2E run without an artifact cannot produce an Evidence Receipt.
5. **Unit/component tests only selectively:** for pure logic, complex algorithms, or
   high-risk isolated components. They are never the primary verification mechanism for a
   cross-boundary feature, and they are never written after the fact as mirrors of the
   implementation.
6. **Regression tests for every bug fix:** a fix lands only with a test that fails on the
   pre-fix code, unless existing tests already exercise that exact behavioral gap.
7. **Forbidden: tautological tests and change-detector tests** — tests that assert a
   constant, restate the implementation, or break on any internal refactor even when
   behavior is unchanged. If a refactor would break your test without changing behavior,
   the test owns too much implementation detail; rewrite it against the contract.

**Where scenario tests belong:** checkpoint/recovery and effect-safety scenarios extend the
existing node suites under `chrome-extension/tests/`; browser-integrated scenarios extend
`packages/e2e/tests/` against `packages/test-mcp-fixture` (see `AGENT_SYSTEM_DESIGN.md` →
Roadmap E for the C5/C6 scenarios not yet implemented). The ergonomics benchmark
(`docs/qualification/ergonomics-benchmark.md`) is the scenario harness for grading agent
decision trajectories, not a functional test suite.

## Driving the Runtime: Decision Walkthroughs

The [operation contract](ARCHITECTURE.md#runtime-operation-contract) is **partially implemented** at code level. Identity threading now preserves both logical `callId` and concrete dispatch `attemptId`; retained-result delivery recovery, bounded delivery retry, hard single-dispatch tool messaging, and conservative C3 observation also exist. Formal effect-class/action-admission metadata and C5/C6 checkpoint monotonicity remain unresolved in the issue ledger. The `__automationService` debug global is an observation/debug surface, not an action-admission authority. Live-behavior claims still await live confirmation; treat receipts as adapter-level evidence.

### Drive loop (observe → decide → act)

| Situation | Command (dev builds, content-script context) | Interpretation |
|---|---|---|
| "What is happening now?" | `__automationService.formatOperations()` | One line per operation: logical ID, concrete attempt IDs, status, C3–C6 glyph states, blocker, advisory next-action text |
| Need structured detail | `__automationService.observeOperations()` | Per-callId snapshot: execution/attempt IDs, correlation class, uncertainty list, timestamps, summary counts |
| Delivery failed / skipped | `__automationService.retryDelivery('<callId>')` | Replays the retained result and never re-executes the MCP tool. If C5 is unconfirmed it retries insertion from the retained result; if C5 is confirmed and C6 failed it resumes at submission without reinserting |
| Suspect a reload happened | Check `correlation: 'receipt-only'` in the snapshot | Execution record was in-memory only; receipts persisted — the operation is not lost, the store is |
| Operation missing from snapshot | `localStorage['mcp_delivery_receipts']` | Receipts outlive the tool store (30-min TTL); absence there means genuinely out of window |
| Nothing observable | Receipts empty + no executions | Before log reconstruction: is this a dev build? These surfaces are dev-only |

Treat the snapshot's current `nextAction` string as **advisory**, not as permission to act. Delivery recovery from a retained C4 result can be considered when the destination and delivery checkpoint are known. Ambiguous execution failures now keep C3 unknown and recommend reconciliation or `stop`; formal action admission still requires explicit preconditions/effect metadata rather than relying on that prose string.

| Situation | Evidence needed | Confirmed at | Correct next decision |
|---|---|---|---|
| Server connected, no usable tool list | Discovery result and selected server identity | C4 discovery, not C3 | Resolve discovery; connection state alone is insufficient to proceed |
| Tool returned, result not in chat | Retained result plus insertion outcome and intended conversation | C4 confirmed, C5 unconfirmed | Recover delivery when authorized; do not rerun the tool merely to obtain another result |
| Response lost after dispatch | Evidence of the server effect or tool-specific idempotency | C3 sent, C4 unknown | Reconcile; otherwise report unknown and pause dependent actions |
| Page changed during automation delay | Original destination versus current conversation and preferences | C5 attempt invalidated | Invalidate the stale action; obtain a current authorized destination before delivery |
| Adapter says submission succeeded | What the adapter actually observed in the page | C6 at best | Report that level of evidence; C7 — the assistant consuming the result — is never observable from extension evidence |
| Agent resumes after interruption | Build/environment, last confirmed checkpoint, unresolved effects, existing evidence | ladder position + freshness | Revalidate freshness and continue the next permitted action without replaying completed work |

A maintenance task ends with a verified change; a runtime task ends with the user's intended outcome. Keep both acceptance conditions visible when debugging an end-to-end failure. Do not broaden automation permissions to compensate for missing observations.

## Runtime Decisions and Uncertain Outcomes

Runtime claims use the shared checkpoint ladder in `SYSTEM.md`: C1 detect → C2 render → C3 execute → C4 receive → C5 deliver → C6 submit, with C7 (the assistant consuming the delivered result) outside the extension's observation boundary. Treat these as separate checkpoints: a visible card does not prove execution (C2 ≠ C3); a server response does not prove insertion (C4 ≠ C5); insertion does not prove submission (C5 ≠ C6). Observe the highest confirmed checkpoint before changing or repeating an operation, and report `unknown` as a distinct outcome from `failed`.

The concrete observation surface (dev builds): `__automationService.formatOperations()` prints one line per operation — logical ID, concrete attempt IDs, status, C3–C6 checkpoint glyph states, blocker, and an **advisory** next-action string — and `observeOperations()` returns the structured snapshot. Delivery receipts live at `localStorage['mcp_delivery_receipts']` (they survive page reloads; the in-memory tool store does not, which the snapshot reports as `receipt-only` correlation). `__automationService.retryDelivery(callId)` is bounded by `MAX_RETRY_ATTEMPTS` and never re-executes the MCP tool. Confirmed C5 and failed C6 are persisted independently, so submit-failure recovery resumes at C6 without repeating insertion. Full inventory: the Observability Map in `ARCHITECTURE.md`.

A lost response or disconnect does not prove the server had no effect. Before retrying a tool that changes external state, reconcile its outcome using available server/result evidence or the tool's documented idempotency contract. If neither resolves it, report the outcome as unknown and stop dependent actions. Do not infer exactly-once execution from a call identifier or local cancellation.

Also inspect **implicit retry layers** when execution certainty matters. ContextBridge now hard-caps `mcp:call-tool` to zero retries while ordinary bridge messages may still use configured retries, and each concrete tool dispatch carries a distinct `attemptId`. Neither `callId` nor `attemptId` proves exactly-once server effects; ambiguous timeout/failure remains potentially dispatched, so reconcile or `stop` unless a trustworthy effect/idempotency contract admits replay.

For a reproducible diagnosis, retain the revision/build identity, browser/site/transport, observed versus expected checkpoint (ladder position), relevant existing identifiers, and a redacted evidence reference. Debug globals are development-only and must be inspected in the extension content-script context; their absence in a packaged build is not itself a defect. The complete inventory of observable surfaces — including their dev-only scoping and known gaps — is the Observability Map in `ARCHITECTURE.md`.

## Accretion — Make the Next Task Cheaper

After verification, first complete the invalidation pass above, then ask whether the task established a fact likely to matter again.

- Put current support/qualification evidence in `docs/qualification/`.
- Put module-specific contracts and maintenance facts in the nearest module README.
- Put system-wide invariants or mental-model changes in `SYSTEM.md`.
- Put operational routing rules in `AGENTS.md`.
- Keep release/changelog/issue documents historically scoped.

For each reusable finding, use the Evidence Receipt contract in `docs/qualification/README.md`: claim, owner, scope, evidence, verification time/revision, status, remaining uncertainty, and explicit invalidation triggers. Add `receipt_id`, `supports`, `derived_from`, or `supersedes` only when another durable claim will traverse that relationship. An old passing test or broad support label is not proof about a newly changed artifact. On resume, read the smallest active receipt plus the working-tree diff before repeating completed investigation.

Write the fact once. Elsewhere, link or defer to the authoritative layer. Do not create a free-form agent-memory file for facts already representable in these surfaces.

## Scoped Procedure Routes

Do not turn this guide into a second module manual. Once a task is localized, continue at the narrowest owner:

| Need | Continue at |
|---|---|
| Runtime connection/message/operation observation | `ARCHITECTURE.md` Observability Map, then the owning core/background/MCP-client README or implementation |
| Store ownership/subscription behavior | `pages/content/src/stores/README.md` |
| Event vocabulary and producer/consumer conventions | `pages/content/src/events/README.md` |
| Adapter creation, capabilities, debugging, manual testing | `pages/content/src/plugins/adapters/README.md` |
| Delivery receipts/recovery/operation observation | `pages/content/src/services/README.md` |
| Current defect/gap status | `docs/qualification/issue-coverage-ledger.md` |
| Browser/site/transport/artifact qualification | `docs/qualification/support-matrix.md` |

Security, performance, lifecycle, and feature-creation rules belong with the implementation boundary they constrain unless they are truly system-wide invariants; system-wide constraints belong in `AGENTS.md`/`SYSTEM.md`. This keeps the procedure layer stable while implementation techniques evolve.
