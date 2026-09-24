# Qualification Evidence Contract

This directory is the **evidence plane** of MCP SuperAssistant. It records what was actually observed or verified, under what scope, and what would invalidate that conclusion. It is not a second specification and it must not silently turn dated evidence into current product truth.

## Authority and retrieval

Use implementation to determine what the code currently does; use qualification evidence to determine what has actually been demonstrated in a stated environment. Root/model docs may link to this directory but should not copy detailed verification claims.

Read the smallest evidence object that can answer the active Situation Packet question. Do not serially read this directory. Current inventory:

| Evidence | Use for |
|---|---|
| `support-matrix.md` | browser/site/transport/artifact qualification claims |
| `issue-coverage-ledger.md` | defect/gap disposition and outstanding verification |
| `round-trip-baseline.md` | historical per-hop baseline that motivated operation identity/delivery work |
| `accretion-demonstration.md` | historical documentation-reuse experiment, invalidation, and partial independent recheck |
| `inspection-summary.md` | historical environment snapshot for the July stabilization pass |
| `ergonomics-benchmark.md` | Stage 10 cold-agent ergonomics benchmark: scenarios, grading matrix, runner contract |
| `publication-v0.7.0.md` | v0.7.0 publication receipt: CI-green revision, tag-vs-tip delta, fresh-clone gates |

Compiled orientation: `pnpm agent:inspect [--json]` (`packages/e2e/agent-inspect.mjs`) derives a
disposable Situation Packet seed — revision identity, topology inventory, evidence inventory with
dated staleness candidates, and the runtime observation entry points. It is a derivation, not a
durable record: it stores nothing, and its fields are recompiled from the tree on every run.
It never replaces reading the owning implementation surface; it only removes the cold-start
inventory cost.

## Evidence Receipt schema

Every newly created qualification artifact, and every materially updated existing one, should expose the following fields either in a compact header or a table row. Use `n/a` rather than inventing values.

| Field | Meaning |
|---|---|
| `receipt_id` | Optional stable ID when another durable receipt or rule needs to reference this evidence; omit for standalone facts |
| `claim` | The narrow proposition the evidence supports |
| `owner` | Implementation boundary responsible for the claimed behavior |
| `scope` | Browser/site/transport/server/config/artifact/OS dimensions that materially bound the claim |
| `revision` | Commit, working-tree revision, build/artifact hash, or other reproducible identity |
| `evidence` | Exact test, command, observation, trace, or source location |
| `observed_at` | Date/time when the evidence was obtained, when relevant |
| `status` | One of the certainty/freshness states below |
| `uncertainty` | Material unresolved facts only |
| `invalidates_on` | Concrete changes/events that require revalidation |
| `depends_on` | Optional machine-readable dependency descriptor for reusable evidence: relevant boundary/interface IDs plus the narrow source/fixture/artifact/environment inputs that can change the claim |
| `fingerprint` | Optional generated digest of concrete reproducible dependency inputs; enables evidence reuse across unrelated commits without treating the whole repository revision as one invalidation unit |
| `supports` | Optional IDs/anchors of contracts or generalized claims this receipt directly supports |
| `derived_from` | Optional receipt IDs from which this conclusion was derived |
| `supersedes` | Optional older receipt IDs replaced or narrowed by this evidence; the older receipt remains as provenance |

The receipt can be a row in an existing ledger; do not create one file per trivial fact. Large logs/results stay outside the receipt and are referenced on demand. Assign provenance relationships only to evidence that is likely to be reused; relationship metadata on every observation creates retrieval cost without decision value.

### Machine-comparable dependency scope

Free-text `invalidates_on` remains the human-readable semantic rule. For evidence that is expensive enough to reuse, add `depends_on` so a compiler can decide whether that rule even needs evaluation. A structured descriptor may contain only dimensions that materially bound the claim, for example:

```yaml
depends_on:
  boundaries: [MCP_CLIENT]
  interfaces: [MCP_TRANSPORT_SESSION]
  paths:
    - chrome-extension/src/mcpclient/core/McpClient.ts
  fixtures:
    - chrome-extension/tests/mcp-client-discovery-state.test.ts
  artifacts: []
  environment: [transport, server-profile]
fingerprint:
  algorithm: sha256
  digest: <generated>
  inputs: [paths, fixtures]
```

This is **not** another truth source. The Control Graph nominates candidate impact; `depends_on` narrows the candidate to the actual evidence basis; `fingerprint` can prove that concrete local inputs are unchanged; `invalidates_on` still defines the semantic event that makes transfer unsafe. External dimensions such as target-site DOM or browser behavior cannot be reduced to a repository hash and remain explicit scope/freshness questions.

Do not fingerprint the whole repository when a claim depends on three files: that converts unrelated edits into false invalidation and destroys accretion value. Do not hand-edit digests as evidence; future control tooling should generate and verify them. Historical receipts need not be retrofitted unless reuse value justifies the work.

## Status vocabulary

