# Changelog

All notable changes to **MCP SuperAssistant** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Removed
- **Stale root-level docs**: `stabilization_status.md`, `STABILIZATION_STATUS.md`,
  `TROUBLESHOOTING_PLAN.md`, `WORKING_DIRECTORIES.md` — WP4-era debris, superseded by
  DEFERRED_ISSUES.md and current documentation.

### Added
- CHANGELOG.md and RELEASE_NOTES.md for the fork.
- DEFERRED_ISSUES.md — comprehensive audit of 79 upstream open issues against the fork's codebase, classified by fix status (Fixed/Partial/Open/Won't Fix) with evidence and code references.

### Fixed
- **E2E tests**: Fixed extension path (`dist/chrome` → `dist`) and updated test to verify
  service worker + manifest instead of navigating to non-existent options page.
  (Playwright browser download deferred — see `packages/e2e/README.md`.)

---

## [0.6.2-rc.1-fork] — 2026-07-30 — Fork Cleanup Release

Current release of the `munir-abbasi/MCP-SuperAssistant-updated` fork.

### Added
- `chrome-extension/public/icon-16.png` — required 16px extension icon
  (was referenced in manifest but missing from repo).

### Changed
- **README**: Fully rewritten for this fork — corrected 15+ typos/grammar errors,
  added "Improvements Over the Original" section, added Kagi to supported platforms,
  removed stale store-download badges, clarified proxy status.
- **LICENSE**: Dual copyright `2025 Saurabh Patel` + `2026 Munir Abbasi`.
- **GitHub config**: `FUNDING.yml`, `CODEOWNERS`, `auto_assign.yml` → `@munir-abbasi`.
- **Package URL**: repository field points to `munir-abbasi/MCP-SuperAssistant-updated`.

### Removed
- **Non-extension files stripped from git tracking**: `plugin-upgrade-plan/`,
  `troubleshoot-mcp-superassistant/`, `scratch/`, `docs/`, `.codegraph`, `.omo/`,
  `MCP-SuperAssistant-*-source.tar.gz`, `STABILIZATION_STATUS.md`.
- **Firebase Remote Config dead code**: Deleted `firebase-remote-config-api.ts` and
  `remote-config-manager.ts` (962 lines, REST-based, never enabled). Removed unused
  `"firebase": "^11.9.1"` npm dependency. Stripped all related imports, variables,
  initialization, and message handlers from background/index.ts (1185 → 1033 lines).

### Fixed
- **Lint errors**: 736 → 0. Fixed 602 auto-fixable errors (prettier formatting),
  removed unused imports/variables, removed unused functions, deleted duplicate
  export, fixed `Function` type, fixed `import()` type annotations, removed unused
  code, added file-level eslint-disable for `no-explicit-any` in MCP client files
  (legitimate JSON-RPC dynamic payload handling), added eslint-disable for public
  `.js` files in `chrome-extension/public/`.
- **Branch cleanup**: Deleted all branches except `master` locally and on remote;
  `main`/`master` aligned on remote via force-push.
- **Git history**: Purged 37+ non-extension files from history via `git filter-repo`
  (reduced clone size).

---

## [0.6.2] — 2026-07-17

### Changed
- Stable release of WP4 stabilization, MCP protocol hardening, and Qwen fixes.

---

## [0.6.2-rc.1-upstream] — 2026-07-17 (Upstream Baseline)

### Added
- WP4 implementation: truthful discovery, CSP-safe schema validation,
  reconnect/cancellation/exactly-once state machine, Streamable HTTP
  framing tests.

---

## [0.6.1] — 2026-07-15

### Added
- Initial stable release of MCP SuperAssistant.
- MCP client with EventEmitter, PluginRegistry, SSE/WebSocket/Streamable HTTP
  transport plugins.
- Chrome Extension MV3 with background service worker.
- Integration with Gemini, z.ai, Qwen, Kagi, and other MCP-enabled platforms.
- Proxy package (`@srbhptl39/mcp-superassistant-proxy`).
- Test fixtures and protocol-level verification.

### Known Limitations (at v0.6.1)
- Browser E2E is a Playwright + MV3 platform limitation (event-driven service
  workers, no persistent popup/options page). Protocol behavior covered by
  fixture-server tests.

---

[Unreleased]: https://github.com/munir-abbasi/MCP-SuperAssistant-updated
[0.6.2-rc.1-fork]: https://github.com/munir-abbasi/MCP-SuperAssistant-updated
[0.6.2]: https://github.com/srbhptl39/MCP-SuperAssistant/releases/tag/v0.6.2
[0.6.2-rc.1-upstream]: https://github.com/srbhptl39/MCP-SuperAssistant/releases/tag/v0.6.2-rc.1
[0.6.1]: https://github.com/srbhptl39/MCP-SuperAssistant/releases/tag/v0.6.1
