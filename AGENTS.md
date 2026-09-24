# Agent Instructions — MCP SuperAssistant

> **Operational entry point for agents.** Use this file to route the task, resolve truth, choose verification, and write durable findings back to the right layer.
> Read `SYSTEM.md` when you need the cross-module mental model; read the owning implementation directly before changing behavior.
> For current behavior, implementation and qualification evidence outrank prose.

## Project Identity

- **What:** Chrome Extension bridging web AI platforms to MCP servers
- **Fork:** Maintained fork by Munir Abbasi of `srbhptl39/MCP-SuperAssistant`
- **Stack:** React 19, Vite, Tailwind CSS, Turborepo, PNPM
- **Targets:** Chrome (MV3) and Firefox-compatible MV3 output — changes must support both

## Agent Entry Protocol

Use this sequence for every repository task. It is the shortest path from a user request to a verified change. The sequence is designed so that each step has a clear stopping condition — you stop when the decision is determined, not when you have read everything.

### First-decision fast path

For a routine task, do **not** read the documentation tower top to bottom. The minimum useful cold start is:

1. Frame the goal, acceptance proof, scope/authority, and relevant revision identity.
2. Route the symptom or changed path with `docs/agent-control-map.yaml`.
3. Read the one owning implementation surface.
4. Read one evidence/contract surface capable of changing the decision.
5. Select one permitted next action or `stop`.

Expand to `SYSTEM.md`, `ARCHITECTURE.md`, `AGENT_GUIDE.md`, adjacent boundaries, or additional evidence only when the first decision actually depends on them. The documentation tower is a progressive-disclosure interface, not a mandatory reading list.

1. **Frame** — State the desired outcome, acceptance evidence, scope/non-goals, and authority for reads, writes, effects, destinations, and escalation. The frame is the contract the rest of the protocol works against. If you cannot state acceptance evidence, the task is not yet framed.
2. **Observe** — Use the control graph to identify the likely owner, then read that implementation surface. Gather only enough evidence to distinguish current behavior from stale prose or historical claims. Stop when the current decision is determined; do not continue gathering "just in case."
3. **Localize** — Confirm the single boundary that owns the behavior: page adapter, renderer, content orchestration/state, background lifecycle, MCP client/transport, or shared contract. The owner is the first surface to change, not necessarily the only surface affected.
4. **Choose the smallest control surface** — Prefer one owning file/module. Expand scope only when the observed data flow crosses a documented interface.
5. **Change** — Modify the minimum files needed to satisfy the requirement. Preserve adjacent behavior and interfaces.
6. **Verify on the affected dimensions** — Use the cheapest check that can falsify the change. Broaden verification only if the change crosses browser, site, transport, protocol, packaging, or OS boundaries.
7. **Invalidate** — Use changed paths and the control graph to identify receipts, qualification claims, and higher-level rules that may no longer transfer. Mark or narrow only claims whose invalidation trigger fired.
8. **Accrete** — Classify the outcome against acceptance, then compile durable facts from the closed Situation Packet into the narrowest authoritative documentation/evidence layer. Do not create a second source of truth.

### Evidence Budget

Start with **one owning implementation surface plus one relevant evidence surface**. Add more evidence only when those disagree, the failure crosses a boundary, or the requested claim spans more than one qualification dimension. This keeps investigation cheap without lowering confidence.

### Resource Budgets

Four budgets keep agent work cheap without lowering confidence. They are sequential discriminators, not simultaneous constraints — prefer the action with the highest expected information gain per unit of the most-relevant budget.

1. **Orientation budget** — use `docs/agent-control-map.yaml` or its human projection in `ARCHITECTURE.md`, then read the one owning surface; do not serially read the whole tower. If the map cannot get you to an owner or impact set, that is a map defect: fix the map as part of the task.
2. **Evidence budget** — one owning implementation surface plus one relevant evidence surface (rule above).
3. **Verification budget** — the cheapest check that can falsify the change; broaden only on cross-boundary evidence (see `AGENT_GUIDE.md`).
4. **Write-back budget** — one fact, one home, at the narrowest authoritative layer; elsewhere link, never copy.

