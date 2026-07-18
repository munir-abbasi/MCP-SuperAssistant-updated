# MCP SuperAssistant v0.6.3-rc.1

This release candidate addresses a post-v0.6.2 reconnect/tool-call hang class observed after primitive discovery failure.

## What's changed

- Always clean up stale MCP client, plugin, transport, cache, and timers before reconnecting after discovery failure.
- Clear successful connection timeout timers instead of leaving the 30-second timer pending.
- Add regression tests for reconnect-after-discovery-failure and bounded never-resolving tool calls.

## Verified in this session

- Targeted discovery-state test — PASS.
- `pnpm -F chrome-extension test` — PASS, 14 tests.
- `pnpm -F chrome-extension type-check` — PASS.
- Targeted ESLint for the edited discovery-state test — PASS.
- `pnpm e2e` — PASS, 15 tests.
- `pnpm e2e:firefox` — PASS, 15 tests.
- Final artifacts:
  - Chrome ZIP: `dist-zip/extension-20260718-152459.zip`, SHA-256 `823ac9ff14984d92c755393d309366bd3c8f3da8e52b9fa2eb37a51bb94d1f93`.
  - Firefox XPI: `dist-zip/extension-20260718-152536.xpi`, SHA-256 `f231674de060c198645c5ac64a57ce732ffcce245a4f4bc518c7c91d2fc3ae97`.

## Not verified in this session

- Chrome runtime on chat.qwen.ai.
- Firefox runtime on chat.qwen.ai.
- Live SSE and Streamable HTTP tool execution through the browser extension.
- Repository-wide package lint: `pnpm -F chrome-extension lint` still fails on broad baseline/pre-existing lint debt.
- Exact `.nvmrc` runtime reproducibility: local build used Node `v24.12.0`; `.nvmrc` declares `22.12.0`.

Do not promote this candidate beyond RC status until the browser/runtime matrix is manually verified.
