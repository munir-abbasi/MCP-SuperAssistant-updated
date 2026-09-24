# PUSH_TO_MAIN_PLAN.md — Implementation Plan for Publishing to `munir-abbasi/MCP-SuperAssistant-updated`

> **Class: plan (dated work document).** Owns the pre-push work sequence only. Facts about
> behavior, ownership, and evidence live in their canonical layers per `AGENTS.md`.
>
> Prepared 2026-09-23 against working tree `master @ be60d93`. All facts below were
> verified against the actual repository state on that date; nothing here is assumed.
>
> **HISTORICAL — executed 2026-09-24.** All steps and gates ran as written; see §7
> Execution outcome and the Evidence Receipt `docs/qualification/publication-v0.7.0.md`.

## 0. Objective

Land all durable, uncommitted work as a reviewable commit series, bring CI/branching/
versioning into a consistent state, verify safety and reproducibility, and push the
resulting history to the existing public remote so that `main` is the single source of
truth. Out of scope: creating releases/posts beyond the tag, changing runtime behavior,
fixing backlog defects listed in `DIAGNOSIS.md`.

## 1. Current state (verified)

**Git topology.** Remote `upstream` = `https://github.com/munir-abbasi/MCP-SuperAssistant-updated`
(public, exists, non-fork). Default branch `main` @ `0d40b00` — exactly **one commit behind**
local `master` @ `be60d93` (fast-forward relation confirmed: `git rev-list --count 0d40b00..master` = 1).
A stale local `merge-target` branch holds 8 commits from the older WP4-era history
(including a superseded `tests/e2e/` harness). Local clone is **shallow**. Remote tags run
`v0.6.1` … `v0.6.3-rc.6`; the tree says `0.6.2-rc.1`.

**Working tree (the real payload).** 49 modified + 36 untracked files, none of it on
GitHub. Untracked work includes the entire Stage 1–4/9 runtime operation-contract
implementation (`pages/content/src/services/{delivery-recovery,operation-observation}.ts`),
six regression test files under `chrome-extension/tests/`, the agent documentation tower
(`AGENTS.md`, `SYSTEM.md`, `ARCHITECTURE.md`, `AGENT_GUIDE.md`, `DIAGNOSIS.md`,
`AGENT_SYSTEM_DESIGN.md`, `CLAUDE.md`, `GEMINI.md`, `docs/agent-control-map.yaml`,
`docs/qualification/*`, module READMEs), the Stage 10 harness and Stage 7 shim
(`packages/e2e/benchmark-agent.mjs`, `agent-inspect.mjs`), and tool-state directories
(`.freebuff/`, `.serena/`, `.tmp/` **108 MB including a Chrome profile with cookie/login
databases under `.tmp/stage9-browser-profile-auth/`**).

**Safety posture.** `.env` is ignored (rule at `.gitignore:45`), never committed
(`git log --all -- .env` is empty), and only `.example.env` exists in history. No tarball,
zip, or `node_modules` is tracked. The 108 MB Chrome-profile data is currently untracked —
but **no `.tmp` ignore rule exists**, so the tree is one `git add -A` away from committing
credential databases. Identity is configured correctly
(`Munir Abbasi <22575093+munir-abbasi@users.noreply.github.com>`).

**CI/build posture.** Five workflows exist and are tracked. All functional triggers fire on
`main`/`dev` only — **pushes to `master` run nothing**. There is **no type-check or node
regression job** (the 23-test suite has never gated anything in CI). `prettier.yml` uses
`actions/checkout@v2` (EOL; also redundant with lint-staged). The e2e workflow runs
`pnpm e2e` (zip + Playwright). `.nvmrc` pins 22.12.0; `packageManager: pnpm@9.15.1` is set.
`.husky/pre-committ` is **misspelled**, so pre-commit prettier has silently never run.
`bash-scripts/update_version.sh` only accepts bare `0.0.0` (no `-rc` suffixes) — consistent
with a plain `0.7.0` bump. The misnamed file `pages/content/src/utils/themeDetector.ts` is
tracked while an ignored duplicate sits in `render_prescript/src/utils/`.