These budgets are about spending work where it changes a decision, not about doing less work. Reading the whole tower when the owner is known costs tokens and time while changing nothing. Running all four repository checks when only one can falsify the change costs build time while changing nothing. Writing the same fact to three documentation layers costs future-retrieval accuracy while changing nothing. When two actions have similar information gain, prefer the cheaper one. When no available action can materially reduce decision-relevant uncertainty within scope, prefer `stop` over speculative activity.

### Situation Packet — the agent's working control state

Maintain one compact **Situation Packet** for the task. It is the common control abstraction for maintenance work, runtime diagnosis, interruption/resume, and handoff. It is working state, not a new persistent file by default.

The Situation Packet has two modes that share one schema. In **maintenance mode**, the packet is populated from implementation, the control graph, and evidence. In **runtime mode**, parts of it are populated from observation surfaces. The schema is identical; only the provenance of each field differs. An agent should always know which mode it is in, because the verification and invalidation rules differ.

| Field | Minimum meaning |
|---|---|
| Goal | Observable outcome the user actually wants, not merely the next code edit |
| Acceptance | A finite set of proof obligations: what evidence would prove the goal satisfied, plus terminal states that remain explicitly unknown |
| Scope | Files/runtime surface in scope and explicit non-goals |
| Authority | Permitted reads, writes, external effects, destinations, and escalation boundary |
| Revision | Branch/commit or artifact identity plus dirty-tree state relevant to the task |
| Environment | Only dimensions that can change the claim: browser/site/transport/server/config/build as applicable |
| Mode | `maintenance` (populated from implementation/control graph/evidence) or `runtime` (populated from observation surfaces) |
| Owner | Narrowest boundary currently believed to control the behavior |
| Impact | Changed/affected boundaries, invariants, evidence families, and verification dimensions that can alter the decision |
| Evidence | Smallest current evidence references supporting that belief, with freshness scope; copy detail only when the next decision needs it |
| Checkpoint | Highest confirmed runtime checkpoint (C1–C6) when a live operation is involved |
| Effect class | `read-only`, `replay-safe`, `reconcilable-write`, or `non-replayable/unknown` |
| Unknowns | Facts that could change the next decision, ideally with the cheapest resolver; omit decorative uncertainty |
| Next action | Cheapest permitted action that can falsify the current hypothesis or advance the outcome, including the reason and any admission precondition that still matters |
| Budget | Remaining retry/read/verification budget when bounded |
| Outcome | `satisfied`, `unsatisfied`, or `unknown`, with the evidence supporting that terminal claim |
| Write-back | Durable fact, evidence receipt, local contract, system invariant, or `none` |

Do not fill fields that are irrelevant. The packet exists to compress control state, not to create paperwork. `AGENT_GUIDE.md` defines how to use it; `docs/qualification/README.md` defines what may graduate from it into durable evidence.

Packet fields may be derived projections over several authoritative sources. The `Owner` field names the narrowest boundary controlling the **current decision or blocker**; it does not imply that boundary owns every fact represented in the packet. Preserve source provenance for projected fields rather than turning the packet into a competing source of truth.

**Decision frontier:** when a task is complex enough to have several plausible continuations, derive a compact decision frontier *inside the Situation Packet* rather than creating another state object. It contains only: open/closed acceptance obligations; current evidence references; decision-relevant unknowns and their cheapest resolvers; admitted actions; blocked actions with the missing precondition; the selected next action; and, when appropriate, the reason to `stop`. This is a disposable view of the same packet, not a fifth information form or a persistent queue.

