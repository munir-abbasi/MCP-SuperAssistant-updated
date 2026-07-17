# MCP SuperAssistant Issue Coverage Ledger

Status: initial qualification baseline for the deferred-issues stabilization plan.

This ledger tracks issue-family coverage by first failing boundary and evidence, not by broad symptom similarity. Do not mark an issue or cluster fixed unless its distinctive acceptance criteria were reproduced and covered by a named test or browser run.

## Evidence labels

- **Verified**: directly confirmed from this checkout, command output, source inspection, test output, packaged artifact inspection, or real-browser run.
- **Claimed**: stated by an issue, release note, status document, or reporter, but not independently reproduced in this qualification pass.
- **Inferred**: supported by source inspection or consistent project evidence, but not runtime-verified.
- **Unknown**: not yet inspected or not enough evidence.

## Ledger

| Issue | Classification | Failure family | Reproduced | Component | First failing boundary | Test/fixture | Disposition | Release blocker | Evidence gap |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| #199 | Claimed fixed, needs preservation | Schema/discovery/CSP compatibility | Claimed by `STABILIZATION_STATUS.md`; not rerun in this pass | MCP SDK validation / schema adapter / extension CSP | Claimed around MCP schema validation and CSP-safe output schema handling | Existing schema-related deterministic tests; exact test names to be preserved | Preserve coverage; do not regress while changing discovery state | Yes | Rerun current tests; keep valid `outputSchema`; record test output |
| #196 | Plausible defect needing reproduction | Discovery reports connected/zero tools after failure | Not yet reproduced by test in this pass | Streamable HTTP plugin / `McpClient` / UI state | Inferred: discovery failure after connection can leave healthy connection state | Required new regression: advertised tools + `tools/list` failure | Immediate tranche target | Yes | Add failing test and verify old behavior fails for expected reason |
| #191 | Plausible defect needing reproduction | Discovery/config/framing variant | Not yet reproduced | Transport/plugin/client state | Unknown | None yet | Cluster for reproduction before claiming fix | Yes if matching declared support | Refresh issue facts and create distinctive fixture if needed |
| #176 | Plausible defect needing reproduction | Discovery/config/framing variant | Not yet reproduced | Transport/plugin/client state | Unknown | None yet | Cluster for reproduction before claiming fix | Yes if matching declared support | Refresh issue facts and create distinctive fixture if needed |
| #171 | Plausible defect needing reproduction | Discovery/config/framing variant | Not yet reproduced | Transport/plugin/client state | Unknown | None yet | Cluster for reproduction before claiming fix | Yes if matching declared support | Refresh issue facts and create distinctive fixture if needed |
| #158 | Plausible defect needing reproduction | Discovery/config/framing variant | Not yet reproduced | Transport/plugin/client state | Unknown | None yet | Cluster for reproduction before claiming fix | Yes if matching declared support | Refresh issue facts and create distinctive fixture if needed |
| #87 | Plausible defect needing reproduction | Discovery/config/framing variant | Not yet reproduced | Transport/plugin/client state | Unknown | None yet | Cluster for reproduction before claiming fix | Yes if matching declared support | Refresh issue facts and create distinctive fixture if needed |
| #12 | Plausible defect needing reproduction | Discovery/config/framing variant | Not yet reproduced | Transport/plugin/client state | Unknown | None yet | Cluster for reproduction before claiming fix | Yes if matching declared support | Refresh issue facts and create distinctive fixture if needed |
| Streamable HTTP JSON framing | Claimed covered | Transport response framing | Claimed by status; not rerun in this pass | Streamable HTTP plugin | Response framing parser / SDK boundary | `chrome-extension/tests/streamable-http-framing.test.ts` | Preserve coverage | Yes | Rerun targeted test and record result |
| Streamable HTTP SSE-framed POST | Claimed covered | Transport response framing | Claimed by status; not rerun in this pass | Streamable HTTP plugin | SSE event parsing / JSON-RPC response handling | `chrome-extension/tests/streamable-http-framing.test.ts` | Preserve coverage | Yes | Rerun targeted test and record result |
| Advertised tools but `tools/list` fails | Confirmed source-risk, regression not yet added | Truthful discovery state | Inferred from source inspection; not yet test-reproduced | `McpClient`, Streamable HTTP plugin, sidebar/background callers | `performConnection()` marks connected before discovery; `getPrimitives()` can rethrow while connection remains healthy if plugin health passes | Required new failing test | Immediate tranche target | Yes | Add deterministic test that fails on current behavior |
| Stale cache followed by discovery failure | Confirmed source-risk, regression not yet added | Cache invalidation/truthful degraded state | Inferred from cache fields and discovery failure path; not yet test-reproduced | `McpClient` primitive cache and UI state | Cache/discovery boundary | Required new failing test | Immediate tranche target | Yes | Add deterministic stale-cache test and expected state/error assertions |
| Root `pnpm e2e`/`pnpm e2e:firefox` | Confirmed infrastructure gap | E2E false green / zero executed tests | Verified from root scripts and `turbo.json`; no package-level e2e scripts observed | CI / package scripts / test harness | Root scripts invoke `turbo e2e` but no package defines an `e2e` script | None yet | Track for T4 E2E harness planning and later implementation | Yes for release promotion | Add zero-test guard and deterministic fixture-backed E2E harness before release promotion |
| Chrome packaged runtime | Manual test evidence | Browser/package qualification | **Manual**: extension loaded, content scripts activated, filesystem MCP tool calls completed on Z.ai/Qwen AI/Gemini | Build/package/browser | Manual test confirmed MCP tool discovery and execution in ungoogled-chromium | `package-baseline-v0.6.2-rc.1.md` records hashes; manual test logs pending formal protocol | Partial: Chrome runtime unblocked but needs guided protocol for full flow verification | Yes | Guided browser protocol for complete flow matrix; same test for Firefox |
| Firefox packaged runtime | Unknown current candidate evidence | Browser/package qualification | Not run in this pass | Build/package/browser | Unknown | None current | Needs package/hash/browser evidence | Yes | Build/zip candidate, hash, load in Firefox, capture logs |
| Supported-site insertion/submission | Unknown | Site adapter contract | Not run in this pass | Content script/site adapter/host DOM | Unknown | None current | Deferred until adapter contract work | Yes for advertised qualified sites | Choose qualified sites; run deterministic fixture/manual browser protocol |
| Reconnect/cancellation/exactly-once | Unknown | Lifecycle/result delivery | Not run in this pass | Transport/client/background/content messaging | Unknown | None current | Deferred work package | Yes | Add deterministic fixture scenarios and exactly-once assertions |
| Large or unsupported results | Unknown | Payload safety/result rendering | Not run in this pass | Tool result normalization/rendering/content insertion | Unknown | None current | Deferred work package | Yes | Define budgets and tests for large text/JSON/base64/unsupported content |
| Security/privacy/permissions | Unknown current pass; claimed CSP scan previously clean | Security/privacy | Not run in this pass | Manifest/background/content/package bundle | Unknown | Prior status claims package runtime-codegen scan; not rerun | Deferred security pass | Yes for Critical/High | Rerun CSP/codegen/permission review against final candidate artifacts |