**Loose files (user decision: keep both local, do not ship).** `troubleshoot-mcp-superassistant/`,
ten one-off e2e probe scripts (`stage9-inspect.mjs`, `test-ack-recovery.mjs`,
`test-c6-recovery.mjs`, `list-receipts*.mjs`, `check-ls*.mjs`, `list-pages.mjs`,
`setup-ack.mjs`, `restore-prefs.mjs`), `packages/e2e/tests/adapters/chatgpt.adapter.spec.ts`,
and `packages/e2e/fixtures/chatgpt.html` are **not referenced by any documentation** and
stay local behind ignore rules. The two repo-owned tools (`benchmark-agent.mjs`,
`agent-inspect.mjs`) *are* referenced by the docs tower and must ship.

## 2. Decisions (confirmed by the maintainer, 2026-09-23)

1. **Branch strategy:** consolidate on `main` (fast-forward master's history onto it);
   `main` remains the default branch. Retire the `master` label and the stale local
   `merge-target` branch.
2. **Version:** `0.7.0` — new minor line for the operation-contract + agent-documentation
   milestone; avoids colliding with the orphaned remote `v0.6.3-rc.*` tags.
3. **Loose files:** keep the skill folder, probe scripts, and ChatGPT adapter spec/fixture
   local via ignore rules; push only tests, docs, and source.
4. **Commit shape:** logical series (~5 commits), each green on type-check + node tests.

## 3. Implementation steps

Execute in order. Each step lists its **verification gate**; do not proceed past a red gate.
Every step is individually skippable-only-if-blocked with the blocking fact recorded.

### Step 1 — Credential and hygiene guard (before anything is staged)

1.1 Add ignore rules for all local-only tool state so no future `git add` can leak them:

```gitignore
# local agent/tool state — never ship
.tmp/
.freebuff/
.serena/
.omx/
.packaging/
packages/e2e/.tmp/
packages/e2e/playwright-report/
packages/e2e/test-results/
# local-only probes and skill (kept out of the public tree by decision #3)
troubleshoot-mcp-superassistant/
packages/e2e/stage9-inspect.mjs
packages/e2e/test-ack-recovery.mjs
packages/e2e/test-c6-recovery.mjs
packages/e2e/list-receipts.mjs
packages/e2e/list-receipts2.mjs
packages/e2e/check-ls.mjs
packages/e2e/check-ls-keys.mjs
packages/e2e/list-pages.mjs
packages/e2e/setup-ack.mjs
packages/e2e/restore-prefs.mjs
packages/e2e/tests/adapters/
packages/e2e/fixtures/
```

1.2 Move the untracked render_prescript `themeDetector.ts` duplicate out of the way (it is
shadowed by the tracked `pages/content/src/utils/themeDetector.ts`; if it turns out to be
load-bearing, rename it to `themeDetector.render-prescript.ts` and commit instead — verify
by importing site first).
1.3 Run a full-history secret scan on the exact tree being pushed (`gitleaks detect --source .`
or `trufflehog filesystem .`) **after** the full clone exists (Step 3) but **before** the
first commit (Step 4), with particular attention to `.example.env`,
`firebase-remote-config-api.ts`, and the archived tarball contents that were previously
stripped.

**Gate:** `git status --porcelain | grep -E '\.tmp|\.env|stage9-browser'` is empty;
`git check-ignore -v .tmp .freebuff .serena troubleshoot-mcp-superassistant packages/e2e/stage9-inspect.mjs`
all return rules; secret scan exits clean.

### Step 2 — Fix the mechanical defects that make CI/hooks trustworthy

2.1 Rename `.husky/pre-committ` → `.husky/pre-commit` so lint-staged prettier actually runs.
2.2 Update workflow triggers to match the single-branch reality: replace
`branches: [ main, dev ]` with `branches: [ main ]` in `build-zip.yml`, `e2e.yml`, and
`prettier.yml` (`dev` no longer exists anywhere).
2.3 Add `.github/workflows/ci.yml` — the missing fast gate — triggering on push/PR to
`main`: Node 22 via `.nvmrc`, `pnpm install --frozen-lockfile`, then
`pnpm type-check && pnpm --filter chrome-extension test && pnpm lint`. Keep `e2e.yml` as the
heavy end-to-end job (it needs built artifacts and Playwright browsers).
2.4 Bump `actions/checkout@v2` → `@v4` in `prettier.yml`.
2.5 Bump both `package.json` and `chrome-extension/package.json` versions to `0.7.0`
(`pnpm update-version 0.7.0` works — the script accepts bare semver only). Confirm
`chrome-extension/tests/manifest-version.test.ts` passes with the new version and that
`packages/e2e/package.json` (`0.4.2`) is unaffected.

**Gate:** `pnpm type-check && pnpm --filter chrome-extension test` green locally;
`git diff --stat` shows only the four intended files; a `git commit --dry-run` with a
scratch change triggers the renamed hook (prettier output visible).

### Step 3 — Reconstruct full history for verification (shallow-clone mitigation)

The local clone is shallow (`commits_in_shallow_clone: 9`), so history-wide scans and a
fast-forward to remote `main` both need the complete graph:

```bash
git fetch --unshallow upstream          # or: git fetch upstream --depth=2147483647
git fetch upstream main
```

**Gate:** `test -f .git/shallow` fails; `git merge-base master upstream/main` resolves.

### Step 4 — Commit series (decision #4)

Five commits, each self-consistent (type-check + node suite green at each point). Stage
explicitly by path — **never** `git add -A` (Step 1 rules now also make this safe, but
explicit staging keeps the series clean). Suggested series:

1. `feat(runtime): operation contract Stages 1–4/9 — identity threading, delivery recovery, serialization, hard single-dispatch`
   — `pages/content/src/services/*`, `chrome-extension/src/**` modified files,
   `chrome-extension/manifest.ts`, `chrome-extension/tests/*` (six new test files),
   `pages/content/src/core/*`, `pages/content/src/**` modified sources, `packages/e2e/tests/discovery.spec.ts`.
2. `docs(agent): control tower — AGENTS/SYSTEM/ARCHITECTURE/GUIDE, control map, qualification evidence`
   — root `*.md` docs, `docs/**`, module `README.md`s, `pages/content/src/services/README.md`.
3. `feat(agent-tooling): Stage 10 benchmark harness + Stage 7 agent:inspect shim`
   — `packages/e2e/benchmark-agent.mjs`, `packages/e2e/agent-inspect.mjs`, `package.json` (`agent:inspect` script).
4. `chore(ci): single-branch triggers, ci.yml fast gate, hook fix, ignore hygiene`
   — `.gitignore`, `.github/workflows/*`, `.husky/`.
5. `chore(release): 0.7.0` — version bumps, `RELEASE_NOTES.md`/`CHANGELOG.md` entries (if maintained), `DEFERRED_ISSUES.md` updates.

Before each commit, re-run: `pnpm type-check && pnpm --filter chrome-extension test`.
Commit messages end with the repository's standard footer (Generated with Codebuff) only
where applicable per project convention; authorship is already correct.

**Gate:** `git status --porcelain | grep -v '^??'` is empty after step 5 (no modified files
remain); the working tree contains only the intentionally-local untracked paths from Step 1.

### Step 5 — Branch consolidation (decision #1)

Because remote `main` (`0d40b00`) is a strict ancestor of local `master` (`be60d93`), the
push itself is a fast-forward — no merge or rebase is needed. The local rename is the only
required operation:

```bash
git branch -m master main      # local: master → main (no local 'main' exists today)
git push upstream main         # remote main fast-forwards 0d40b00 → be60d93 + series
git branch -D merge-target     # stale WP4-era branch; divergence recorded in §1
```

The WP4-era `tests/e2e/` harness unique to `merge-target` was superseded by `packages/e2e/`
and the divergence is recorded in §1. Do **not** delete the remote `master` ref in this
pass; remove it in a follow-up pass with the maintainer's explicit go-ahead after `main` is
confirmed as the sole integration branch.

**Gate:** `git log --oneline upstream/main..main` shows exactly the 5 new commits;
`git diff --stat upstream/main..main` touches no file outside the commit series' intent;
`git status` clean.

### Step 6 — Push

```bash
git push upstream main
git tag v0.7.0
git push upstream v0.7.0
```

**Gate:** `git ls-remote upstream` shows `refs/heads/main` at the new tip and `refs/tags/v0.7.0`;
GitHub UI shows the new commit series on `main`; the `ci.yml` run is green; `build-zip`/`e2e`
workflows triggered by the push complete green (they now run on `main` — this is their first
real run against this tree, so treat failures as new information, not noise).

### Step 7 — Post-push verification and documentation accretion

7.1 Confirm the published tree is complete: spot-check on GitHub that
`AGENTS.md`, `docs/agent-control-map.yaml`, `docs/qualification/ergonomics-benchmark.md`,
`packages/e2e/benchmark-agent.mjs`, and the six new test files render at the new tip.
7.2 Confirm workflows: CI green, artifacts attached from `build-zip`.
7.3 Accretion (per the control loop): record the outcome in
`docs/qualification/` as an Evidence Receipt row (claim: "v0.7.0 published; commit series
verified green on CI for revision X; scope: repository/publication, not runtime
qualification"), and update this file's checklist marks. Mark this plan document
historical once executed.

**Gate:** a fresh `git clone https://github.com/munir-abbasi/MCP-SuperAssistant-updated` +
`pnpm install --frozen-lockfile && pnpm type-check && pnpm --filter chrome-extension test`
passes on the published tip — the true end-to-end gate.

## 4. Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| `.tmp/` Chrome profile leaks into a commit | High without Step 1 (108 MB, credential DBs, no prior ignore rule) | Step 1 rules land first; explicit path staging only; pre-push `git ls-files | grep tmp` check |
| Full-history secret in shallow-invisible commits | Medium (unverifiable until Step 3) | `--unshallow` then `gitleaks`/`trufflehog` scan before push (Step 1.3 ordering: scan runs after fetch, before Step 4) |
| Remote is non-fast-forward if it moved since `ls-remote` | Low | Re-run `git ls-remote upstream` immediately before Step 6; abort and re-plan if `main` tip ≠ `0d40b00` |
| CI fails on `main` for the first time (workflows never ran on this tree) | Medium | `ci.yml` is also run locally in Step 2's gate; e2e failures triaged as backlog items, not push blockers |
| lint-staged hook (now fixed) rejects an otherwise-green commit via prettier reformat | Medium | Run `pnpm prettier` once before Step 4's first commit; include the formatting normalization in commit 4 |
| `merge-target`-unique files assumed lost | Low | Divergence recorded here; WP4-era `tests/e2e/` intentionally superseded; branch deleted only after `main` push verified |
| Shallow clone makes `git push` behave unexpectedly | Low | Step 3 unshallows before any push operation |

## 5. Rollback

Before push: everything is local — `git reset --soft upstream/main` restores the pre-series
state without losing work; ignore-rule/hook/CI changes revert via `git checkout -- <paths>`
plus removing new files. After push: revert commits (`git revert` the series in reverse) and
push `main` again; the `v0.7.0` tag is deleted locally and on the remote
(`git push upstream :refs/tags/v0.7.0`) only if the release itself must be withdrawn.
The 108 MB `.tmp/` tool state is never touched by any step.

## 6. Execution checklist

- [x] Step 1 ignore rules + secret scan — clean gates
- [x] Step 2 hook rename, trigger fixes, `ci.yml`, checkout bump, version `0.7.0` — gates green
- [x] Step 3 `--unshallow` + `fetch upstream main` — gates green
- [x] Step 4 five-commit series — gates green per commit (actual pushed series: the five commits + lint remediation `7a5bfbe` + CI pipeline fix `5b5b4df` + this docs commit)
- [x] Step 5 branch consolidation on `main` — gates green
- [x] Step 6 push `main` + tag `v0.7.0` — remote refs verified
- [x] Step 7 post-push CI green, fresh-clone verification, Evidence Receipt recorded
- [x] Mark this document historical after execution

## 7. Execution outcome (2026-09-24 — historical record)

- Pushed series: the five publication commits, lint remediation `7a5bfbe`, CI pipeline fix
  `5b5b4df` (`type-check` gained a `ready` dependency after the first hosted CI run failed on
  `7a5bfbe` with `@extension/i18n` TS2307 on a clean checkout), plus the docs commit carrying
  this outcome.
- `refs/heads/main` advanced `0d40b00` → `5b5b4df`+docs (fast-forward); tag `v0.7.0` = `7a5bfbe`
  left in place — it differs from the CI-green tip by the one-line pipeline change only.
- Workflows on `main`: CI **green** (run `36036318492`), format **green**, build-zip **green**
  with attached artifact; e2e **red** → backlog row in `DIAGNOSIS.md` (workflow lacks
  `playwright install`; failure pre-dates this work), per §4 risk register.
- Fresh clone gates at `5b5b4df` — from this repo and from the remote URL — passed
  install + type-check + chrome-extension tests.
- Evidence Receipt: `docs/qualification/publication-v0.7.0.md`. Remote `master` ref retained
  per §2 for a follow-up pass with explicit go-ahead.
