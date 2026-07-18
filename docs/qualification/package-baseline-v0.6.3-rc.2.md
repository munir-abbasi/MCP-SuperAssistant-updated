# Package Baseline Evidence for v0.6.3-rc.2

> Superseded: `v0.6.3-rc.2` was package/archive-verified for numeric manifest version fields but was not Chrome-loadable because the manifest referenced `icon-16.png` and the ZIP/XPI did not include that file. Use `v0.6.3-rc.5` or later.

Status: release-candidate package/archive evidence only. This document records automated build, package, manifest, and archive integrity evidence for `v0.6.3-rc.2`. It does not record live browser runtime qualification.

## Candidate Context

| Field | Evidence | Label |
| --- | --- | --- |
| Checkout | `/home/meer/Projects/mcp superassistant stuff/plugin-upgrade-plan/MCP-SuperAssistant-0.6.1` | Verified |
| Branch during packaging | `release/v0.6.3-rc.2` | Verified |
| Base HEAD before hotfix commit | `e24c6d1fb6f198c4c29e7e7484b0f7954a01cfcf` (`fix(mcp): Repair reconnect after discovery failure`) | Verified |
| Current package version | `0.6.3-rc.2` | Verified |
| Manifest version fields | `version: 0.6.3`; `version_name: 0.6.3-rc.2` | Verified |
| Node required | `.nvmrc` declares `22.12.0`; root engines allow `>=22.12.0` | Verified |
| Node used | `v24.12.0`; exact `.nvmrc` runtime was not available locally | Verified |
| pnpm required/used | `9.15.1` | Verified |
| MCP SDK | `@modelcontextprotocol/sdk` `1.25.2` in `chrome-extension/package.json` | Verified |

## Final Artifacts

| Artifact | On-disk bytes | SHA-256 | Label |
| --- | ---: | --- | --- |
| `dist-zip/extension-20260718-155015.zip` (Chrome) | 2,717,265 | `a4ae7e07c44f083b2a6342f6dcea2ced9a146f8ecf5ff8af0342ffe303f2ff0f` | Verified |
| `dist-zip/extension-20260718-155051.xpi` (Firefox) | 2,717,284 | `afad6c7664c6823df95ab031c39283504ed8cde1d4f104fd61aef2ae114658f2` | Verified |

### Uncompressed Totals

| Artifact | Uncompressed bytes | File count |
| --- | ---: | ---: |
| Chrome ZIP | 5,262,084 | 18 |
| Firefox XPI | 5,262,188 | 18 |

Both archives contain the expected packaged structure: cover media, `background.js`, content assets, manifest, locale files, and UI assets.

## Manifest Inspection

| Field | Chrome ZIP | Firefox XPI | Label |
| --- | --- | --- | --- |
| `manifest_version` | `3` | `3` | Verified |
| `version` | `0.6.3` | `0.6.3` | Verified |
| `version_name` | `0.6.3-rc.2` | `0.6.3-rc.2` | Verified |
| Background | `service_worker: background.js`, `type: module` | `scripts: [background.js]`, `type: module` | Verified |
| Permissions | `storage`, `clipboardWrite` | `storage`, `clipboardWrite` | Verified |
| Qwen host permission | `*://*.chat.qwen.ai/*` present | `*://*.chat.qwen.ai/*` present | Verified |
| Numeric manifest version preflight | PASS | PASS | Verified |

## Verification Gates

| Gate | Result | Label |
| --- | --- | --- |
| `pnpm -F chrome-extension exec eslint manifest.ts` | PASS | Verified |
| `pnpm -F chrome-extension test` | PASS, 14/14 | Verified |
| `pnpm -F chrome-extension type-check` | PASS | Verified |
| `pnpm -F chrome-extension lint` | Known broad baseline/pre-existing failure from previous pass: 849 errors; not rerun for rc.2 | Verified boundary |
| `pnpm e2e` | PASS, 15/15; includes numeric manifest `version` and `version_name` assertions | Verified |
| `pnpm e2e:firefox` | PASS, 15/15; includes numeric manifest `version` and `version_name` assertions | Verified |
| `unzip -t dist-zip/extension-20260718-155015.zip` | PASS, no errors detected | Verified |
| `unzip -t dist-zip/extension-20260718-155051.xpi` | PASS, no errors detected | Verified |
| Packaged runtime-code-generation token scan | PASS; no `unsafe-eval`, `eval(`, `new Function`, or `Function(` hits in packaged `.js`, `.json`, or `.html` files | Verified |

## Build Warnings and Caveats

- Builds emitted the existing Browserslist/caniuse-lite stale-data warning.
- Builds emitted existing `vite-plugin-lib-assets` “file not found ... .js” warnings for TypeScript source imports using `.js` specifiers. The build completed and produced archives.
- The local Node runtime was `v24.12.0`, not the exact `.nvmrc` `22.12.0`; it satisfies the root `>=22.12.0` engine constraint but is not exact-release reproducibility evidence.
- Historical archives remain in `dist-zip/`; only the timestamped artifacts listed above are the final `v0.6.3-rc.2` artifacts from this validation pass.

## Runtime Verification Boundary

Not run in this session:

- Chrome runtime loading on `chat.qwen.ai`.
- Firefox runtime loading on `chat.qwen.ai`.
- Live browser tool execution through SSE.
- Live browser tool execution through Streamable HTTP.
- Background service-worker suspension/restart behavior in a real browser.

Do not promote `v0.6.3-rc.2` beyond release-candidate status until the live browser/runtime matrix is completed.