## Current release-blocking gaps

1. No current regression test proves the advertised-tools discovery failure path.
2. No current regression test proves stale cached tools are invalidated or marked stale after discovery failure.
3. No current code change has been made to prevent healthy connected/zero-tools presentation after `tools/list` failure.
4. Current package/browser evidence is missing for the next release candidate.
5. Root E2E scripts still need a nonzero-test guard and deterministic fixture-backed harness before release promotion.

## Progress update after T0-T4

The gap list above is retained as the initial baseline. The following changes were verified after that baseline was written:

- **Verified**: `chrome-extension/tests/mcp-client-discovery-state.test.ts` now covers primitive discovery failure while transport health remains true and stale-cache reuse after forced discovery failure. The red run failed for the intended assertions before the code fix.
- **Verified**: `chrome-extension/src/mcpclient/core/McpClient.ts` now clears the primitive cache, marks the client disconnected, emits `Primitive discovery failed`, and rethrows the original error when primitive discovery fails.
- **Verified**: `pnpm -F chrome-extension test` passed 7/7 after the fix, preserving the existing issue #199/schema tests and Streamable HTTP JSON/SSE-framed discovery tests.
- **Verified**: `pnpm -F chrome-extension type-check` passed after the fix.
- **Verified**: `docs/qualification/package-baseline-v0.6.2-rc.1.md` records Chrome and Firefox package commands, archive paths, SHA-256 hashes, manifest summaries, and build warnings for the current candidate.
- **Verified**: `docs/qualification/e2e-harness-plan.md` documents the current no-op root E2E risk and bounded deterministic fixture-backed harness follow-up.
- **Partially verified**: Chrome runtime now has first manual browser evidence — extension loaded, filesystem MCP tool calls completed on Z.ai, Qwen AI, and Gemini. Still needs guided browser protocol for full flow verification.
- **Still release-blocking**: Firefox runtime qualification, a real nonzero E2E browser harness/guard, supported-site adapter contract verification (beyond manual spot-check), lifecycle/exactly-once coverage, payload budget coverage, and full security/privacy review remain incomplete.

## Update rules

- Add one row per issue or distinctive failure scenario.
- Keep duplicate-looking symptoms separate until their first failing boundary is proven identical.
- Record exact test file, fixture scenario, command output, artifact hash, or browser evidence before changing `Reproduced` to Verified.
- If a capability is downgraded from qualified to experimental, update the support matrix and known limitations in the same change set.