**Action-selection rule:** preserve safety and destination integrity first; among safe actions, prefer the action with the highest expected information gain per unit of cost. A broad search, full test suite, repeated server call, or whole-document read needs a reason when a narrower discriminating action exists. For a maintenance change, resolve impact from changed paths before selecting verification; do not reconstruct blast radius from prose when the control graph already encodes it.

**Retry-layer rule:** never assume one high-level tool invocation means one server attempt. Before replaying an operation or classifying an uncertain failure, inspect lower-level message/transport retry behavior when it can redispatch the call. An implicit retry created by a bridge, timeout helper, SDK, or transport is still a new execution attempt and is subject to the same effect-safety and reconciliation rules as an explicit retry.

### Effect-Class Rule (repository-wide)

**No layer of this system may silently redispatch an operation that may have crossed C3 unless the operation's effect class (`read-only` / `replay-safe` / `reconcilable-write` / `non-replayable/unknown`) is evidenced and permits replay.** This is a repository-wide constraint on every implementation surface — message bridges, timeout/retry helpers, transport wrappers, SDK usage, reconnect logic, and explicit agent/user retries — not a local property of one file.

Concretely:

- `mcp:call-tool` is hard single-dispatch at the `ContextBridge` boundary until replay-safety metadata exists (Stage 4 repair, `DIAGNOSIS.md`). Other layers must follow the same rule by construction, not by exception.
- When adding any retry/cancellation/timeout mechanism, ask first: *can this mechanism re-send an operation whose dispatch may already have happened?* If yes and the effect class is unknown, the mechanism must exclude that operation class or require an explicit opt-in that itself checks the effect contract.
- A regression test proving dispatch count is required evidence for any change that could weaken this guarantee (`chrome-extension/tests/context-bridge-retry-safety.test.ts` is the existing exemplar).

The effect-class vocabulary and per-class continuation rules are defined in `SYSTEM.md` → **Operation effect classes**; this section owns the repository-wide application of that vocabulary to implementation layers.

### Compiled orientation (Stage 7 shim)

`pnpm agent:inspect [--json]` (`packages/e2e/agent-inspect.mjs`) compiles a disposable
Situation Packet seed — revision identity, dirty paths, topology inventory, evidence
inventory with dated staleness candidates, and runtime observation entry points. Run it
once at cold start instead of reading several documents for inventory-level facts. It is a
derivation only: it stores nothing, never replaces the owning implementation surface, and
its staleness flags are candidates to confirm against each receipt's `invalidates_on`, not
verdicts.

Use a small next-action vocabulary so another agent can interpret the packet without prose reconstruction: `observe`, `reconcile`, `change`, `execute`, `recover-delivery`, `verify`, `invalidate`, `accrete`, or `stop`. The target/reason carries the specifics. Prefer `stop` over speculative activity when no available action can materially reduce decision-relevant uncertainty within scope.

**Mode awareness:** in maintenance mode, the owner comes from the control graph and the evidence comes from implementation plus qualification. In runtime mode, the checkpoint comes from observation and the evidence comes from receipts and page state. The same packet schema serves both, but the verification rules differ: maintenance mode verifies against the changed claim; runtime mode verifies against the observed outcome. Do not mix the two modes' verification rules.

### Truth Resolution and Write-Back

For claims about current behavior, use this order:

1. Current implementation and executable contracts.
2. Current tests and `docs/qualification/` evidence for the dimension being claimed.
3. `SYSTEM.md` for the canonical high-level model.
4. `ARCHITECTURE.md` for detailed ownership and boundaries.
5. Module-local READMEs for local contracts and maintenance notes.
6. `README.md` for user-facing product description.
7. `DIAGNOSIS.md`, release notes, changelog, and deferred-issue documents as dated work/history evidence.

This order ranks evidence for descriptive claims; it does not override user instructions or engineering requirements. A mismatch between implementation and a required contract is a possible defect, not permission to rewrite the requirement.

