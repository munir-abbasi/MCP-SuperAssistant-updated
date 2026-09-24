# Changelog

All notable changes to **MCP SuperAssistant** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [0.7.0] — 2026-09-24

### Added
- Operation identity and attempt tracking across renderer, content, background, and MCP
  client boundaries.
- Persistent C1–C6 delivery receipts, destination-bound recovery, and operation
  observation tooling.
- Regression coverage for single dispatch, delivery recovery, effect-safe observation,
  MCP client state transitions, discovery, and browser-safe manifest versions.
- Agent control documentation, a machine-readable control map, scoped qualification
  evidence, the Stage 10 benchmark harness, and the `agent:inspect` command.
- A fast GitHub Actions gate for type-checking, node regression tests, and linting on
  `main`.

### Changed
- Consolidated workflow triggers on `main` and restored the Husky pre-commit hook.
- Encoded package SemVer as a browser-safe four-component manifest version while
  retaining the release label in `version_name`.
- Removed the unused Firebase dependency graph from the lockfile and normalized source
  formatting through the repaired hook.

### Security
- Enforced hard single dispatch for tool calls when execution effects are unknown.
- Ignored local browser profiles, agent state, probes, and test artifacts to prevent
  accidental publication.

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

[Unreleased]: https://github.com/munir-abbasi/MCP-SuperAssistant-updated/compare/v0.7.0...HEAD
[0.7.0]: https://github.com/munir-abbasi/MCP-SuperAssistant-updated/releases/tag/v0.7.0
[0.6.2-rc.1-fork]: https://github.com/munir-abbasi/MCP-SuperAssistant-updated
[0.6.2]: https://github.com/srbhptl39/MCP-SuperAssistant/releases/tag/v0.6.2
[0.6.2-rc.1-upstream]: https://github.com/srbhptl39/MCP-SuperAssistant/releases/tag/v0.6.2-rc.1
[0.6.1]: https://github.com/srbhptl39/MCP-SuperAssistant/releases/tag/v0.6.1
