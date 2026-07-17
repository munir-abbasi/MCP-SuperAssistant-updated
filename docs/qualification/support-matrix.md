# MCP SuperAssistant Qualification Support Matrix

Status: qualification baseline for v0.6.2-rc.1.

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
| Active branch | `main` | Verified: `git branch --show-current` |
| HEAD | `6abee1dfc1bdb7287c450e1b5794369b4e93e02f` (commit for v0.6.2-rc.1) | Verified: `git rev-parse HEAD` |
| Package version | `0.6.2-rc.1` | Verified: root and extension package manifests |
| Node required | `.nvmrc` `22.12.0`; engines `>=22.12.0` | Verified: `.nvmrc`, root `package.json` |
| Node available in this pass | `v24.12.0` | Verified: `node -v` |
| pnpm required/available | `9.15.1` / `9.15.1` | Verified: root `packageManager`, `pnpm -v` |
| Lockfile SHA-256 | `f9644871e1255c090e2eb1de91559d278e25fb5a2d23d70acf2c03821c9af972` | Verified: `sha256sum pnpm-lock.yaml` |

## Browser and artifact matrix

| Browser | OS | Artifact | Artifact hash | Install/load verification | Runtime verification | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Chrome/Chromium | Linux (ungoogled-chromium) | First candidate build from dirty checkout | Recorded in `package-baseline-v0.6.2-rc.1.md` | **Manual**: extension loaded, content scripts activated | **Manual**: filesystem MCP server discovered and executed tool calls on Z.ai, Qwen AI, Gemini | **Partially qualified** (manual) | Manual test: custom instructions → chat interface requested file audit → filesystem MCP tool calls activated and completed. Need guided browser protocol for full flow verification. |
| Firefox stable | Linux | Final candidate XPI | Unknown | Unknown | Unknown | Not qualified yet | No current real-browser run recorded in this pass |

Notes:

- Temporary installation of an unsigned Firefox XPI does not prove store installability.
- Archive integrity does not prove runtime behavior.
- Chrome and Firefox must be qualified separately from the same candidate commit and matching fixture scenarios.

## Transport matrix

| Transport | Scenario | Current qualification status | Release blocker? | Evidence |
| --- | --- | --- | --- | --- |
| Streamable HTTP | JSON response framing | Deterministic test pass in this tranche | Yes, for release promotion | `pnpm -F chrome-extension test` passed after the discovery-state tranche |
| Streamable HTTP | SSE-framed POST response | Deterministic test pass in this tranche | Yes, for release promotion | `pnpm -F chrome-extension test` passed after the discovery-state tranche |
| Streamable HTTP | `tools/list` failure with advertised tools | Deterministic test pass in this tranche; browser runtime still unqualified | Yes | `chrome-extension/tests/mcp-client-discovery-state.test.ts`; `pnpm -F chrome-extension test` passed 7/7 |
| Streamable HTTP | stale cache followed by discovery failure | Deterministic test pass in this tranche; browser runtime still unqualified | Yes | `chrome-extension/tests/mcp-client-discovery-state.test.ts`; `pnpm -F chrome-extension test` passed 7/7 |
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
| Gemini/AiStudio | `gemini.google.com` | Manual: content script activated, tool call completed | Manual: filesystem MCP tools executed via gemini.google.com editor | Keep as experimental pending full adapter contract |
| Z.ai | Manifest match | Manual: content script activated, tool call completed | Manual: filesystem MCP tools executed | Keep as experimental pending full adapter contract |
| Qwen AI | Manifest match | Manual: content script activated, tool call completed | Manual: filesystem MCP tools executed | Keep as experimental pending full adapter contract |

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

v0.6.2-rc.1 is published as a pre-release. The discovery-state fix, package-contract E2E guard, and qualification documentation suite are complete. Chrome runtime has first manual browser evidence: filesystem MCP server discovered and executed tool calls on Z.ai, Qwen AI, and Gemini. The remaining blocking items for promoting to v0.6.2 stable are: Firefox runtime qualification, full guided browser protocol (Chrome + Firefox), supported-site adapter contract verification, lifecycle/exactly-once coverage, legacy SSE/WebSocket transport testing, payload budget coverage, and security/privacy review.