`docs/agent-control-map.yaml` is authoritative only for static ownership/impact topology. Its interface entries describe participation and impact routing; they are not a second copy of executable TypeScript/serialization contracts. It does not establish current behavior, implementation presence, support, qualification, or live state. If its paths or edges disagree with implementation, repair the map; do not reinterpret the implementation to preserve topology prose.

When durable knowledge is learned, update the narrowest applicable documentation or evidence layer. Qualification results belong in `docs/qualification/`; module-specific contracts belong in that module's README; system-wide invariants belong in `SYSTEM.md`. Historical files should remain historically scoped.

### Documentation Locality

- Root documents route and define system-wide truth; module READMEs specialize it.
- Module READMEs should describe local contracts, files, invariants, and procedures. They should not independently restate global adapter counts, browser qualification, runtime versions, or support status unless that duplication is necessary and reverified.
- Registration, support, and qualification are different facts. A registered adapter is not automatically qualified.
- If prose contradicts implementation or current qualification evidence, fix the prose at the owning documentation layer rather than adding a compatibility explanation elsewhere.

### Abstraction gradient

The documentation tower has two different directions that must never be confused:

- **Navigation descends:** user goal → process router → system model → owning boundary → local contract → implementation/evidence.
- **Truth resolves upward from the bottom:** implementation/runtime observation and scoped qualification evidence constrain every higher descriptive claim.
- **Accretion ascends selectively:** observation → Evidence Receipt → local contract → cross-system invariant only when promotion criteria are met.
- **Invalidation fans out from change:** changed implementation/environment → Control Graph candidates → affected receipts/rules → only then higher summaries.

Every higher abstraction must **compress** the layer below it. It may name an owner, invariant, or evidence reference, but it should not copy volatile inventories, command lists, issue history, implementation snippets, or qualification detail that already has a narrower owner. If a higher document grows because lower-level facts are being copied into it, treat that as an abstraction leak.

## Runtime Boundary Entry Points

Do not memorize a component inventory here; the Control Graph owns path→boundary routing. The three common roots are `chrome-extension/src/` (background + MCP client/transports), `pages/content/src/` (renderer/content state/adapters/UI/delivery), and `packages/` (shared/build/test support). Use `ARCHITECTURE.md` only when the boundary relationship itself is the question, and use the owning module README for local procedures.

## Documentation Map

The complete document inventory with authority classes. Read narrowly: use this map to pick the one document that answers your question; do not serially read the tower.

Each document answers one question. The tower is legible when you can find the one document that answers your question in one step. If you find yourself reading multiple documents to answer a single question, that is a tower defect — the question has no single owner, or the owning document is not where the map says it is.

