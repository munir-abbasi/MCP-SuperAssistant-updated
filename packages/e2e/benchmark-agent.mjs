import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from 'fs';
import { parseArgs } from 'util';

const { values } = parseArgs({
  options: {
    scenario: {
      type: 'string',
      short: 's',
    },
    restore: {
      type: 'boolean',
    },
  },
});

const scenarioId = values.scenario;
const restoreFlag = values.restore;

// ── Reversibility helpers ────────────────────────────────────────────────────
// Fault injection must be reversible. Each fault backs up its target file to
// .tmp/benchmark-backup/ before mutating it; `--restore` puts the originals
// back exactly. No git state is touched, so uncommitted agent work elsewhere in
// the tree is never at risk.

const BACKUP_DIR = '.tmp/benchmark-backup';
const backup = (relPath) => {
  mkdirSync(BACKUP_DIR, { recursive: true });
  copyFileSync(relPath, `${BACKUP_DIR}/${relPath.replace(/\//g, '__')}`);
};
const restoreAll = () => {
  let restored = 0;
  try {
    for (const name of readdirSync(BACKUP_DIR)) {
      const relPath = name.replace(/__/g, '/');
      copyFileSync(`${BACKUP_DIR}/${name}`, relPath);
      restored++;
    }
  } catch (e) {
    if (e && e.code !== 'ENOENT') {
      console.error(`Restore failed: ${e.message}`);
      process.exit(1);
    }
    /* no backups present */
  }
  console.log(`Restored ${restored} file(s) from ${BACKUP_DIR}.`);
  process.exit(0);
};

if (restoreFlag !== undefined) {
  restoreAll();
}

if (!scenarioId) {
  console.error(
    'Please provide a scenario ID using --scenario or -s (1-4), or pass --restore to undo fault injection.'
  );
  process.exit(1);
}

console.log(`Setting up Stage 10 Benchmark Scenario ${scenarioId}...`);

// ── Scenario definitions ─────────────────────────────────────────────────────
const scenarios = {
  '1': {
    name: 'Shared-contract type mismatch (message envelope)',
    fault: (file, content) => content.replace(/CallToolRequest/g, 'McpCallToolRequest'),
    files: ['pages/content/src/types/messages.ts'],
    prompt:
      "The MCP client is throwing an 'unknown message type' error when attempting to execute a tool. Please isolate the issue and fix it.",
  },
  '2': {
    name: 'Adapter DOM drift',
    // Simulate a site-side DOM change: the editable-input selectors no longer
    // match, so insertion cannot find the real chat input.
    fault: (file, content) =>
      content.replace(/contenteditable/g, 'data-drift-removed'),
    files: ['pages/content/src/plugins/adapters/kimi.adapter.ts'],
    prompt:
      'Tools are successfully returning responses, but the results are no longer appearing in the chat input field on the target site. Please repair.',
  },
  '3': {
    name: 'C6 submission-only recovery',
    // C5 (insertion) keeps succeeding; C6 (submission) now always fails.
    fault: (file, content) =>
      content.replace(
        /(async submitForm\(options\?: \{ formElement\?: HTMLFormElement \}\): Promise<boolean> \{)/,
        '$1\n    return false; // benchmark fault: submission always fails'
      ),
    files: ['pages/content/src/plugins/adapters/kimi.adapter.ts'],
    prompt:
      'The tool response is being pasted into the chat box, but the enter key/submission action is failing intermittently. Fix the recovery path.',
  },
  '4': {
    name: 'Resume with ambiguous effect',
    // The defect under test: a plausible refactor deletes the single-dispatch
    // special case, silently reintroducing redispatch of effectful tool calls.
    // The agent must recognize which mechanism is load-bearing and why.
    fault: (file, content) =>
      content.replace(
        "const maxRetries = type === 'mcp:call-tool' ? 0 : (options.retries ?? this.config.maxRetries ?? 3);",
        'const maxRetries = options.retries ?? this.config.maxRetries ?? 3;'
      ),
    files: ['pages/content/src/core/context-bridge.ts'],
    prompt:
      "The client is occasionally re-running tools when the background script crashes. Ensure we don't accidentally double-execute a destructive tool.",
  },
};

const scenario = scenarios[scenarioId];
if (!scenario) {
  console.error(
    `Scenario ${scenarioId} not defined in benchmark harness. Available: ${Object.keys(scenarios).join(', ')}.`
  );
  process.exit(1);
}

console.log(`\n=== SCENARIO ${scenarioId}: ${scenario.name} ===`);

// ── Tree safety ──────────────────────────────────────────────────────────────
// The tree must be clean of *fault* changes before injecting. We do not refuse
// on a dirty tree (agents legitimately have work in progress); instead every
// fault backs up its own target files and `--restore` puts them back exactly.
for (const relPath of scenario.files) {
  let content;
  try {
    content = readFileSync(relPath, 'utf8');
  } catch (e) {
    console.error(`Failed to read fault target ${relPath}: ${e.message}`);
    process.exit(1);
  }
  backup(relPath);
  const mutated = scenario.fault(relPath, content);
  if (mutated === content) {
    console.error(
      `Fault injection into ${relPath} made no change — the fault pattern is stale. ` +
        'Do not run a benchmark against a no-op fault; fix the scenario definition first.'
      );
    process.exit(1);
  }
  writeFileSync(relPath, mutated);
  console.log(`[Setup] Injected fault into ${relPath}`);
}

const revision = execSync('git rev-parse HEAD').toString().trim();
console.log(`\nSetup complete at revision ${revision}. The repository is now in the frozen broken state.`);
console.log(`\nRecord the run under docs/qualification/e2e-artifacts/<scenario>-<date>/ per`);
console.log(`docs/qualification/ergonomics-benchmark.md ("Runner contract").`);
console.log(`\nTo test an agent, provide it with the following prompt:`);
console.log('--------------------------------------------------');
console.log(scenario.prompt);
console.log('--------------------------------------------------');
console.log(`\nTo undo fault injection: node packages/e2e/benchmark-agent.mjs --restore`);
console.log(
  `To grade: evaluate docs/qualification/e2e-artifacts/<scenario>-<date>/transcript.jsonl`
);
console.log(`against the Stage 10 Evaluation Matrix in docs/qualification/ergonomics-benchmark.md.`);
