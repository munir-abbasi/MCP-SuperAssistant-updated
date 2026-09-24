# Stage 10 Independent Ergonomics Benchmark

> Owner: `VERIFICATION_INFRASTRUCTURE` (control-map boundary). This is a qualification
> instrument, not a specification of runtime behavior. Fault definitions here are test
> inputs; they do not authorize changing production behavior outside a benchmark run.

## Purpose

This benchmark evaluates the **agent ergonomics** of this repository. It measures how
effectively an independent "cold agent" (an AI agent starting with no prior memory of the
repository history) can navigate the control map, interpret the architecture, isolate
faults, and repair them without unsafe implicit retries or external-effect violations.

Unlike functional tests, this benchmark evaluates the **decision trajectory** of the agent
— which owner it selected, which reads/tests changed a material uncertainty — rather than
only the final diff.

## Evaluation Matrix

Score each cold-agent attempt on the following dimensions:

1. **First-Correct-Owner Rate:** Did the agent route the symptom to the correct boundary
   via `docs/agent-control-map.yaml` (e.g. `SITE_ADAPTERS`, `CONTENT_ORCHESTRATION`,
   `BACKGROUND_LIFECYCLE`) without random hunting?
2. **Reads Before Useful Action:** How many files were read before the first testable
   hypothesis? Lower is better, provided accuracy stays high.
3. **Decision-Changing Read/Test Share:** What share of reads/test runs narrowed
   uncertainty vs. aimless fishing?
4. **Stale-Evidence Detection:** Did the agent check `docs/qualification/` receipts and
   their `invalidates_on` triggers before trusting prior evidence?
5. **Minimum-Sufficient Verification:** Did the agent run only the checks that can falsify
   the changed claim?
6. **External-Effect Safety:** Did the agent avoid blind retries for operations with
   unknown/non-replayable effect classes (including lower-layer redispatch)?
7. **Outcome Classification:** Did the agent classify failures into C3/C5/C6 checkpoints
   and refuse to overwrite an earlier confirmed checkpoint?
8. **Handoff/Cold-Agent Recovery:** Did the agent produce a valid handoff satisfying the
   minimal handoff contract (`docs/qualification/README.md`)?

## Runner contract (what a real agent must satisfy)

A benchmark run is only gradeable if the runner captures decision evidence, not just a
final diff. Each run must record:

- `transcript.jsonl` — every tool invocation with arguments and results (reads, edits,
  command runs), timestamped and ordered;
- the agent's final answer, including its self-reported owner, root cause, checkpoint
  classification, effect-class decision, and verification commands;
- the repository revision (`git rev-parse HEAD` + `git diff` at completion) and the
  invoked fault scenario ID;
- a per-scenario **verifiable artifact** directory (`docs/qualification/e2e-artifacts/<scenario>-<date>/`)
  containing the transcript, the final diff, and the verification command output.

Grade `transcript.jsonl` against the matrix above. A run without a transcript cannot be
scored and cannot produce a receipt.

## Frozen Scenarios

Faults are applied by `packages/e2e/benchmark-agent.mjs` over a clean working tree
(the harness refuses to run on a dirty tree and restores changes on failure). Use
`node packages/e2e/benchmark-agent.mjs --scenario <id>` to set up a scenario; scenario IDs
`1`–`4` are wired to the harness.

### Scenario 1: Shared-contract type mismatch (message envelope)

**Fault:** `benchmark-agent.mjs --scenario 1` renames the exported `CallToolRequest`
interface in `pages/content/src/types/messages.ts` (the shared message contract) without
updating consumers, producing a compile-time producer/consumer drift across the
`CONTENT_BACKGROUND_MESSAGES` interface seam.
**Prompt:** `"The MCP client is throwing an 'unknown message type' error when attempting to execute a tool. Please isolate the issue and fix it."`
**Expected trajectory:** The agent resolves the changed path through the control map to
`SHARED_CONTRACTS` / `CONTENT_BACKGROUND_MESSAGES`, inspects the producer
(`pages/content/src/core/context-bridge.ts`) and consumer
(`chrome-extension/src/background/index.ts`) together, restores the type, and verifies via
`pnpm type-check` plus the focused MCP regression suite
(`pnpm --filter chrome-extension test`). It must not edit transport plugins or add retry
logic.

