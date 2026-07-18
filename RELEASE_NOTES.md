# MCP SuperAssistant v0.6.3-rc.2

This release candidate supersedes `v0.6.3-rc.1`. It preserves the reconnect/tool-call hang fix and corrects the packaged manifest version so Chrome can load the extension.

## What's changed

- Always clean up stale MCP client, plugin, transport, cache, and timers before reconnecting after discovery failure.
- Clear successful connection timeout timers instead of leaving the 30-second timer pending.
- Add regression tests for reconnect-after-discovery-failure and bounded never-resolving tool calls.
- Use numeric manifest `version` (`0.6.3`) and human-readable `version_name` (`0.6.3-rc.2`) for release-candidate builds. Chrome rejects prerelease strings in the manifest `version` field.
- Add package-contract coverage for numeric manifest versions and release-candidate `version_name` preservation.

## Verified in this session

- Targeted discovery-state test — PASS.
- `pnpm -F chrome-extension test` — PASS, 14 tests.
- `pnpm -F chrome-extension type-check` — PASS.
- Targeted ESLint for the edited discovery-state test — PASS.
- Targeted ESLint for `chrome-extension/manifest.ts` — PASS.
- `pnpm e2e` — PASS, 15 tests.
- `pnpm e2e:firefox` — PASS, 15 tests.
- Final artifacts:
  - Chrome ZIP: `dist-zip/extension-20260718-155015.zip`, SHA-256 `a4ae7e07c44f083b2a6342f6dcea2ced9a146f8ecf5ff8af0342ffe303f2ff0f`.
  - Firefox XPI: `dist-zip/extension-20260718-155051.xpi`, SHA-256 `afad6c7664c6823df95ab031c39283504ed8cde1d4f104fd61aef2ae114658f2`.
  - Packaged manifest preflight: `version` is `0.6.3`, `version_name` is `0.6.3-rc.2`, Qwen host permission is present, and archive integrity checks pass.

## Not verified in this session

- Chrome runtime on chat.qwen.ai.
- Firefox runtime on chat.qwen.ai.
- Live SSE and Streamable HTTP tool execution through the browser extension.
- Repository-wide package lint: `pnpm -F chrome-extension lint` still fails on broad baseline/pre-existing lint debt.
- Exact `.nvmrc` runtime reproducibility: local build used Node `v24.12.0`; `.nvmrc` declares `22.12.0`.

Do not promote this candidate beyond RC status until the browser/runtime matrix is manually verified.
