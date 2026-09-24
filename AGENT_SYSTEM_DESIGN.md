# AGENT_SYSTEM_DESIGN.md — Agent-First Design Analysis and Roadmap

> **Class: plan + analysis (dated work document).** Like `DIAGNOSIS.md`, this file owns no
> canonical fact: every durable rule it argues for lives at its authoritative layer
> (`AGENTS.md`, `SYSTEM.md`, `ARCHITECTURE.md`, `docs/agent-control-map.yaml`,
> `docs/qualification/`), and this document links rather than restates. When a roadmap item
> here lands, update the owning layer and mark the item done here.
>
> **Question this document answers:** if the agent driving this system is the primary user,
> what should change next so the agent does a better job — more accurate situational
> understanding, tighter control, fewer wasted resources? It is the analysis behind the
> staged plan; the plan itself and issue triage remain in `DIAGNOSIS.md`.

## Date and revision scope

2026-09-23, working tree `master @ be60d93`. Claims about current implementation below were
re-audited against source on this date; claims about qualification remain owned by
`docs/qualification/`.

## What the system already gets right (keep — these are load-bearing)

1. **One operation, seven lenses.** The system is conceptualized as a single operation
   (intent → identity → preconditions → execution → delivery → observation → outcome), with
   components as narrow source-fact owners, not as the reasoning unit (`SYSTEM.md`,
   `ARCHITECTURE.md`). This is the single most agent-accretive idea in the repository and
   every future change should preserve it.
2. **Bidirectional control topology.** `docs/agent-control-map.yaml` routes both
   symptom→owner and changed-path→impact, with human projection in `ARCHITECTURE.md`. This
   converts two expensive agent activities — localization and blast-radius estimation —
   into lookups.
3. **Checkpoint ladder + effect classes.** C1–C7 and the four effect classes give runtime
   claims one shared coordinate system, and `unknown` as a first-class outcome prevents the
   most dangerous class of agent error: confidently wrong retry decisions.
4. **One-fact-one-home with an abstraction gradient.** Truth resolves upward from
   implementation; navigation descends from the router; accretion ascends selectively.
   The Documentation Map's read/write columns make this mechanical.
5. **Budgeted work.** Orientation/evidence/verification/write-back budgets make "spend
   where it changes a decision" executable rather than aspirational.
6. **Evidence receipts with dependency-scoped freshness.** Date-based staleness is
   explicitly rejected; invalidation is event-scoped. This is what makes accretion safe.

## Friction points found in this re-audit (and their disposition)

These were defects found in the agent-facing surfaces on 2026-09-23. Items marked "fixed
now" landed in this tree; the rest feed the roadmap below.

