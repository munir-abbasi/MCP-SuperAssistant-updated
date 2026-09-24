# Accretion Demonstration (Plan Stage 5)

| Receipt field | Value |
|---|---|
| `receipt_id` | `AGENT-RETRIEVAL-2026-09-07` |
| `claim` | The canonical C4-without-C5 scenario was resolvable through the then-current scoped documentation tower without code reads |
| `owner` | Agent documentation/control plane |
| `scope` | Documentation tower + qualification evidence only; same-agent walkthrough; no runtime qualification |
| `revision` | 2026-09-07 interrupted working-tree documentation revision; commit identity not recorded |
| `evidence` | Question→answer map and failure audit below |
| `observed_at` | 2026-09-07 |
| `status` | `stale` — routing and topology changed on 2026-09-10; full independent revalidation remains incomplete |
| `uncertainty` | Independent cold-reader retrieval and full cross-document audit remain outstanding |
| `invalidates_on` | Router, control topology, checkpoint/recovery contract, evidence inventory, or canonical scenario changes |
| `supports` | `DIAGNOSIS.md` Stage 5 historical evidence-level demonstration |

**Code changed:** none

## Purpose

Measure whether the documentation tower lets a cold agent resolve the canonical runtime scenario from
scoped evidence with less repeated investigation and no weaker outcome checks (the Stage 5 acceptance
in `DIAGNOSIS.md`). Per that stage's stop rule, failures found below were repaired as
retrieval/scope/invalidation fixes to existing documents; no new memory system was added.

## Scenario (the canonical runtime failure)

> "The tool card said success, but the result never appeared in the chat input."

This is the highest-frequency delivery diagnosis and the exact scenario the runtime operation contract
(Stages 1–4) was built around.

## Method and evidence set

Cold-reader walk-through using ONLY the scoped evidence, in the order `AGENTS.md` prescribes; code is
consulted only where the evidence names it:

1. `AGENTS.md` (router: Documentation Map, evidence priority ladder)
2. `SYSTEM.md` (checkpoint ladder C1–C7, runtime↔knowledge isomorphism, operation contract)
3. `ARCHITECTURE.md` (Observability Map: debug globals, always-available surfaces, known gaps)
4. `docs/qualification/round-trip-baseline.md` (per-hop identity map)
5. `docs/qualification/issue-coverage-ledger.md` (dispositions + outstanding gaps)
6. `AGENT_GUIDE.md` (diagnosis procedure, uncertain-outcome rules)

**Limitation, recorded honestly:** this walk-through was conducted by the same agent that built the
tower, so familiarity cannot be fully excluded. The true acceptance — an independent agent resolving
the scenario from this evidence set alone — remains open (failure F4 below).

## Question → answer map

| # | The cold agent must answer | Scoped answer | Owner |
|---|---|---|---|
| Q1 | Which layer owns delivery? | Automation service + site adapter; ladder checkpoint C5 | SYSTEM isomorphism; Observability Map |
| Q2 | What could have failed? | C4 received ≠ C5 delivered ≠ C6 submitted; execution success does not imply delivery | SYSTEM ladder; AGENT_GUIDE uncertain-outcome rules |
| Q3 | How do I observe without log reconstruction? | Dev builds: `__automationService.formatOperations()` → one line per operation (status, C3–C6 glyph states, blocker, next action); `observeOperations()` for the structured snapshot | Observability Map (after repair F2); AGENT_GUIDE (after repair F1) |
| Q4 | What identity correlates execution and delivery? | Renderer `callId`, threaded through content → background → client events (Stage 1); receipts are keyed by `callId`; execution records carry it as `ToolExecution.callId` | `round-trip-baseline.md` + ledger row (Stage 1) |
| Q5 | Can I recover without re-executing? | `retryDelivery(callId)` replays the retained result — server invocation count unchanged by construction; bounded by `MAX_RETRY_ATTEMPTS=3` (consumed before acting, preserved across outcome rewrites); receipts expire after 30 min | Ledger rows (Stages 2, 4); Observability Map |
| Q6 | What stays unknown, and how is unknown reported? | `unknown` is distinct from `failed`; C1–C2 are outside the observation snapshot (owner named, not guessed); `receipt-only` correlation reports a reload that destroyed the execution record; retry refusal reasons are explicit (`retry-budget-exhausted`, `destination-changed`, …) | AGENT_GUIDE; `operation-observation.ts` header docs |

Post-repair, every question resolves to a named owner with zero code reads. Q3 was **not** answerable
before the repairs (see failure audit) — that is the honest core of this demonstration.

## Measurement

- **Pre-accretion cost (documented during Stage 0, not estimated):** establishing the same facts
  required enumerating 15 completion-event dispatch sites by script, discovering that three uncorrelated
  identity systems coexist on one round trip, and that no debug surface documented the automation state.
- **Post-accretion cost:** 6 scoped documents; line-count proxies only, no benchmark claim.
- **The accretion claim is the Q→A map itself**, not a token figure: each canonical question now has
  exactly one scoped owner, and the map composes (ladder → surface → identity → recovery → uncertainty)
  without cross-derivation.

## Failure audit (what reuse got wrong) and repairs applied

| # | Failure | Class | Repair |
|---|---|---|---|
| F1 | `AGENT_GUIDE.md` says "observe the highest confirmed checkpoint" but names no concrete surface — a cold agent following it exactly falls back to log reconstruction (the pre-accretion behavior) | Retrieval | Guide now names `__automationService.observeOperations()/formatOperations()`, the receipts localStorage key, and bounded retry, and points to the Observability Map |
| F2 | Observability Map's `__automationService` row still read "test triggers for insert/submit/file" — stale since Stages 2–3 | Invalidation | Row updated: receipts, bounded retry, operation observation |
| F3 | Delivery receipts (always-available, reload-surviving) were absent from the "always-available, non-console surfaces" table | Scope | Row added for `localStorage['mcp_delivery_receipts']` |
| F4 | Known-gaps list presented Stages 1–3 gaps as open though they are closed at code level — a cold agent would re-derive closed work | Invalidation | Gaps 1–3 annotated: addressed at code level (Stages 1–3), live confirmation outstanding; 4–6 remain open |
| F5 | No independent-agent run of this demonstration | Acceptance | Recorded as the outstanding Stage 5 acceptance item in `DIAGNOSIS.md`; not repairable by document edits |

## Result

Historical result: accretion was demonstrated at the evidence level for the 2026-09-07 tower. The canonical scenario resolved through the scoped tower
with one owner per question, and the audit's failures were exactly the retrieval/scope/invalidation
classes the stage rule anticipates — all repaired in place. Independent confirmation (F5) outstanding.

## 2026-09-10 invalidation and partial recheck

The new bidirectional control graph and router ordering changed the retrieval path, firing this receipt's invalidation trigger. An independent cold reader then read `AGENTS.md` and `docs/agent-control-map.yaml` directly and identified `CONTENT_ORCHESTRATION` plus `SITE_ADAPTERS` as the correct delivery boundary after two reads. It also correctly routed a changed adapter path to its impact set.

The reader's remaining filesystem reads were unavailable in its environment, so relevant sections were supplied as scoped extracts. From those extracts it correctly classified C4 as confirmed/C5 as unconfirmed, selected retained-result delivery recovery, prohibited MCP re-execution, distinguished all four information forms, and kept the Situation Compiler proposed. This is useful partial evidence, but it does **not** satisfy F5 or verify all links/contradictions through normal cold retrieval. A clean independent rerun remains required.