- **verified-current** — directly verified for the exact relevant revision/environment and no invalidation trigger is known to have fired.
- **verified-scoped** — directly verified, but only for the explicitly stated environment/artifact/dimension.
- **stale** — was verified historically, but a relevant invalidation trigger has fired or current identity cannot be established.
- **inferred** — supported by implementation/adjacent evidence but not directly demonstrated for the claim being made.
- **unknown** — evidence is insufficient to classify the outcome.
- **disproven** — direct evidence falsified the proposition under the stated scope.

Never upgrade `inferred` to `verified-*` because the inference seems obvious. Never rewrite `stale` historical evidence as if it had never passed; retain the old receipt and reverify or narrow the current claim.

## Invalidation rules

Evidence is reusable only while the dimensions that made it true remain stable. Typical invalidators:

| Evidence class | Revalidate when |
|---|---|
| Pure function/unit contract | owning implementation, relevant shared types, fixtures, dependency behavior, or test semantics change |
| MCP protocol/transport | MCP client/plugin, SDK/protocol version, server fixture, framing, or selected transport changes |
| Site adapter | adapter code, target-site DOM/route/editor behavior, browser behavior, or extension artifact changes materially |
| Background/browser lifecycle | background code, manifest/build target, browser major behavior, or lifecycle policy changes |
| Packaged artifact | source revision, build inputs, manifest conversion, dependency lockfile, or packaging process changes |
| Documentation retrieval experiment | routing/tower structure, referenced documents, or the tested scenario changes |

Dates alone do not make evidence stale, and recency alone does not make it valid. Prefer event-based invalidation. A time-to-live is appropriate only where the underlying system itself is time-sensitive and the expiry rationale is explicit.

### Invalidation pass

After verification, use changed paths to identify boundary and evidence-family candidates in `docs/agent-control-map.yaml`. When a candidate receipt has `depends_on`, intersect the actual change/environment with that descriptor before loading or evaluating the receipt in detail; compare a generated `fingerprint` when available. Only then evaluate the candidate against its `invalidates_on` semantics. Record one of four outcomes in the working Situation Packet: `unaffected`, `still-valid`, `narrowed`, or `stale`. Persist only changed durable outcomes.

The control graph supplies interface-participant candidates, not verdicts. Membership in a typed interface does not automatically stale its receipts, and passing a related test does not automatically refresh evidence for a different browser/site/transport/artifact scope. When a receipt is replaced, preserve its historical result and connect the new receipt with `supersedes` when that relationship will aid retrieval.

For staged runtime evidence, **checkpoint confirmation is monotonic within one attempt**. Evidence that C5 insertion succeeded remains valid when a later C6 submission fails unless there is direct evidence that the earlier observation itself was wrong. Record the later failure separately and recover from the first unconfirmed checkpoint; do not overwrite an earlier confirmed checkpoint merely to maintain one convenient aggregate status.

## Accretion and promotion

The durable-learning path is:

`observation → scoped Evidence Receipt → module-local contract → system invariant`

Promote only when the generalized rule has been demonstrated beyond the one observation. The higher layer links to supporting evidence and states the abstraction; it does not duplicate the full receipt. Contradictory evidence invalidates or narrows dependent rules. Traverse `supports` only when deciding whether a generalized claim must also be narrowed; do not eagerly load the entire evidence graph.

### Promotion heuristics

Promote when:
- The same fact has been verified independently more than once within the same owner.
- The fact is required to reason about a cross-owner interaction.
- The fact has a clear invalidation trigger and a clear owning layer.

Do not promote when:
- The fact is a single observation with no reusable invalidation trigger.
- The fact is already representable as a scoped receipt.
- Promotion would duplicate a higher-layer fact that already owns the claim.

### Negative knowledge

Record **negative knowledge** — falsified root-cause hypotheses, unsafe retry assumptions, workarounds shown not to establish the claimed result — only when it is both expensive to rediscover and likely to recur. Include the conditions under which that negative conclusion itself would need revalidation. Negative knowledge is accretive too; it just has a higher bar because it is often situational.

### Accretion anti-patterns

- **Do not create a second source of truth.** If a fact belongs in SYSTEM.md, put it there. If it belongs in a module README, put it there. If it is scoped evidence, put it in `docs/qualification/`. Do not copy to a fourth location "just in case."
- **Do not promote inferred evidence to verified.** An inference that seems obvious is still an inference.
- **Do not let derived rules outlive their evidence.** When a receipt is invalidated, revalidate the affected receipt first, then narrow or demote dependent rules.
- **Do not invalidate by repository age alone.** A new commit does not stale evidence whose material dependencies and environment remain unchanged; use dependency scope rather than whole-repository anxiety.
- **Do not accrete implementation details as architecture rules.** A file path or function name is a local contract detail, not a system invariant, unless it has been demonstrated to be required for system reasoning across owners.
- **Do not create free-form agent memory for facts already representable in the tower.** The four information forms are exhaustive for this system's durable knowledge needs.

## Minimal handoff contract

An agent should be able to resume from: goal, relevant revision/environment identity, highest confirmed checkpoint if any, unresolved external effect, active receipt references, remaining bounded budget, and next permitted action. If the evidence cannot support those fields, say `unknown`; do not compensate by replaying work.