| # | Friction point | Disposition |
|---|---|---|
| F1 | Stage 10 benchmark referenced fault targets and harness capabilities that did not exist (typo'd fix file, only scenarios 1–2 wired, no way to reverse injection) — an agent following it would either no-op or strand the tree in a broken state | **Fixed now** — benchmark rewritten with real targets, all four scenarios wired to `packages/e2e/benchmark-agent.mjs` with backup/`--restore` reversibility and a no-op-fault guard |
| F2 | `DIAGNOSIS.md` carried two contradictory status claims for Stage 4 ("Partial" in the stage table vs. "closes the silent redispatch defect" with no marker on steps 2–5 of the repair) — exactly the kind of prose ambiguity that forces an agent to re-audit source to decide whether work is open | **Fixed now** — repair section marked resolved, step 6 records the new repository-wide rule, stage table says "Scoped; core repair complete" |
| F3 | The single-dispatch guarantee lived only as one file's local habit; nothing told an agent adding a new retry path elsewhere that the rule applies to their layer too | **Fixed now** — `AGENTS.md` → **Effect-Class Rule (repository-wide)**, cross-linked from `SYSTEM.md` invariant 14 |
| F4 | The runtime observation vocabulary (statuses, correlation classes, checkpoint glyphs, observation commands) was scattered across `AGENT_GUIDE.md`, `ARCHITECTURE.md`, and service sources — a driving agent had to assemble its own cheat sheet | **Fixed now** — one-page driving card at the top of `pages/content/src/services/README.md`, copied verbatim from executable truth (`OperationStatus`, observation scope) |
| F5 | Cold-start orientation required reading multiple documents even for inventory-level facts (which boundaries exist, which evidence exists, what's potentially stale) | **Fixed now** — `pnpm agent:inspect` compiles a disposable Situation Packet seed (Stage 7 shim; see C below) |
| F6 | `nextAction` in operation observation is a free-text advisory string; no schema ties it to the nine-verb action vocabulary or to admission preconditions | **Roadmap A** |
| F7 | The `extends ToolExecution` pattern in `types/stores.ts` silently overwrote two discriminant fields (`status`, `error`) with narrower types, changing the discriminant semantics of the shared type — producer/consumer drift made silent by inheritance | **Roadmap D** (recorded; fix is small but touches the shared contract and deserves its own change + regression) |
| F8 | The driving loop is still human-mediated: the extension can show a driving agent everything it needs, but there is no machine-readable bridge from page state to the agent's Situation Packet | **Roadmap B/C** (deliberately deferred; see the argument in section C) |
| F9 | Browser E2E coverage is one discovery spec against `packages/test-mcp-fixture` — the delivery/insertion/submission half of the loop (C5/C6), which the operation contract centers on, has no automated browser qualification | **Roadmap E** |
| F10 | `pnpm agent:inspect`'s staleness heuristics are date-based only (per `docs/qualification/README.md`, dates alone do not stale evidence) — it names *candidates*, not verdicts | Accepted limitation, documented in the script header and its output; verdicts stay with `invalidates_on` semantics until the Stage 7 compiler exists |

## The thesis: three accretive moves

Everything above reduces to one observation. The tower's *static* half (topology, owners,
invariants, budgets) is strong. The tower's *dynamic* half — what is true right now, what
may I do next, what did my last action change — is still assembled by hand from prose,
debug globals, and memory. The three moves that most improve agent accuracy per unit of
resources, in the order they should be built:

```
A. Make "what may I do next" a typed contract, not advisory prose.   (action admission)
B. Compile the Situation Packet from owners on demand.               (Stage 7 → tool)
C. Make effect class a first-class fact of every operation.          (Stage 8 → metadata)
D. Then close the loop in a real browser.                            (E2E C5/C6)
```

This ordering is lexicographic for the same reason as the control objective in `SYSTEM.md`:
safety and truthfulness of classification come before resource cost. A compiler (B) built on
unadmitted actions (A missing) would happily recommend unsafe actions fluently.

## Roadmap A — Formal action admission (the highest-leverage contract gap)

**Problem.** `OperationObservation.nextAction` is a string. The checkpoint ladder and
effect classes exist, the nine-verb vocabulary exists (`observe`, `reconcile`, `change`,
`execute`, `recover-delivery`, `verify`, `invalidate`, `accrete`, `stop`), and the
admission preconditions exist in `ARCHITECTURE.md` → Transition and recovery rules — but
nothing connects them mechanically. An agent must re-derive admission from prose each
time, which is exactly the class of work the tower exists to eliminate.

**Target contract (additive, no new source of truth).** Extend the existing observation
derivation in `pages/content/src/services/operation-observation.ts` so each operation
carries:

```text
actions[]: {
  action: one of the nine verbs,
  admitted: boolean,
  missing: precondition(s) that block admission — named, from the table below,
  basis: the evidence references used to evaluate admission  (receipts, checkpoints, effect class)
}
```

Admission evaluation is a pure function over facts the observation layer already derives:
highest confirmed checkpoint, delivery receipt state, destination match, effect class (once
Stage 8 lands — until then every post-C3 repeat is blocked unless `read-only` is evidenced),
and retention/retry budgets. The advisory `nextAction` string remains for humans and is
formally superseded for agents by `actions[]`.

**Why this is the highest-leverage move.** It converts the system's most important safety
rules from prose into executable checks. Every downstream consumer — human, cold agent,
benchmark grader — stops re-deriving "may I retry?" and instead reads admitted/blocked with
reasons. It also directly instruments the Stage 10 matrix: external-effect safety and
outcome classification become checkable facts instead of transcript judgments.

**Tests (failure-mode first).** Before implementation, enumerate the ways admission can
fail and pin each with a node regression: admission computed from stale destination;
admission ignoring consumed retry budget; `recover-delivery` admitted when C5 is confirmed
(must be blocked — never repeat confirmed insertion); `execute` admitted for an unknown
effect class; admission flipping without a checkpoint change; `stop` never reachable. The
existing `operation-observation-safety.test.ts` and `operation-observation-effect-safety.test.ts`
files are the home; each new rule extends them rather than creating a mirror suite.

**Status:** proposed. Owner: `CONTENT_ORCHESTRATION` (observation surface) with the action
contract defined in `ARCHITECTURE.md` → Runtime Operation Contract.

## Roadmap B — Situation Compiler (Stage 7, upgraded by A)

**Problem.** `pnpm agent:inspect` (added 2026-09-23) compiles only static inventory. The
full compiler needs to join repository identity, topology, receipts, and — the missing
half — live operation state.

**Design constraints** (owned by `DIAGNOSIS.md` → Stage 7 design constraints; not restated
here) plus one addition from this analysis: once Roadmap A exists, the compiler's ranked
next actions should be *read from* `actions[]` admission rather than re-derived, so there
is exactly one admission evaluator in the system.

**Deliberate non-goals.** No daemon, no persistent state file, no second memory. The
compiler is disposable by construction: its output is only as current as its inputs, and
its inputs' owners remain the owners.

**Status:** proposed (shim landed). Owner: `REPOSITORY_TOOLING` + `CONTENT_ORCHESTRATION`
interface participation.

## Roadmap C — Effect metadata (Stage 8) and the danger of inference

**Problem.** Without effect metadata, every post-C3 uncertain outcome is blocked from
retry — safe but expensive for legitimately read-only tools, and it makes `reconcile`
the default even when the server is known idempotent.

**Design.** Owned by `DIAGNOSIS.md` → Stage 8 design constraints. One reinforcement from
this analysis: metadata must be *additive and local* (per-tool, from the tool's own
contract or an explicit user assertion), never inferred from naming conventions. An
inferred `read-only` is the single most dangerous mislabel the system could accrete — it
converts the safety rule's exception into its normal path. Until trustworthy metadata
exists, the conservative class remains correct; the cost is real but bounded by
reconciliation.

**Status:** proposed. Owner: `MCP_CLIENT` (metadata capture) + tool/operation contract in
`ARCHITECTURE.md`.

## Roadmap D — Shared-contract hygiene

**Problem (F7).** `pages/content/src/types/stores.ts` models `ToolExecutionWithReceipts`
via `extends ToolExecution` while narrowing `status` and `error`. TypeScript permits it;
the runtime meaning is that the same field name carries different discriminants on the two
sides of the store boundary. This is exactly the producer/consumer drift class the issue
ledger tracks for message types — now found inside a shared type.

**Fix shape.** Composition over extension for the two types (or an explicit intersection
with renamed narrowed fields), plus a type-level regression asserting the discriminant
narrowing is explicit. Small change, shared-contract verification rules apply (producer
and consumer together, type-check + focused tests).

**Status:** open. Owner: `SHARED_CONTRACTS`.

## Roadmap E — Close the browser loop (E2E for C5/C6)

**Problem.** The node suite proves client/protocol/observation logic; the single Playwright
spec proves discovery against `packages/test-mcp-fixture`. The delivery half — the part of
the loop the operation contract is *about* — is qualified only by manual live-browser work
(Stage 9's receipts). The qualification gap means the system's most safety-critical
recovery rules (monotonic C5/C6, recover-at-C6-only) have no automated regression net
outside the node-level simulation.

**Design (failure-mode first).** Extend `packages/e2e/tests/` with scenarios that inject
failure at each checkpoint boundary against the fixture page, and require a verifiable,
repeatable artifact from each run (per the repository testing rules):

- C5 failure → recovery inserts from the retained result without re-executing the tool
  (artifact: fixture page screenshot + tool dispatch counter == 1);
- C6 failure → recovery submits without reinserting (artifact: fixture page showing the
  inserted text twice-never invariant + delivery receipt dump);
- concurrent completions → serialized page mutation (artifact: operation snapshot showing
  FIFO order + final page state);
- destination change during delay → stale action halted, never retargeted (artifact:
  receipt showing `skipped` with the halt reason).

The fixture page (`packages/test-mcp-fixture`) already provides deterministic DOM; fault
injection follows the benchmark harness pattern (backup → mutate → restore, with a no-op
guard).

**Status:** proposed. Owner: `VERIFICATION_INFRASTRUCTURE`.

## What would make this system truly agentic (deliberately not built yet)

Recorded so the reasoning survives; none of these should be built before A–E land.

1. **A page-side observation bridge** that projects live operation state to a driving
   agent without manual console calls. Tempting; deferred because every prior need was
   satisfiable by the dev-build debug surface, and the bridge would create a new attack
   surface (a page context that can steer delivery) before an identified caller exists.
   Revisit when agents drive the extension more often than humans do.
2. **A persistent agent memory store.** Rejected by the tower's own rules: the four
   information forms (Situation Packet, Control Graph, Evidence Receipt,
   implementation/tests/observation) are exhaustive; a fifth form is a defect. Durable
   knowledge graduates into receipts and module contracts; nothing else persists.
3. **An autonomous execution controller.** The system's design separates *observation*
   from *action admission* on purpose. Until admission is mechanical (Roadmap A), an
   autonomous controller would be an automation of guessing. After A, the controller is a
   thin loop over admitted actions — and the extension's own admission checks, not the
   model's judgment, remain the safety boundary.

## Grading this document

Per the Stage 10 discipline, this analysis will have been wrong in a measurable way if a
cold agent following the tower still needs this document to act: everything argued here
should eventually be derivable from the owning layers. When roadmap items land, their
durable rules move to the owning layer and this file becomes a historical record of the
reasoning — which is the accretion ladder working as designed.
