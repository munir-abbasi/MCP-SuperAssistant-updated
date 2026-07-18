# MCP SuperAssistant Qualification Support Matrix

Status: qualification baseline for v0.6.3-rc.5.

This matrix records what is qualified for the next code-bearing release candidate. It must not be read as a promise that every manifest match pattern or README-listed site is fully supported.

## Evidence labels

- **Verified**: directly confirmed from this checkout, command output, source inspection, test output, packaged artifact inspection, or real-browser run.
- **Claimed**: stated by an issue, release note, status document, or reporter, but not independently reproduced in this qualification pass.
- **Inferred**: supported by source inspection or consistent project evidence, but not runtime-verified.
- **Unknown**: not yet inspected or not enough evidence.

## Baseline checkout

| Field | Value | Evidence |
| --- | --- | --- |
| Repository | `munir-abbasi/MCP-SuperAssistant-updated` | Verified: `git remote -v` |
| Active branch | `release/v0.6.3-rc.5` | Verified: `git status --short --branch` |
| Base HEAD before rc5 commit | `1d4a255c5af85ba504b9ef03abbe4dde4b82b283` (`fix(qwen): Normalize JSON function-call extraction`), with dirty working-tree changes for v0.6.3-rc.5 before the next commit | Verified: `git log --oneline -1`; `git status --short` |
| Package version | `0.6.3-rc.5` | Verified: root and extension package manifests |
| Node required | `.nvmrc` `22.12.0`; engines `>=22.12.0` | Verified: `.nvmrc`, root `package.json` |
| Node available in this pass | `v24.12.0` | Verified: `node -v` |
| pnpm required/available | `9.15.1` / `9.15.1` | Verified: root `packageManager`, `pnpm -v` |
| Lockfile SHA-256 | `b389414684792cc11d8e6d9e332be9e3cc5b4404d64e51ac67e87a989500c52e` | Verified: `sha256sum pnpm-lock.yaml` |

## Browser and artifact matrix

| Browser | OS | Artifact | Artifact hash | Install/load verification | Runtime verification | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Chrome/Chromium | Linux | `dist-zip/extension-20260718-180830.zip` | `ecb4d6f8db3358142e71ba7cea165e8f3011df620b5e788c03155562f52ed77d` | Manifest/icon preflight only; not loaded in browser | Not run in browser | Package verified; runtime unqualified | `package-baseline-v0.6.3-rc.5.md`; manifest `version` is numeric and all declared icon files are present; runtime loading/tool execution on chat.qwen.ai still required. |
| Firefox stable | Linux | `dist-zip/extension-20260718-180906.xpi` | `3c6ad152bf970d633a11f487bb8eb537c5385f184b9d5f583f5926576b4d54ff` | Manifest/icon preflight only; not loaded in browser | Not run in browser | Package verified; runtime unqualified | `package-baseline-v0.6.3-rc.5.md`; temporary add-on/runtime loading still required. |

Notes:

- Temporary installation of an unsigned Firefox XPI does not prove store installability.
- Archive integrity does not prove runtime behavior.
- Chrome and Firefox must be qualified separately from the same candidate commit and matching fixture scenarios.

## Transport matrix

| Transport | Scenario | Current qualification status | Release blocker? | Evidence |
| --- | --- | --- | --- | --- |
| Streamable HTTP | JSON response framing | Deterministic test pass in this tranche | Yes, for release promotion | `pnpm -F chrome-extension test` PASS 17/17; `pnpm e2e`/`pnpm e2e:firefox` PASS 15/15 package/protocol tests |
| Streamable HTTP | SSE-framed POST response | Deterministic test pass in this tranche | Yes, for release promotion | `pnpm -F chrome-extension test` PASS 17/17; `pnpm e2e`/`pnpm e2e:firefox` PASS 15/15 package/protocol tests |
| Streamable HTTP | reconnect after `tools/list`/primitive discovery failure | Deterministic test pass in this tranche; browser runtime still unqualified | Yes | `chrome-extension/tests/mcp-client-discovery-state.test.ts`; targeted test PASS 4/4; package tests PASS 14/14 |
| Streamable HTTP | stale cache followed by discovery failure | Deterministic test pass in this tranche; browser runtime still unqualified | Yes | `chrome-extension/tests/mcp-client-discovery-state.test.ts`; package tests PASS 14/14 |
| Legacy SSE | Discovery and tool execution | Unknown | Yes if advertised as supported | Must be tested or downgraded before release promotion |
| WebSocket | Discovery and tool execution | Unknown | Yes if advertised as supported | Must be tested or downgraded before release promotion |

