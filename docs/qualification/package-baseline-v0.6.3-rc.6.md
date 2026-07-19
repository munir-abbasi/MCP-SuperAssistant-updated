# Package Baseline Evidence for v0.6.3-rc.6

Status: release-candidate package/archive, deterministic instruction-template, and package/protocol evidence only. This document records automated build, package, manifest, icon, archive integrity, and Qwen instruction-generation evidence for `v0.6.3-rc.6`. It does not record live browser runtime qualification.

## Candidate Context

| Field | Evidence | Label |
| --- | --- | --- |
| Checkout | `/home/meer/Projects/mcp superassistant stuff/plugin-upgrade-plan/MCP-SuperAssistant-0.6.1` | Verified |
| Branch during packaging | `release/v0.6.3-rc.6` | Verified |
| Base HEAD before hotfix commit | `fb5728efab1961dd205d5cabf92d00905de4f718` (`fix(qwen): Bound incomplete function-call spinner`) | Verified |
| Current package version | `0.6.3-rc.6` | Verified |
| Manifest version fields | `version: 0.6.3`; `version_name: 0.6.3-rc.6` | Verified |
| Instruction hotfix | Qwen hosts receive strict JSONL-only instructions without `<thoughts>`, response-format scaffolding, manual-execution wording, JSON-array wording, or partial-call permission; non-Qwen generic behavior is preserved by test | Verified |
| Node required | `.nvmrc` declares `22.12.0`; root engines allow `>=22.12.0` | Verified |
| Node used | `v24.12.0`; exact `.nvmrc` runtime was not available locally | Verified |
| pnpm required/used | `9.15.1` | Verified |
| MCP SDK | `@modelcontextprotocol/sdk` `1.25.2` in `chrome-extension/package.json` | Verified |

## Final Artifacts

| Artifact | On-disk bytes | SHA-256 | Label |
| --- | ---: | --- | --- |
| `dist-zip/extension-20260719-061323.zip` (Chrome) | 2,718,272 | `531b7c620bda0ae9cc8637357b4863759fafc1486d48eed4715eba31a94d1028` | Verified |
| `dist-zip/extension-20260719-061403.xpi` (Firefox) | 2,718,318 | `ef51c6206009d6f889b95ea234da36eeacd8704cff1efbeadfb9ff8489d884c9` | Verified |

### Uncompressed Totals

| Artifact | Uncompressed bytes | File count |
| --- | ---: | ---: |
| Chrome ZIP | 5,264,266 | 19 |
| Firefox XPI | 5,264,370 | 19 |

Both archives contain the expected packaged structure: cover media, `background.js`, content assets, manifest, locale files, UI assets, and all manifest-declared icon files.

## Manifest and Icon Inspection

| Field | Chrome ZIP | Firefox XPI | Label |
| --- | --- | --- | --- |
| `manifest_version` | `3` | `3` | Verified |
| `version` | `0.6.3` | `0.6.3` | Verified |
| `version_name` | `0.6.3-rc.6` | `0.6.3-rc.6` | Verified |
| Background | `service_worker: background.js`, `type: module` | `scripts: [background.js]`, `type: module` | Verified |
| Permissions | `storage`, `clipboardWrite` | `storage`, `clipboardWrite` | Verified |
| Qwen host permission | `*://*.chat.qwen.ai/*` present | `*://*.chat.qwen.ai/*` present | Verified |
| Numeric manifest version preflight | PASS | PASS | Verified |
| Manifest icon paths | `icon-16.png`, `icon-34.png`, `icon-128.png` all present | `icon-16.png`, `icon-34.png`, `icon-128.png` all present | Verified |
| `icon-16.png` dimensions | PNG 16x16, 327 bytes | PNG 16x16, 327 bytes | Verified |

## Verification Gates

| Gate | Result | Label |
| --- | --- | --- |
| `pnpm -F chrome-extension exec node --import tsx --test tests/instruction-generator-qwen.test.ts` | PASS, 2/2 | Verified |
| `pnpm -F chrome-extension exec eslint tests/instruction-generator-qwen.test.ts` | PASS | Verified |
| `pnpm -F chrome-extension test` | PASS, 19/19 | Verified |
| `pnpm -F chrome-extension type-check` | PASS | Verified |
| `pnpm -F @extension/content-script type-check` | FAIL: broad baseline/pre-existing errors unrelated to rc6 instruction-template patch | Verified boundary |
| Targeted ESLint on `instructionGeneratorJson.ts` | FAIL: broad baseline/pre-existing lint debt in touched legacy file; new test file lint passed | Verified boundary |
| `pnpm -F chrome-extension lint` | Known broad baseline/pre-existing failure from previous pass: 849 errors; not rerun for rc6 | Verified boundary |
| `pnpm e2e` | PASS, 15/15; includes numeric manifest `version`, `version_name`, and manifest icon existence assertions | Verified |
| `pnpm e2e:firefox` | PASS, 15/15; includes numeric manifest `version`, `version_name`, and manifest icon existence assertions | Verified |
| `unzip -t dist-zip/extension-20260719-061323.zip` | PASS, no errors detected | Verified |
| `unzip -t dist-zip/extension-20260719-061403.xpi` | PASS, no errors detected | Verified |
| Packaged runtime-code-generation token scan | PASS; no `unsafe-eval`, `eval(`, `new Function`, or `Function(` hits in packaged `.js`, `.json`, or `.html` files | Verified |

## Build Warnings and Caveats

- Builds emitted the existing Browserslist/caniuse-lite stale-data warning.
- Builds emitted existing `vite-plugin-lib-assets` “file not found ... .js” warnings for TypeScript source imports using `.js` specifiers. The build completed and produced archives.
- The local Node runtime was `v24.12.0`, not the exact `.nvmrc` `22.12.0`; it satisfies the root `>=22.12.0` engine constraint but is not exact-release reproducibility evidence.
- Historical archives remain in `dist-zip/`; only the timestamped artifacts listed above are the final `v0.6.3-rc.6` artifacts from this validation pass.

## Runtime Verification Boundary

Not run in this session:

- Chrome runtime loading on `chat.qwen.ai`.
- Firefox runtime loading on `chat.qwen.ai`.
- Live confirmation that Qwen emits a complete JSONL block without copying `<thoughts>` or manual-execution wording.
- Live browser tool execution through SSE.
- Live browser tool execution through Streamable HTTP.
- Background service-worker suspension/restart behavior in a real browser.

Do not promote `v0.6.3-rc.6` beyond release-candidate status until the live browser/runtime matrix is completed.
