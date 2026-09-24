# Release Notes — v0.7.0

**Release date:** 2026-09-24

MCP SuperAssistant v0.7.0 adds an end-to-end runtime operation contract, bounded
delivery recovery, agent-facing control documentation, and repository gates for the
`munir-abbasi/MCP-SuperAssistant-updated` fork.

## Highlights

### Safer Tool Execution and Delivery

- Threads logical operation and dispatch-attempt identity across renderer, content,
  background, and MCP client boundaries.
- Records monotonic C1–C6 checkpoints and persistent delivery receipts for observation
  and bounded recovery.
- Serializes delivery to the active page destination and preserves confirmed insertion
  when submission must be retried.
- Prevents blind redispatch after an ambiguous tool-call timeout or any other uncertain
  post-dispatch failure.

### Regression Coverage

- Adds tests for hard single dispatch, delivery checkpoint recovery, effect-safe
  observation, MCP client state transitions, tool discovery, and manifest version
  encoding.
- The local release gate covers the workspace type-check and 23 Chrome-extension node
  tests. Browser E2E and hosted CI results are recorded separately after publication.

### Agent and Repository Tooling

- Adds the AGENTS/SYSTEM/ARCHITECTURE/AGENT_GUIDE documentation tower, the static agent
  control map, and scoped qualification evidence.
- Ships the Stage 10 benchmark harness and the read-only `pnpm agent:inspect --json`
  Situation Packet shim.
- Introduces a fast GitHub Actions gate for type-checking, node tests, and linting on
  `main`; the separate build-artifact and browser E2E workflows stay.
- Restores the Husky pre-commit hook and excludes local browser profiles, agent state,
  probes, and generated test artifacts from version control.

### Versioning

The package release is `0.7.0`. Browser manifests use the Chrome-compatible version
`0.7.0.65535` and retain `0.7.0` in `version_name`.

## Installation

```bash
pnpm install --frozen-lockfile
pnpm build
```

Load the unpacked extension from `dist/` in a Chromium browser. Use
`pnpm build:firefox` for the Firefox-compatible MV3 artifact.

## Qualification Scope

This release does not claim universal live-site qualification. Current browser, site,
transport, and runtime evidence is scoped in [`docs/qualification/`](docs/qualification/).
Open and historical issue dispositions remain documented in
[`DEFERRED_ISSUES.md`](DEFERRED_ISSUES.md).

## Previous Releases

| Version | Date | Notes |
|---|---|---|
| 0.6.2-rc.1 | 2026-07-30 | Fork cleanup release |
| 0.6.2 | 2026-07-17 | Stable WP4 release (upstream) |
| 0.6.1 | 2026-07-15 | Initial stable release (upstream) |
