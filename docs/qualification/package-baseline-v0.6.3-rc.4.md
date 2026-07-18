# Package Baseline Evidence for v0.6.3-rc.4

Superseded: `v0.6.3-rc.4` improved Qwen JSONL extraction but was followed by a live Qwen report where an incomplete function block still showed a continuous spinner. Use `v0.6.3-rc.5` or later.

Status: release-candidate package/archive and deterministic parser evidence only. This document records automated build, package, manifest, icon, archive integrity, and Qwen-style JSONL parser regression evidence for `v0.6.3-rc.4`. It does not record live browser runtime qualification.

## Candidate Context

| Field | Evidence | Label |
| --- | --- | --- |
| Checkout | `/home/meer/Projects/mcp superassistant stuff/plugin-upgrade-plan/MCP-SuperAssistant-0.6.1` | Verified |
| Branch during packaging | `release/v0.6.3-rc.4` | Verified |
| Base HEAD before hotfix commit | `faf57d828739b8be7e47980d6b6992b981ce5499` (`fix(manifest): Include required 16px extension icon`) | Verified |
| Current package version | `0.6.3-rc.4` | Verified |
| Manifest version fields | `version: 0.6.3`; `version_name: 0.6.3-rc.4` | Verified |
| Parser hotfix | JSON function-call extraction uses normalized JSON object candidates before deriving function name, call ID, description, and parameters | Verified |
| Node required | `.nvmrc` declares `22.12.0`; root engines allow `>=22.12.0` | Verified |
| Node used | `v24.12.0`; exact `.nvmrc` runtime was not available locally | Verified |
| pnpm required/used | `9.15.1` | Verified |
| MCP SDK | `@modelcontextprotocol/sdk` `1.25.2` in `chrome-extension/package.json` | Verified |

## Final Artifacts

| Artifact | On-disk bytes | SHA-256 | Label |
| --- | ---: | --- | --- |
| `dist-zip/extension-20260718-172428.zip` (Chrome) | 2,717,699 | `ba5530e82bcc5cc0e1fc7b26f86d8c7037c266770ccbee867b827eb45f133f9e` | Verified |
| `dist-zip/extension-20260718-172505.xpi` (Firefox) | 2,717,745 | `da289526b1107729531c47f2cafd44ad26a6274ec1eeb8f5bc6018fbe3db3f62` | Verified |

### Uncompressed Totals

| Artifact | Uncompressed bytes | File count |
| --- | ---: | ---: |
| Chrome ZIP | 5,262,378 | 19 |
| Firefox XPI | 5,262,482 | 19 |

Both archives contain the expected packaged structure: cover media, `background.js`, content assets, manifest, locale files, UI assets, and all manifest-declared icon files.

## Manifest and Icon Inspection

| Field | Chrome ZIP | Firefox XPI | Label |
| --- | --- | --- | --- |
| `manifest_version` | `3` | `3` | Verified |
| `version` | `0.6.3` | `0.6.3` | Verified |
| `version_name` | `0.6.3-rc.4` | `0.6.3-rc.4` | Verified |
| Background | `service_worker: background.js`, `type: module` | `scripts: [background.js]`, `type: module` | Verified |
| Permissions | `storage`, `clipboardWrite` | `storage`, `clipboardWrite` | Verified |
| Qwen host permission | `*://*.chat.qwen.ai/*` present | `*://*.chat.qwen.ai/*` present | Verified |
| Numeric manifest version preflight | PASS | PASS | Verified |
| Manifest icon paths | `icon-16.png`, `icon-34.png`, `icon-128.png` all present | `icon-16.png`, `icon-34.png`, `icon-128.png` all present | Verified |
| `icon-16.png` dimensions | PNG 16x16, 327 bytes | PNG 16x16, 327 bytes | Verified |

## Verification Gates

| Gate | Result | Label |
| --- | --- | --- |
| `pnpm -F chrome-extension exec node --import tsx --test tests/json-function-parser.test.ts` | PASS, 2/2 | Verified |
| Manual parser reproduction for polluted compact JSONL | PASS: extracts `list_directory`, call ID `1`, and `{ path: '.' }` after patch | Verified |
| `pnpm -F chrome-extension exec eslint tests/json-function-parser.test.ts` | PASS | Verified |
| `pnpm -F chrome-extension test` | PASS, 16/16 | Verified |
| `pnpm -F chrome-extension type-check` | PASS | Verified |
| `pnpm -F @extension/content-script type-check` | FAIL: broad baseline/pre-existing errors unrelated to rc4 parser patch | Verified boundary |
| Targeted ESLint on changed parser/renderer source | FAIL: broad baseline/pre-existing lint debt in touched legacy files; new test file lint passed | Verified boundary |
| `pnpm -F chrome-extension lint` | Known broad baseline/pre-existing failure from previous pass: 849 errors; not rerun for rc4 | Verified boundary |
| `pnpm e2e` | PASS, 15/15; includes numeric manifest `version`, `version_name`, and manifest icon existence assertions | Verified |
| `pnpm e2e:firefox` | PASS, 15/15; includes numeric manifest `version`, `version_name`, and manifest icon existence assertions | Verified |
| `unzip -t dist-zip/extension-20260718-172428.zip` | PASS, no errors detected | Verified |
| `unzip -t dist-zip/extension-20260718-172505.xpi` | PASS, no errors detected | Verified |
| Packaged runtime-code-generation token scan | PASS; no `unsafe-eval`, `eval(`, `new Function`, or `Function(` hits in packaged `.js`, `.json`, or `.html` files | Verified |

## Build Warnings and Caveats

- Builds emitted the existing Browserslist/caniuse-lite stale-data warning.
- Builds emitted existing `vite-plugin-lib-assets` “file not found ... .js” warnings for TypeScript source imports using `.js` specifiers. The build completed and produced archives.
- The local Node runtime was `v24.12.0`, not the exact `.nvmrc` `22.12.0`; it satisfies the root `>=22.12.0` engine constraint but is not exact-release reproducibility evidence.
- Historical archives remain in `dist-zip/`; only the timestamped artifacts listed above are the final `v0.6.3-rc.4` artifacts from this validation pass.

## Runtime Verification Boundary

Not run in this session:

- Chrome runtime loading on `chat.qwen.ai`.
- Firefox runtime loading on `chat.qwen.ai`.
- Live confirmation that Qwen no longer renders fallback `function` / `block-*` labels for real model output.
- Live browser tool execution through SSE.
- Live browser tool execution through Streamable HTTP.
- Background service-worker suspension/restart behavior in a real browser.

Do not promote `v0.6.3-rc.4` beyond release-candidate status until the live browser/runtime matrix is completed.