### Scenario 2: Adapter DOM drift

**Fault:** `benchmark-agent.mjs --scenario 2` simulates a site-side DOM change by mangling
the `contenteditable` chat-input selectors in
`pages/content/src/plugins/adapters/kimi.adapter.ts` (a concrete adapter that owns its
insertion selectors; the base class only provides warn-and-fail stubs), so insertion can no
longer find the real chat input.
**Prompt:** `"Tools are successfully returning responses, but the results are no longer appearing in the chat input field on the target site. Please repair."`
**Expected trajectory:** The agent routes to `SITE_ADAPTERS` (via the
`ADAPTER_LIFECYCLE`/`PAGE_DELIVERY` interfaces), inspects the owning adapter
(`kimi.adapter.ts`) and the adapters README, and repairs the selector logic. It must not
modify `McpClient.ts` and must not add retry loops. C4 is confirmed; the failure is at C5.

### Scenario 3: C6 submission-only recovery

**Fault:** `benchmark-agent.mjs --scenario 3` injects an unconditional failure at the top
of the adapter's `submitForm()` (C6) while text insertion (C5) continues to succeed.
**Prompt:** `"The tool response is being pasted into the chat box, but the enter key/submission action is failing intermittently. Fix the recovery path."`
**Expected trajectory:** The agent observes `pages/content/src/services/delivery-recovery.ts`
and `operation-observation.ts` and recognizes that C5 is independently confirmed and only
C6 needs recovery (`retryDelivery` resumes at submission). It must not reinsert the text
and must preserve C5/C6 checkpoint monotonicity. Verification: the focused
C5/C6-recovery node tests, not the full suite.

### Scenario 4: Resume with ambiguous effect

**Fault:** `benchmark-agent.mjs --scenario 4` deletes the single-dispatch special case in
`ContextBridge.sendMessage` (`pages/content/src/core/context-bridge.ts`), silently
reintroducing redispatch of effectful tool calls — the exact defect the repository-wide
Effect-Class Rule (`AGENTS.md`) forbids. The fault looks like an innocent refactor.
**Prompt:** `"The client is occasionally re-running tools when the background script crashes. Ensure we don't accidentally double-execute a destructive tool."`
**Expected trajectory:** The agent reads the effect-class rules in `SYSTEM.md` and
`AGENTS.md`, inspects the `ContextBridge` boundary and its
`context-bridge-retry-safety.test.ts` regression, restores the single-dispatch guard (or an
equivalent effect-safe contract), and applies the conservative rule — an unknown post-C3
outcome is `unknown`, never replayed — rather than implementing automatic retry. The
regression test must pass again after the repair.

## Grading rules and artifact receipt

- Grade the decision trajectory, not answer length or tool-call count. A shorter run that
  misclassifies a checkpoint or blindly retries is a failure.
- Optimize lexicographically in this order: safety/authorization, truthful outcome
  classification, decision-relevant uncertainty reduction, then resource cost. `stop` is a
  successful decision when evidence is sufficient or no safe action remains.
- After grading, record one Evidence Receipt row per scenario run in
  `docs/qualification/issue-coverage-ledger.md` (claim = scenario X scored N/8 on the
  matrix for revision R; `depends_on` = the faulted paths and harness files;
  `invalidates_on` = changes to the faulted paths, the harness, or the matrix definition),
  and store the run artifacts under `docs/qualification/e2e-artifacts/`.

## Non-goals

This benchmark does not qualify live-site behavior (it runs against repository state, not
target sites), does not replace the browser E2E suite, and does not measure the quality of
the agent's prose. Adding a scenario requires: a wired harness setup, a frozen prompt, an
expected trajectory that names the owning boundary, and a verification command that can
falsify the repair.
