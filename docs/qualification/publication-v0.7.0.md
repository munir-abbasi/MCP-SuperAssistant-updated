# Publication Receipt — v0.7.0

**Evidence contract:** `docs/qualification/README.md`. Repository/publication scope only; this
receipt does not qualify runtime, browser, site, or transport behavior.

| Field | Value |
|---|---|
| `receipt_id` | `PUBLICATION-V070-2026-09-24-1` |
| `claim` | v0.7.0 published to `munir-abbasi/MCP-SuperAssistant-updated`; the commit series is verified green on hosted CI for revision `5b5b4df`; scope: repository/publication, not runtime qualification |
| `owner` | `REPOSITORY_PUBLICATION` |
| `scope` | Repository topology (branch `main`, tag `v0.7.0`, remote refs), GitHub-hosted workflows on `ubuntu-latest` / Node 22.12.0 (`.nvmrc`), and clean-checkout gates (install + type-check + node tests). Local verification ran on Node 24.18.0. No browser/site/transport dimension is claimed. |
| `revision` | `main` @ `5b5b4df` (published tip, CI-green). Tag `v0.7.0` @ `7a5bfbe` — differs from the green tip by exactly the one-line `turbo.json` `type-check → ready` dependency added in `5b5b4df` (pipeline-only; no runtime or built-artifact delta). |
| `evidence` | `git ls-remote upstream` (`refs/heads/main`, `refs/tags/v0.7.0`); hosted CI run `36036318492` **success** @ `5b5b4df` (job `Type Check, Node Tests, and Lint`); prior run `36033664931` **failure** @ `7a5bfbe` (`@extension/i18n` TS2307 on clean checkout — root cause fixed by `5b5b4df`); `build-zip` run `36036318493` **success** with attached artifact (2,571,076 bytes); format-validation run `36036318575` **success**; e2e run `36036318497` **failure** (workflow lacks `playwright install`; identical failure pre-dates this work — 2026-07-30 dependabot run; recorded as backlog in `DIAGNOSIS.md`); fresh `git clone` from the remote URL @ `5b5b4df` → `pnpm install --frozen-lockfile && pnpm type-check` (21/21 tasks) `&& pnpm --filter chrome-extension test` (23/23 pass) green; GitHub contents spot-check at ref `5b5b4df` for `AGENTS.md`, `docs/agent-control-map.yaml`, `docs/qualification/ergonomics-benchmark.md`, `packages/e2e/benchmark-agent.mjs`, and `chrome-extension/tests/` |
| `observed_at` | 2026-09-24 |
| `status` | `verified-scoped` — directly verified for repository/publication scope at the stated revisions only |
| `uncertainty` | Hosted e2e workflow remains red (workflow-level browser-install gap, backlog — not a push blocker per plan); tag `v0.7.0` points at `7a5bfbe`, whose own CI run is red (pipeline-only delta to the green tip); remote `master` ref intentionally retained pending a follow-up pass; local Node 24.18.0 vs CI Node 22.12.0 is covered by the hosted run only |
| `invalidates_on` | Rewrite/move of `main` or tag `v0.7.0`; workflow (`ci.yml`/`build-zip`/format) changes; lockfile, `.nvmrc`, or Node-major changes; repository transfer/visibility change |
| `supersedes` | n/a |