| Document | Class | Answers | Read when | Write when |
|---|---|---|---|---|
| `AGENTS.md` | Process canon | How do I enter, route, budget, frame, and write back? | Starting any task; routing, budgets, constraints | Routing rules, budgets, constraints, or the Situation Packet schema change |
| `SYSTEM.md` | Model canon | What is the system, what are the planes, what are the invariants? | Task crosses modules; mental model or invariants needed | System model, invariants, checkpoint vocabulary, or the three-plane model changes |
| `ARCHITECTURE.md` | Structure canon | Which boundary owns this behavior? How do boundaries connect? What can I observe? | Before changing behavior; ownership, boundaries, contracts, observability | Ownership, boundary, contract, observability, or the runtime operation contract changes |
| `docs/agent-control-map.yaml` | Topology canon | Where does this symptom belong? What does this changed path invalidate? | Routing a symptom to an owner or a changed path to impact/evidence/verification | Boundary ownership, typed interface contracts, invariant links, or verification dimensions change |
| `AGENT_GUIDE.md` | Procedure | How do I observe, localize, change, and verify a concrete task? | Executing a concrete task; verification commands and test map | Procedures, commands, or test-map facts change |
| Module `README.md`s | Local contract | What is the local contract of this module? | Working inside that module | That module's local contract changes |
| `docs/qualification/README.md` | Evidence contract | How do I record and reuse verification evidence? | Recording/reusing verification evidence | Evidence schema, freshness, invalidation, or promotion rules change |
| `docs/qualification/*` | Evidence | What has been demonstrated, where, when, with what uncertainty? | Claiming support, qualification, or fix status | After new verification, once, at the narrowest file |
| `DIAGNOSIS.md` | Plan + historical triage | What remains to be done, and in what order? | Picking work; checking plan stage status | Stage status changes; re-validated issue classifications |
| `AGENT_SYSTEM_DESIGN.md` | Plan + analysis | What is the agent-facing design analysis and roadmap (action admission, Situation Compiler, effect metadata, E2E closure)? | Planning agent-ergonomics work; understanding the reasoning behind the plan | Roadmap item status changes; new friction-point findings |
| `DEFERRED_ISSUES.md` | Historical | What was deferred and why? | Background on upstream issues | Dated re-audit only |
| `RELEASE_NOTES.md` / `CHANGELOG.md` | Historical | What changed in a given release? | Release work | At release time |
| `README.md` | Product | What is this, who maintains it, how do I install it? | User-facing claims | Product surface changes |
| `CLAUDE.md` / `GEMINI.md` | Router | (They only point here.) | Never required | Only if the entry-point set changes |
| `.archive/stale-advice/` | Historical working advice | What stale operational notes were retained for provenance? | Only when explicitly tracing history | Never use as current authority; keep ignored and archival |

**Staleness rule:** historical and working-note documents describe the state they were written in. They may seed hypotheses but never establish current behavior. If a historical claim conflicts with implementation plus evidence, the implementation wins and the historical document stays untouched — it is a record, not a spec.

## Command Authority

Use **pnpm only**. `package.json` is executable truth for the currently available scripts; `AGENT_GUIDE.md` maps common verification needs to commands. Do not copy a complete script inventory into this router because it can drift from `package.json`.

## Critical Constraints

### DO NOT
- **Never** introduce `unsafe-eval` or `new Function` — CSP compliance is absolute. AJV was removed for this reason; use `@cfworker/json-schema` instead.
- **Never** use `npm` or `yarn` — this is a PNPM workspace.
- **Never** alter the five-state connection lifecycle without understanding the full state-machine contract in `SYSTEM.md`.

### DO
- Check `pnpm-workspace.yaml` before adding packages.
- Support both Chrome and Firefox manifests.
- Use the typed event bus for cross-component communication.
- Use Zustand stores for state, not local React state.
- Emit events for observable state changes.
- Handle errors in adapter methods (return `false`, don't throw).

## State Machine Reference

The five connection states are defined by the executable types and modeled in `SYSTEM.md`; use those sources rather than copying the state diagram into this router.

## Behavior Routing

`docs/agent-control-map.yaml` is the canonical bidirectional topology: behavior→owner and changed path→affected boundaries/invariants/evidence/verification dimensions. `ARCHITECTURE.md` → **Behavior Ownership Map** is its human-readable routing projection and explains the boundary semantics. Use either before broad search; if they disagree, implementation decides current behavior and the YAML topology must be corrected.

## Module Procedures and Known Issues

Adapter creation/maintenance belongs in `pages/content/src/plugins/adapters/README.md`. Runtime observation and debugging surfaces belong in `ARCHITECTURE.md` and the relevant module README. Current defect/gap dispositions belong in `docs/qualification/issue-coverage-ledger.md`; historical issue files may seed a hypothesis but are never a current troubleshooting checklist.

## Reference Documents

See the **Documentation Map** above for the complete inventory with authority classes and read/write rules. Historical records — `DEFERRED_ISSUES.md`, `RELEASE_NOTES.md`, `CHANGELOG.md` — are dated evidence only, never current-behavior authority.
