# MCP SuperAssistant — System Overview

> **Canonical high-level mental model for the current system.**
> For descriptive claims about current behavior, implementation plus tests/qualification evidence outrank prose. Use `AGENTS.md` for operational rules, this file for the system model, `ARCHITECTURE.md` for implementation detail, and `README.md` for user-facing documentation. Historical/release documents record the state they explicitly describe.

## What This System Is

MCP SuperAssistant is a **browser extension** that acts as a **protocol bridge** between web-based AI chat interfaces and local/remote MCP (Model Context Protocol) servers. It enables AI platforms like ChatGPT, Gemini, Perplexity, and others to execute real-world tool calls through MCP.

### The Problem It Solves

AI chat platforms can't natively talk to MCP servers. This extension injects itself into those platforms, detects when the AI wants to call a tool, forwards that call to an MCP server, and inserts the results back into the conversation.

### The Core Loop

```
User chats with AI → AI generates tool call (JSONL) → Extension detects it
→ Extension forwards to MCP server → MCP server executes tool
→ Result returns → Extension inserts result into chat → AI continues
```

## Intended Outcome

The design target is a dependable tool bridge for people using web AI assistants, with a system that maintenance agents can inspect and repair accurately. Success means a requested tool operation reaches a known outcome and its result reaches the conversation, with failures localized and uncertainty stated.

Evaluate improvements on the same browser/site/transport/artifact combination: successful round trips, silent or duplicate effects, time to isolate the first failing boundary, repeated investigation, and unnecessary tool calls or context reads. These are evaluation criteria, not measured improvements or existing telemetry. Establish a baseline before claiming a gain.

## The System as Three Interlocking Planes

The five implementation layers describe **where code lives**. They are not the best abstraction for driving the system. From an agent's perspective MCP SuperAssistant is one closed system made of three orthogonal planes connected by a static control graph:

```text
CONTROL PLANE
goal → authority → capability/preconditions → owner → next permitted action
    │             │              ▲                        ▲
    │             │              │   static ownership /   │
    │             │              │   impact topology       │
    │             ▼              │   (the Control Graph)   │
    │      EVIDENCE DECISION     │                        │
    │      (what do I know?)     │                        │
    ▼                            ▼                        ▼
EXECUTION PLANE                EVIDENCE/KNOWLEDGE PLANE
one operation:                 observation → receipt →
  intent → identity →         qualification → reusable
  preconditions → execute     contract/invariant → invalidation
    → receive → deliver → submit   │
    │                              └────────── feeds next control decision
    ▼
OUTCOME (C7 outside observation: the assistant consumes the result)
```

The planes must remain coupled but not conflated. The control graph is not a fourth runtime plane: it contains durable topology, never current state. A transport can be connected while an operation is unsafe to retry. A tool can return successfully while delivery is unverified. A historical passing test can remain true as history while no longer qualifying the current artifact. The agent therefore drives **claims and transitions**, not components in isolation.

### The system as ONE operation, not many components

The most important mental shift for an agent driving this system is to stop thinking in terms of "the sidebar, the renderer, the MCP client, the background script" and start thinking in terms of **one operation carried from intent to evidenced outcome**. Every component participates in that operation. No component is the operation.

An operation is the unit of agent reasoning. It has:
- **Intent** — what tool, with what arguments, at which conversation, with what authorization
- **Identity** — a logical operation distinct from any single execution attempt, threaded end-to-end
- **Preconditions** — server/transport connected, discovery fresh, adapter ready, destination current, automation permitted
- **Execution evidence** — accepted / in-progress / returned / failed / unknown, with attempt identity
- **Delivery evidence** — not-requested / pending / inserted / submitted / failed / unknown, bound to the intended destination
- **Observation** — compact facts about what is known now, what changed, what is blocked, what can be done next
- **Outcome** — whether the user's actual goal was satisfied, or what remains genuinely unknown

These seven facets are **agent-facing lenses over narrower source facts**, not seven storage owners. Atomic facts keep one authoritative home: the renderer owns detection/render facts, the background owns cross-tab connection lifecycle and routing facts, the MCP client owns protocol/transport facts, the adapter owns page-side insertion/submission facts, and the automation path owns delivery sequencing facts. A facet may compose several such owners. Identity, for example, joins the logical operation correlation with actual dispatch-attempt evidence; preconditions join connection/discovery, adapter readiness, destination, and authority facts. Observation is a derived projection over those sources. Outcome is an acceptance judgment against the user's goal, supported by evidence rather than stored as extension truth.

