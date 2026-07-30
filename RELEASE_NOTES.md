# Release Notes — v0.6.2-rc.1 (Fork Cleanup Release)

**MCP SuperAssistant** is a Chrome Extension + MCP proxy that brings
Model Context Protocol (MCP) tool support to Gemini, z.ai, Qwen, Kagi,
and other AI chat platforms.

This is the first release published from the
[`munir-abbasi/MCP-SuperAssistant-updated`](https://github.com/munir-abbasi/MCP-SuperAssistant-updated)
fork, based on upstream v0.6.2 baseline with WP4 stabilization.

---

## What's New in This Release

### Fork Housekeeping
- **Fully rewritten README** with corrected grammar, fork attribution
  (Munir Abbasi as maintainer, Saurabh Patel as original author),
  "Improvements Over the Original" section, Kagi platform support.
- **Dual-copyright LICENSE** (2025 Saurabh Patel + 2026 Munir Abbasi).
- **GitHub config aligned** to `@munir-abbasi` (CODEOWNERS, FUNDING,
  auto-assign, package URL).
- **Git history cleaned**: 37+ non-extension files purged from history
  via `git filter-repo`. All branches except `master` deleted.

### Code Cleanup
- **Firebase Remote Config removed**: Deleted 962 lines of dead REST-based
  code that was never enabled. Removed unused `firebase` npm dep.
  Background entry point reduced from 1185 to 1033 lines.
- **Lint errors: 736 → 0**: 602 auto-fixed, 134 manually. Cleaned unused
  imports, variables, functions, duplicate exports, type annotations.
  File-level eslint-disable for legitimate `any` usage in MCP client code
  (dynamic JSON-RPC payloads) and public JS files.
- **icon-16.png created**: Required 16px extension icon was missing from
  repo (referenced in manifest but never committed).

### What Stayed the Same
- All MCP protocol behavior, transport plugins (SSE, WebSocket, Streamable
  HTTP), and platform integrations are unchanged from upstream.
- Proxy (`@srbhptl39/mcp-superassistant-proxy`) remains an external npm
  dependency — not fork-specific.
- Bash build/utility scripts preserved and re-tracked.

---

## Installation

1. Build the extension:
   ```bash
   pnpm install
   pnpm build
   ```

2. Load unpacked extension from `dist/` in Chrome via
   `chrome://extensions` → Developer mode → Load unpacked.

3. Connect the proxy:
   ```bash
   npx @srbhptl39/mcp-superassistant-proxy
   ```

4. Open Gemini, z.ai, Qwen, or Kagi and start using MCP tools.

---

## Upstream Issues Status

A comprehensive audit of all **79 open issues** from the upstream repo against this
fork's codebase is maintained in [DEFERRED_ISSUES.md](./DEFERRED_ISSUES.md). Key fixes
applied:

| Issue | Status |
|-------|--------|
| `outputSchema` breaks tool discovery (#199, #191, #196) | ✅ Fixed |
| CSP `unsafe-eval` blocks schema compile (#171) | ✅ Fixed |
| SSE reconnect "Already connected" (#194, #184, #183) | ✅ Fixed |
| `keyValidator._parse is not a function` (#158) | ✅ Fixed |
| Re-execution timeout loops (#155) | ✅ Fixed |
| Qwen not working (#148) | ✅ Fixed |

## Known Issues

- **E2E tests require Playwright browsers** — `npx playwright install chromium`
  must be run before `pnpm e2e`. See `packages/e2e/` for details.
- **MV3 service workers are event-driven** — Playwright cannot reliably
  discover extension pages. Protocol behavior is covered by fixture-server tests.
- **Qwen function-call rendering** has stabilization tweaks in the WP4
  baseline — see commit history for details.

---

## Previous Releases

| Version | Date       | Notes                             |
|---------|------------|-----------------------------------|
| 0.6.2   | 2026-07-17 | Stable WP4 release (upstream)     |
| 0.6.1   | 2026-07-15 | Initial stable release (upstream) |