## Site/platform matrix

Manifest match patterns are broader than the qualified support matrix. A site is qualified only after the adapter contract passes against a deterministic fixture or controlled browser evidence.

| Platform/site | Route/scope | Status | Evidence gap | Release handling |
| --- | --- | --- | --- | --- |
| ChatGPT | `chatgpt.com`, `chat.openai.com` | Not qualified yet | Need packaged Chrome and Firefox runtime evidence: mount once, insert, execute manually once, auto-execute at most once, reload/reconnect behavior | Required core site for promotion if declared supported |
| One non-ProseMirror site | To be selected | Not qualified yet | Need same adapter contract evidence as ChatGPT | Required to avoid single-editor false confidence |
| Perplexity | Manifest match only | Experimental/unqualified | No current adapter contract evidence in this pass | Do not advertise as fully qualified yet |
| Grok/X/Twitter | Manifest match only | Experimental/unqualified | No current adapter contract evidence in this pass | Do not advertise as fully qualified yet |
| Gemini/AiStudio | `gemini.google.com` | Not verified for v0.6.3-rc.5 | Previous manual evidence exists for an older candidate, but this RC was not runtime-tested | Keep as experimental pending full adapter contract |
| Z.ai | Manifest match | Not verified for v0.6.3-rc.5 | Previous manual evidence exists for an older candidate, but this RC was not runtime-tested | Keep as experimental pending full adapter contract |
| Qwen AI | Manifest match | Parser/spinner regressions covered; live runtime not verified for v0.6.3-rc.5 | Deterministic parser test covers polluted/compact JSONL and polluted partial starts; source-path inspection fixed the monitor ID mismatch that could leave JSON blocks spinning. This session did not load the final Chrome ZIP or Firefox XPI on chat.qwen.ai | Required before claiming the reported Qwen regression is fixed in-browser |

## Release promotion gates

A release candidate must not be promoted as stable until all applicable gates have evidence:

1. Targeted unit/contract tests are nonzero and pass.
2. Type-check passes for the changed scope.
3. Chrome and Firefox builds/packages are produced from the same candidate commit.
4. SHA-256 hashes are recorded for candidate artifacts.
5. Packaged artifacts are scanned for CSP/runtime-codegen regressions.
6. Browser runtime evidence confirms truthful connection/discovery state.
7. Streamable HTTP JSON and SSE-framed responses are verified in-browser or against deterministic fixture coverage.
8. Retained SSE/WebSocket support is verified or downgraded.
9. Supported-site insertion/submission behavior passes the adapter contract.
10. Reconnect, cancellation, and exactly-once behavior have bounded evidence.
11. Oversized/malformed payloads fail visibly and safely.
12. No unresolved Critical/High security or privacy issue remains.
13. Documentation, known limitations, support matrix, and issue ledger match the verified behavior.

## Current conclusion

v0.6.3-rc.5 has package/archive and deterministic test evidence for the reconnect-after-discovery-failure fix, numeric manifest version hotfix, manifest icon packaging hotfix, Qwen-style polluted/compact JSONL parser extraction hotfix, and bounded-spinner monitor-ID hotfix. Chrome and Firefox archives were built and integrity-checked, package/protocol E2E passed for both browser targets, and manifest preflight confirms numeric `version`, `version_name` release labeling, and all declared icon files present. The final artifacts were not loaded in Chrome or Firefox, and chat.qwen.ai live tool execution with SSE and Streamable HTTP was not verified in this session. Do not promote beyond RC or claim the reported Qwen runtime regression is fixed in-browser until the manual runtime matrix is completed.
