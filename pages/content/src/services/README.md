# Services

Local contract for the content-script services layer — the operation-and-delivery heart of the
runtime operation contract (`ARCHITECTURE.md` §Runtime Operation Contract; implementation status
table lives there). Each service below has exactly one job and one kind of state.

## Driving card (copy into your working context when driving the runtime)

```text
ONE OPERATION — SEVEN FACETS (lenses, not stores)
  Intent → Identity → Preconditions → Execution evidence → Delivery evidence → Observation → Outcome
CHECKPOINT LADDER   C1 detect → C2 render → C3 execute → C4 receive → C5 deliver → C6 submit  [C7 outside]
                    claims cite the HIGHEST confirmed checkpoint; unknown ≠ failed; C5/C6 evidence is monotonic
EFFECT CLASSES      read-only / replay-safe / reconcilable-write / non-replayable-unknown
                    no layer silently redispatches past C3 (AGENTS.md → Effect-Class Rule)
OBSERVE (dev only)  __automationService.formatOperations()   one line per operation
                    __automationService.observeOperations()  structured snapshot
                    localStorage['mcp_delivery_receipts']     receipts survive reload (30-min TTL)
STATUS (derived)    'executing' 'execution-failed' 'execution-uncertain' 'awaiting-delivery'
                    'delivery-acknowledged' 'delivered' 'submitted' 'submission-failed'
                    'delivery-failed' 'delivery-skipped' 'delivery-only'
CORRELATION         'execution+receipt' | 'execution-only' (no callId) | 'receipt-only' (page reloaded)
NEXT ACTION         observe · reconcile · change · execute · recover-delivery · verify · invalidate · accrete · stop
                    the snapshot's nextAction string is ADVISORY, not action admission
RECOVER             retryDelivery(callId) resumes at the FIRST unconfirmed delivery checkpoint;
                    never re-executes the MCP tool; never repeats confirmed C5
DEV-ONLY CAVEAT     all __automationService surfaces are absent in packaged builds — that is expected
```

## automation.service.ts

Listens for `mcp:tool-execution-complete` and sequences delivery (insert → optional submit) through
the active site adapter. Singleton; owns **no persistent state** — preferences come from the UI store,
outcomes are recorded downstream.

- Binds `destinationUrl` at completion time; rechecks destination **and** preferences after every
  configured delay — navigation or a preference flip during a delay halts the stale action
  (`skipped`/`auto-insert-disabled-during-delay`), never retargets it.
- Records every outcome via `delivery-recovery` (below) and mirrors it onto the correlated
  `ToolExecution.delivery` field in the tool store.
- Serializes page-input mutation through one FIFO queue shared by normal completion and
  `retryDelivery()` so concurrent operations cannot interleave insert/submit steps against the same
  active input. Destination is captured before queueing and rechecked before mutation.
- Treats `insertText()` success as adapter acknowledgement only. `verifyTextInsertion()` must observe
  the expected page state before C5 is recorded as `delivered`; otherwise the receipt remains
  `acknowledged` (C5 unknown). A retry from that state reconciles page state before any reinsertion.
- `retryDelivery(callId)` is an **explicit user action**, not automation: it bypasses the auto-insert
  preference check, enforces `MAX_RETRY_ATTEMPTS`, and never re-executes the MCP tool. A failed C6
  submission is recorded separately from confirmed C5 delivery; retry resumes at submission and does
  not insert the already-delivered result again.

## delivery-recovery.ts

Owns the **persisted** delivery receipts (the only durable operation state in the content script).

- Storage: `localStorage['mcp_delivery_receipts']`; survives page reloads (the in-memory tool store
  does not — the observation layer reports this as `receipt-only` correlation).
- Retention (explicit, per contract): text results only; 64 KiB retained-result cap with truncation
  flag; 30-minute TTL with lazy purge; ≤20 receipts, oldest pruned.
- Retry budget: `MAX_RETRY_ATTEMPTS = 3`; `recordRetryAttempt` consumes **before** the attempt acts
  (crash-safe), and outcome rewrites preserve consumed attempts so the budget cannot silently reset.
- NOT a cache for tools with external effects: receipts enable delivery recovery only.
- C5 delivery and C6 submission evidence are persisted independently. A later submission failure adds
  C6 failure evidence without rewriting an already confirmed C5 delivery.

## operation-observation.ts

Pure derivation over the two owners (tool store + receipts). **No state, no events, no dispatch
paths.** Produces per-`callId`: status (11-state vocabulary; see `OperationStatus` in the source —
that type is executable truth), execution/attempt IDs, C3–C6 checkpoint
states, blocker, `nextAction`, uncertainty, timestamps. C1–C2 are out of scope by design
(`OBSERVATION_SCOPE` names their owner instead of guessing). Execution failures use dispatch evidence:
a proven pre-dispatch failure marks C3 failed; ambiguous dispatch remains C3 unknown and routes to
reconcile/`stop`. `nextAction` remains advisory rather than a formal action-admission surface.

- Dev exposure: `__automationService.observeOperations()` / `formatOperations()`.
- Correlation classes are findings, not errors: `execution-only` = legacy path without `callId`;
  `receipt-only` = reload destroyed the store; `execution+receipt` = fully correlated.

## Debug surface (dev builds only)

`window.__automationService` exposes: test triggers (`testAutoInsert/testAutoSubmit/testFileAttachment`),
receipts (`listDeliveryReceipts/getDeliveryReceipt`), `retryDelivery`, and the observation pair
(`observeOperations/formatOperations`). Absence in a packaged build is expected, not a defect.

## Non-goals

No delivery auto-retry loops in this services layer (exhaustion refuses with a reason); tool execution
is hard single-dispatch at the ContextBridge boundary until an explicit replay-safe contract exists.
No remote agent endpoint (added only for an identified caller with a concrete need), no file/blob
retention, and no claim of live-site verification beyond the adapter observation actually returned.
