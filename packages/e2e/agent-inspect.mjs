#!/usr/bin/env node
// agent-inspect.mjs — Stage 7 Situation Compiler shim
//
// Derives a disposable Situation Packet seed from the repository in one pass.
// It compiles ONLY static facts: repository identity, topology, evidence
// inventory, and runtime-observation entry points. It stores nothing and
// mutates nothing. Output is JSON (the normalized seed) plus a compact text
// digest for a driving agent's first decision.
//
// This is deliberately NOT a runtime state store. See:
//   AGENTS.md  → Situation Packet / Resource Budgets
//   DIAGNOSIS.md → "Stage 7 design constraints — Situation Compiler without
//   another source of truth"
// Every compiled field is derivable: rerunning this script on the same tree
// yields the same output. Fields it cannot know (goal, acceptance, authority,
// runtime checkpoints) are emitted as explicit unknowns with their resolver.

import { execSync } from 'child_process';
import { readdirSync, readFileSync, existsSync } from 'fs';

const run = (cmd) => {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
};

const TOPology_PATH = 'docs/agent-control-map.yaml';

// ── compiled fields ──────────────────────────────────────────────────────────

const revision = {
  head: run('git rev-parse HEAD'),
  branch: run('git rev-parse --abbrev-ref HEAD'),
  dirty_paths: (run('git status --porcelain') || '')
    .split('\n')
    .filter(Boolean)
    .map((l) => l.slice(3).trim()),
};

const topology = { path: TOPology_PATH, boundaries: [], interfaces: [] };
if (existsSync(TOPology_PATH)) {
  const src = readFileSync(TOPology_PATH, 'utf8');
  const boundaryIds = [...src.matchAll(/^\s*- id: ([A-Z_]+)$/gm)]
    .map((m) => m[1]);
  const ifaceIdx = src.indexOf('\ninterfaces:');
  const boundsIdx = src.indexOf('\nboundaries:');
  if (ifaceIdx >= 0 && boundsIdx > ifaceIdx) {
    topology.interfaces = boundaryIds.filter((id) =>
      src.slice(ifaceIdx, boundsIdx).includes(`- id: ${id}`)
    );
  }
  if (boundsIdx >= 0) {
    topology.boundaries = boundaryIds.filter((id) =>
      src.slice(boundsIdx).includes(`- id: ${id}`)
    );
  }
}

const evidence = [];
const QUAL_DIR = 'docs/qualification';
if (existsSync(QUAL_DIR)) {
  for (const name of readdirSync(QUAL_DIR)) {
    if (!name.endsWith('.md')) continue;
    const rel = `${QUAL_DIR}/${name}`;
    const text = readFileSync(rel, 'utf8');
    const datedStamps = [...text.matchAll(/(\d{4}-\d{2}-\d{2})/g)].map((m) => m[1]).sort();
    const statuses = [...text.matchAll(/\b(verified-current|verified-scoped|stale|inferred|disproven)\b/g)]
      .map((m) => m[1]);
    evidence.push({
      file: rel,
      newest_date_in_document: datedStamps.at(-1) ?? null,
      status_terms_present: [...new Set(statuses)],
    });
  }
}

const runtime_observation = {
  note: 'runtime fields are NOT compiled from disk; they live in the running extension',
  dev_build_surfaces: [
    "__automationService.formatOperations()   // one line per operation (content-script context)",
    "__automationService.observeOperations()  // structured snapshot",
    "localStorage['mcp_delivery_receipts']    // receipts survive reload, 30-min TTL",
  ],
  packaged_build_note: 'dev debug globals are absent in packaged builds — expected, not a defect',
};

const unknowns = [
  { field: 'goal', resolver: 'state it from the user request before acting' },
  { field: 'acceptance', resolver: 'enumerate finite proof obligations before acting' },
  { field: 'authority', resolver: 'confirm permitted reads/writes/effects/destinations with the user' },
  { field: 'runtime checkpoint', resolver: 'observe via dev-build surfaces above, or mark unknown' },
  { field: 'effect class', resolver: "inspect the tool contract; without evidence use 'non-replayable/unknown'" },
];

const packet = {
  schema_note:
    'disposable Situation Packet seed (Stage 7 shim); derivation only, no stored truth',
  mode: 'maintenance',
  revision,
  topology,
  evidence,
  runtime_observation,
  unknowns,
};

// ── output ───────────────────────────────────────────────────────────────────

const jsonFlag = process.argv.includes('--json');
if (jsonFlag) {
  console.log(JSON.stringify(packet, null, 2));
} else {
  const dirty = revision.dirty_paths.length;
  const staleCandidates = evidence.filter((e) => {
    if (e.status_terms_present.length === 0 || !e.newest_date_in_document) return false;
    const days = Math.floor((Date.now() - new Date(e.newest_date_in_document)) / 86_400_000);
    return days > 30;
  });
  console.log('SITUATION PACKET SEED (compiled, disposable — verify against implementation)');
  console.log(`revision:      ${revision.branch} @ ${(revision.head || 'unknown').slice(0, 12)} (${dirty} dirty path${dirty === 1 ? '' : 's'})`);
  console.log(`topology:      ${TOPology_PATH} — ${topology.boundaries.length} boundaries, ${topology.interfaces.length} interfaces`);
  console.log(`evidence:      ${evidence.length} qualification document(s)`);
  if (staleCandidates.length) {
    console.log(`stale candidates (date-based only — confirm with each receipt's invalidates_on):`);
    for (const e of staleCandidates) console.log(`  - ${e.file} (newest date ${e.newest_date_in_document})`);
  }
  console.log(`runtime:       not compiled — use the dev-build observation surfaces (see --json)`);
  console.log(`unknowns:      goal, acceptance, authority, runtime checkpoint, effect class — resolve before acting`);
  console.log('');
  console.log('NEXT: route the task through docs/agent-control-map.yaml; read the one owning');
  console.log('implementation surface plus one evidence surface; select one admitted action or stop.');
}
console.error('\n[agent-inspect] read-only: no repository files were read except the topology map and qualification inventory; nothing was written.');