This reframing is not cosmetic. It determines what an agent observes first (the operation, not a component), what it changes first (the narrow source owner that controls the failing fact, not the component that happens to be closest), and what it verifies first (the claim that changed, not the component that changed). Derived views must retain enough provenance to route back to those source owners.

The shared interface among these planes is the **Situation Packet** defined in `AGENTS.md`. Runtime observation can populate parts of it automatically; maintenance work can populate it from implementation, the control graph, and evidence. Durable parts graduate into Evidence Receipts rather than being copied into a general memory store.

### The driver's minimal model

The full architecture has planes, layers, boundaries, interfaces, checkpoints, and evidence scopes, but a driving agent should not need all of those concepts in working memory at once. Routine control reduces to four questions:

| Question | Control construct | What it should return |
|---|---|---|
| What am I trying to prove or accomplish? | Situation Packet | goal, acceptance obligations, authority/scope, revision identity |
| Where does this question or change belong? | Control Graph | one first owner plus the bounded impact set |
| What is actually known? | implementation/runtime observation + Evidence Receipts | scoped evidence, certainty/freshness, material unknowns |
| What can I safely do next? | checkpoint/effect rules projected as the packet's decision frontier | admitted/blocked actions, cheapest resolver, selected action or `stop` |

Everything else is progressive disclosure. The normal cold-start target is therefore **one compiled packet plus at most one scoped evidence expansion for the common case**, not six documents loaded into context. Complex cross-boundary tasks may legitimately expand further; the benchmark is whether every expansion changes a material decision.

The packet's **decision frontier** is a derived view, not another information form. It contains open/closed proof obligations, decision-relevant unknowns, admitted/blocked actions and their evidence/preconditions, and the selected next action or stop reason. A future Situation Compiler should produce this view directly.

### Control objective

Optimize lexicographically, not by a single convenience score:

1. preserve authorization, destination integrity, and external-effect safety;
2. maximize correctness and truthfulness of outcome classification;
3. minimize unresolved uncertainty that can change the next decision;
4. only then minimize calls, tokens, elapsed work, repeated reads, and broad verification.

This prevents a cheap but unsafe retry, or a short but misleading diagnosis, from being treated as an ergonomic improvement.

#### Resource budgets

The operational definitions of the orientation, evidence, verification, and write-back budgets live in `AGENTS.md`, the process canon. This system model depends only on their governing rule: spend work where it can change a decision, and prefer `stop` when no permitted action can materially reduce decision-relevant uncertainty. Do not duplicate the mutable budget policy here.

## Runtime Design Target — A Closed Loop Around One Operation

**Proposed direction, not a claim of implemented behavior.** The five layers below describe code placement. The agent-facing abstraction should instead be one operation carried from intent to an evidenced outcome. A maintenance agent improves this loop; the web AI assistant participates in it; the user supplies the goal and authorization. Those roles have different access and must not be conflated.

```text
Goal and authorized scope
  ↓ chooses
Available capability and its preconditions
  ↓ produces
Operation: identity, arguments, destination, allowed automation
  ↓ advances through
Execution evidence → delivery evidence → continuation decision
  ↓ supports
Verified outcome → scoped reusable knowledge → next decision
```

Each level hides lower-level mechanics while preserving the evidence needed to control them. The assistant should not need to reconstruct transport logs to learn whether it can continue; the maintainer must still be able to inspect the source of that answer. A compact observation should therefore expose the last confirmed stage, uncertainty, and valid next actions, with details available on demand.

The loop closes only when the required result is delivered to the intended conversation and the user-level outcome is checked. Tool success alone cannot establish goal success. Failed insertion should lead to delivery recovery from the existing result; it should not silently initiate a new server execution.

**Design priorities, in order:** accurate outcomes and destination binding; bounded recovery and explicit control; inexpensive observation; reusable evidence. Reducing calls or tokens is valuable only while the first two remain true. Neither a new agent framework nor a general memory database is required by this model.

