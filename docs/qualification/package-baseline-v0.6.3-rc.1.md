# Package Baseline Evidence for v0.6.3-rc.1

Superseded: this candidate was package/archive-verified but not browser-loadable in Chrome because the manifest `version` was `0.6.3-rc.1`. Chrome requires numeric dot-separated manifest versions. Use `v0.6.3-rc.4` or later.

Status: release-candidate package/archive evidence only. This document records automated build, package, manifest, and archive integrity evidence for `v0.6.3-rc.1`. It does not record live browser runtime qualification.

## Candidate Context

| Field | Evidence | Label |
| --- | --- | --- |
| Checkout | `/home/meer/Projects/mcp superassistant stuff/plugin-upgrade-plan/MCP-SuperAssistant-0.6.1` | Verified |
| Branch | `main` | Verified |
| HEAD | `4db531752924d288d8cd265fc5706bf6498afc4c` (`release: v0.6.2`) | Verified |
| Working tree | Dirty before this fix; pre-existing user-owned changes were preserved and included in the candidate artifacts | Verified |
| Current package/manifest version | `0.6.3-rc.1` | Verified |
| Node required | `.nvmrc` declares `22.12.0`; root engines allow `>=22.12.0` | Verified |
| Node used | `v24.12.0`; exact `.nvmrc` runtime was not available locally | Verified |
| pnpm required/used | `9.15.1` | Verified |
| MCP SDK | `@modelcontextprotocol/sdk` `1.25.2` in `chrome-extension/package.json` | Verified |

## Final Artifacts

| Artifact | On-disk bytes | SHA-256 | Label |
| --- | ---: | --- | --- |
| `dist-zip/extension-20260718-152459.zip` (Chrome) | 2,717,257 | `823ac9ff14984d92c755393d309366bd3c8f3da8e52b9fa2eb37a51bb94d1f93` | Verified |
| `dist-zip/extension-20260718-152536.xpi` (Firefox) | 2,717,276 | `f231674de060c198645c5ac64a57ce732ffcce245a4f4bc518c7c91d2fc3ae97` | Verified |

### Uncompressed Totals

| Artifact | Uncompressed bytes | File count |
| --- | ---: | ---: |
| Chrome ZIP | 5,262,057 | 18 |
| Firefox XPI | 5,262,161 | 18 |

Both archives contain the expected packaged structure: cover media, `background.js`, content assets, manifest, locale files, and UI assets.

## Manifest Inspection

| Field | Chrome ZIP | Firefox XPI | Label |
| --- | --- | --- | --- |
| `manifest_version` | `3` | `3` | Verified |
| `version` | `0.6.3-rc.1` | `0.6.3-rc.1` | Verified |
| Background | `service_worker: background.js`, `type: module` | `scripts: [background.js]`, `type: module` | Verified |
| Permissions | `storage`, `clipboardWrite` | `storage`, `clipboardWrite` | Verified |
| Qwen host permission | `*://*.chat.qwen.ai/*` present | `*://*.chat.qwen.ai/*` present | Verified |

## Verification Gates

| Gate | Result | Label |
| --- | --- | --- |
| `pnpm -F chrome-extension exec eslint tests/mcp-client-discovery-state.test.ts` | PASS | Verified |
| `pnpm -F chrome-extension exec node --import tsx --test tests/mcp-client-discovery-state.test.ts` | PASS, 4/4 | Verified |
| `pnpm -F chrome-extension test` | PASS, 14/14 | Verified |
| `pnpm -F chrome-extension type-check` | PASS | Verified |
| `pnpm -F chrome-extension lint` | FAIL, 849 broad baseline/pre-existing errors | Verified |
| `pnpm zip` | PASS; superseded by final Chrome E2E build artifact | Verified |
| `pnpm zip:firefox` | PASS; superseded by final Firefox E2E build artifact | Verified |
| `pnpm e2e` | PASS, 15/15 after removing the redundant raw fixture reachability check | Verified |
| `pnpm e2e:firefox` | PASS, 15/15 after the same E2E harness fix | Verified |
| `unzip -t dist-zip/extension-20260718-152459.zip` | PASS, no errors detected | Verified |
| `unzip -t dist-zip/extension-20260718-152536.xpi` | PASS, no errors detected | Verified |
| Packaged runtime-code-generation token scan | PASS; no `unsafe-eval`, `eval(`, `new Function`, or `Function(` hits in packaged `.js`, `.json`, or `.html` files | Verified |

## Build Warnings and Caveats

- Builds emitted the existing Browserslist/caniuse-lite stale-data warning.
- Builds emitted existing `vite-plugin-lib-assets` “file not found ... .js” warnings for TypeScript source imports using `.js` specifiers. The build completed and produced archives.
- The local Node runtime was `v24.12.0`, not the exact `.nvmrc` `22.12.0`; it satisfies the root `>=22.12.0` engine constraint but is not exact-release reproducibility evidence.
- Historical archives remain in `dist-zip/`; only the timestamped artifacts listed above are the final `v0.6.3-rc.1` artifacts from this validation pass.

## Runtime Verification Boundary

Not run in this session:

- Chrome runtime loading on `chat.qwen.ai`.
- Firefox runtime loading on `chat.qwen.ai`.
- Live browser tool execution through SSE.
- Live browser tool execution through Streamable HTTP.
- Background service-worker suspension/restart behavior in a real browser.

Do not promote `v0.6.3-rc.1` beyond release-candidate status until the live browser/runtime matrix is completed.