The operation contract and its implementation status live in [ARCHITECTURE.md](ARCHITECTURE.md#runtime-operation-contract). The staged work and acceptance criteria live in [DIAGNOSIS.md](DIAGNOSIS.md#execution-plan-for-agent-ergonomics).

## Agent Control Model

The repository should be navigable as a tower of linked abstractions. Each level answers a different question and should avoid duplicating the level below it:

```text
AGENTS.md
  How should an agent enter, route, verify, and write back work?
        ↓
SYSTEM.md
  What is the current system model and which invariants matter?
        ↓
ARCHITECTURE.md
  Which boundary owns each behavior and how do boundaries connect?
        ↓
AGENT_GUIDE.md
  How should a concrete task be observed, localized, changed, and verified?
        ↓
Module READMEs
  What is the local contract of this module?
        ↓
Implementation + tests + docs/qualification/
  What is actually implemented and what has actually been verified?
```

Historical release/changelog/issue documents sit beside this tower as dated evidence. They do not override current implementation or qualification evidence.

Four information forms keep the tower coherent:

| Form | Lifetime | Owns | Must not become |
|---|---|---|---|
| Situation Packet | One task/operation | Desired outcome, acceptance, authority, current evidence, uncertainty, outcome, and next permitted action | Durable repository truth |
| Control Graph | Durable topology | Boundary ownership, cross-boundary interface topology, impact triggers, invariant links, evidence families, verification dimensions | Executable type contracts, live state, support status, or task history |
| Evidence Receipt | Durable but scoped | What was observed, where, when, with provenance and invalidation triggers | Unscoped product truth |
| Implementation/tests/runtime observation | Current executable reality | Behavior and directly observed outcomes | Subordinate to documentation convenience |

`docs/agent-control-map.yaml` owns the static topology. `ARCHITECTURE.md` presents and explains it for humans. A future inspector may compile both repository and runtime observations into the Situation Packet, but the projection remains disposable.

### Runtime ↔ Knowledge Isomorphism

The knowledge tower mirrors the runtime ownership graph. Each runtime boundary has one authoritative documentation locus and a deterministic first route to scoped evidence and observability. A boundary may legitimately have several evidence/observation surfaces when different claims require different dimensions; the invariant is deterministic routing, not an artificial one-surface limit.

The exact boundary→documentation/evidence/observability mapping is dynamic structure and therefore lives in `docs/agent-control-map.yaml` plus its human projection in `ARCHITECTURE.md`. This model owns only the invariant: an agent must be able to move from a runtime question to one first owner and one first deciding surface without broad search. If that route is missing or ambiguous, the topology/documentation is defective.

### Control Loop

For agent-driven work, the system is operated through one loop:

```text
Frame → Observe → Localize → Select owner → Change → Verify → Invalidate → Accrete
```

- **Frame:** state the desired outcome, acceptance evidence, authorized effects/destinations, scope, and non-goals.
- **Observe:** establish the present state from the owning implementation and relevant evidence.
- **Localize:** trace the trigger-to-effect path until the first boundary that can explain the behavior.
- **Select owner:** change the narrowest component that owns that behavior.
- **Change:** preserve contracts outside that boundary unless the task explicitly requires a contract change.
- **Verify:** test only the dimensions affected by the change, then broaden if evidence reveals a cross-boundary effect.
- **Invalidate:** traverse changed boundary→invariant/evidence edges and narrow or stale only the claims whose trigger fired.
- **Accrete:** persist newly verified knowledge once, at the narrowest authoritative documentation or qualification layer.

The same graph is navigated in both directions:

```text
goal or symptom → owner → evidence → cheapest safe action
changed path → affected boundary → dependent claims → minimum verification
```

This control model is deliberately documentation-first. It does not add a runtime framework or a second memory system. Agent ergonomics come from making ownership, impact, evidence, and write-back paths explicit.

### Operation Checkpoint Ladder

All runtime claims and failure reports use one shared coordinate system — the operation checkpoint ladder:

```
C1 detect → C2 render → C3 execute → C4 receive → C5 deliver → C6 submit   [C7 consumed*]
```

| Checkpoint | Meaning | Observed by |
|---|---|---|
| C1 detect | Parser finds a tool call in the AI response | render_prescript parser |
| C2 render | Tool-call card is displayed | renderer |
| C3 execute | Tool call dispatched to the MCP server | background / MCP client |
| C4 receive | Server result returned to the content script | MCP client → tool store |
| C5 deliver | Result inserted into the page input | automation service + adapter |
| C6 submit | Input form submitted | adapter |
| C7 consumed | The AI actually used the delivered result | **nobody** — outside the extension's observation boundary |

Rules:

- Every runtime claim cites the **highest confirmed checkpoint**, not a lower one. A rendered card (C2) proves nothing about execution (C3).
- `unknown` is a distinct outcome from `failed`. A lost response after C3 leaves the server-side effect unknown; it does not prove rollback.
- C7 can never be established from extension evidence alone; only the user or the assistant's subsequent behavior can establish it.
- Retry decisions depend on the highest confirmed checkpoint: if C4 is confirmed and C5 is not, recover insertion from the retained result; if C5 is confirmed and C6 is not, preserve C5 and recover or verify submission without inserting again. C3 failures with unknown external effects require reconciliation, not blind retry.

This ladder is the shared vocabulary behind the runtime operation contract (`ARCHITECTURE.md`) and the debugging walkthroughs (`AGENT_GUIDE.md`).

### Operation effect classes

Checkpoint state alone is insufficient for retry decisions. Before repeating a dispatched operation, classify the possible external effect:

| Effect class | Meaning | Default continuation rule |
|---|---|---|
| `read-only` | No externally persistent mutation | Retry may be acceptable within normal budgets after transport/state checks |
| `replay-safe` | Write is documented idempotent or carries a server-enforced idempotency key | Retry only under that documented contract |
| `reconcilable-write` | Side effect may exist but authoritative state can be checked | Reconcile first; retry only after absence/non-completion is established |
| `non-replayable/unknown` | Duplicate effect could be harmful or effect semantics are unknown | Never blind-retry after C3; surface `unknown` and require evidence/authorization |

This classification is a control-plane property of the tool/operation, not a guess derived from the function name. Until the system has trustworthy metadata, agents must infer it only from inspected tool contracts or user-provided semantics and label that inference. The rule applies at **every retry layer**: a lower-level message bridge, transport wrapper, timeout helper, or SDK must not silently redispatch an effectful operation merely because the higher-level caller did not explicitly request a retry.

### System Invariants for Agents

These are the stable facts an agent should preserve while local details evolve:

1. Tool execution crosses distinct page/renderer, content, background, MCP-client/transport, and MCP-server boundaries.
2. Site-specific DOM behavior belongs in adapters; protocol and transport behavior belongs in the MCP client; cross-tab connection lifecycle belongs in the background service worker.
3. Registration, implementation presence, and qualification are separate claims.
4. Current behavior is established by implementation plus executable/qualification evidence, not by prose alone.
5. Durable knowledge should have one authoritative home. Other documents should link or scope the fact rather than silently creating a competing copy.
6. A runtime claim cites the highest confirmed operation checkpoint (C1–C6). C7 — the assistant consuming a delivered result — is outside the extension's observation boundary. `unknown` is a distinct outcome from `failed`.
7. Retry safety is determined by both checkpoint and effect class. A local timeout/abort after C3 never proves that an external write did not happen.
8. Accretion is monotonic only for provenance, not truth: new contradictory evidence must invalidate or narrow an older reusable claim rather than silently coexist with it.
9. Static routing and impact topology has one owner, `docs/agent-control-map.yaml`; it never stores current task/runtime state or qualification status.
10. No action is admitted without current authority, and no task closes without comparing evidenced outcome to explicit acceptance criteria.
11. **The system is one operation with seven agent-facing facets, not a collection of components.** An agent reasons about the operation first, then resolves the authoritative source facts needed for the uncertain facet. Atomic facts have one narrow owner; a facet may compose several owners; observation and the Situation Packet are derived projections; outcome is an acceptance judgment. No compiler or projection layer becomes a competing fact owner.
12. **The runtime↔knowledge isomorphism is the legibility guarantee.** Each runtime boundary has one authoritative documentation locus and a deterministic first route to the evidence/observation surface needed for the claim. Multiple scoped surfaces are allowed; ambiguous or missing routing is the tower defect.
13. **The control graph is topology, not state or executable contract.** It records durable ownership, interface participation, impact triggers, and evidence/verification routing. Executable type and serialization contracts remain implementation truth. Current connection state, operation progress, qualification status, and task progress are always derived from their owners, never from the graph.
14. **Retry safety is end-to-end.** One logical operation may contain multiple dispatch attempts, including attempts created by lower-level timeout/retry helpers. Every such attempt must be observable or conservatively treated as possible after dispatch; hidden automatic redispatch cannot be used for effectful operations without a replay-safe contract. The repository-wide application of this rule — no layer may silently redispatch an operation that may have crossed C3 without an evidenced effect contract — is owned by `AGENTS.md` → **Effect-Class Rule (repository-wide)**.
15. **Checkpoint evidence is monotonic within an attempt.** A later failure cannot erase an earlier confirmed checkpoint. For example, a C6 submission failure must preserve an already confirmed C5 insertion; recovery and observation must reason from both facts rather than collapsing them into one mutable status.
16. **Higher abstractions compress; they do not re-own lower-level facts.** Root model/process docs name concepts, owners, and evidence routes. Dynamic inventories, snippets, commands, defect history, and qualification detail stay at the narrowest authoritative layer. A copied volatile fact in a higher layer is an abstraction leak unless it is mechanically generated/checked.
17. **Evidence freshness is dependency-scoped, not age- or commit-scoped.** A receipt becomes stale when a dependency or environment dimension material to its claim changes, not merely because unrelated repository work occurred. Candidate invalidation comes from topology; the receipt's own dependency/scope evidence determines the verdict.

### Knowledge accretion ladder

Reusable knowledge should become more abstract only when evidence justifies promotion. The ladder is monotonic in provenance, not in truth: a higher rung links to its evidence and states the abstraction; it does not copy the observation. Contradictory evidence invalidates or narrows dependent rules.

```text
raw observation
   ↓ if reproducible and scoped
Evidence Receipt  (what was observed, where, when, with invalidation trigger)
   ↓ if repeatedly useful within one owner
module-local contract / maintenance rule  (the local truth for that module)
   ↓ if stable across owners and required for system reasoning
system invariant / architecture rule  (the cross-module truth)
```

#### Accretion heuristics — when to promote, when to stop

Promote when:
- The same fact has been verified independently more than once within the same owner.
- The fact is required to reason about a cross-owner interaction.
- The fact has a clear invalidation trigger and a clear owning layer.

Do not promote when:
- The fact is a single observation with no reusable invalidation trigger.
- The fact is already representable as a scoped receipt.
- Promotion would duplicate a higher-layer fact that already owns the claim.

Record **negative knowledge** — falsified root-cause hypotheses, unsafe retry assumptions, workarounds shown not to establish the claimed result — only when it is both expensive to rediscover and likely to recur. Include the conditions under which that negative conclusion itself would need revalidation. Negative knowledge is accretive too; it just has a higher bar because it is often situational.

#### Accretion anti-patterns — what NOT to do

- **Do not create a second source of truth.** If a fact belongs in `SYSTEM.md`, put it there. If a fact belongs in a module README, put it there. If a fact is scoped evidence, put it in `docs/qualification/`. Do not copy it to a fourth location "just in case."
- **Do not promote inferred evidence to verified.** An inference that seems obvious is still an inference. The ladder has distinct status levels for a reason.
- **Do not silently let a derived rule outlive its evidence.** When a receipt is invalidated, revalidate the affected receipt first, then narrow or demote any rule that depended on it. Stale derived rules are the most expensive kind of stale knowledge because they spread silently.
- **Do not accrete implementation details as architecture rules.** A specific file path or function name is a local contract detail, not a system invariant, unless it has been demonstrated to be required for system reasoning across owners.
- **Do not create free-form agent memory for facts already representable in the tower.** The four information forms (Situation Packet, Control Graph, Evidence Receipt, Implementation/tests/observation) are exhaustive for the kinds of durable knowledge this system needs. A fifth form is a defect, not an enhancement.

## Implementation Placement — Secondary View

The five implementation layers are still useful for locating code, but they are deliberately **secondary** to the one-operation/control-graph model. Their detailed paths, initialization sequence, message seams, adapter structure, and observability live in `ARCHITECTURE.md`; local procedures live in module READMEs. At model level only the ownership split matters: background lifecycle → MCP protocol/transport → content orchestration → site adapters → UI/presentation, with renderer/delivery/shared contracts cutting across those layers.

## Connection State Machine

```
disconnected → connecting → connected → error
                                    ↓
                               reconnecting → connected
```

Five states (defined in `types/stores.ts`):
- `disconnected` — No connection or connection closed
- `connecting` — Connection attempt in progress
- `connected` — Transport connected and operational
- `error` — Connection failed
- `reconnecting` — Attempting recovery after failure

Message architecture, initialization order, adapter registration, build facts, package versions, and qualification status are intentionally absent from this model layer. Their narrower owners are listed in `AGENTS.md` and `ARCHITECTURE.md`; current behavior still resolves from implementation plus scoped evidence.
