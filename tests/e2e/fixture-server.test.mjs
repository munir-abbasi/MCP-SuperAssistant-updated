/**
 * E2E tests for the MCP Streamable HTTP fixture server.
 *
 * Uses the real MCP SDK client (same as production extension) to connect
 * and validate protocol-level behavior against all fixture scenarios.
 * The fixture server supports per-request scenario override via query param,
 * so a single server instance handles all test cases.
 */

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = resolve(currentDirectory, 'fixture-server.mjs');
const FIXTURE_PORT = 3456;
const BASE_URL = `http://127.0.0.1:${FIXTURE_PORT}`;

// ─── Fixture server lifecycle (once per suite) ────────────────────────

let fixtureProcess;

test.before(async () => {
  fixtureProcess = spawn(process.execPath, [FIXTURE_PATH, '--port', String(FIXTURE_PORT)], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, FIXTURE_PORT: String(FIXTURE_PORT) },
  });

  const stdout = [];
  fixtureProcess.stdout.on('data', chunk => stdout.push(chunk));

  const onExit = once(fixtureProcess, 'exit').then(([code]) => {
    throw new Error(`Fixture server exited with code ${code}:\n${Buffer.concat(stdout).toString()}`);
  });

  await Promise.race([
    new Promise(resolve => {
      fixtureProcess.stdout.on('data', chunk => {
        if (chunk.toString().includes('listening on')) resolve();
      });
    }),
    onExit,
  ]);
});

test.after(async () => {
  if (!fixtureProcess) return;
  fixtureProcess.kill('SIGTERM');
  try {
    await once(fixtureProcess, 'exit');
  } catch { /* empty */ }
  fixtureProcess = null;
});

// ─── Helpers ──────────────────────────────────────────────────────────

function createTransport(scenario, framing = 'json') {
  const params = new URLSearchParams();
  params.set('scenario', scenario ?? 'normal');
  params.set('framing', framing);
  return new StreamableHTTPClientTransport(new URL(`/mcp?${params.toString()}`, BASE_URL));
}

async function connectClient(scenario, framing = 'json') {
  const transport = createTransport(scenario, framing);
  const client = new Client(
    { name: 'fixture-test', version: '1.0.0' },
    { capabilities: {} },
  );
  await client.connect(transport);
  return { client, transport };
}

// ─── Basic protocol tests ─────────────────────────────────────────────

test('discovers tools from JSON framing', async () => {
  const { client } = await connectClient('normal', 'json');
  try {
    const { tools } = await client.listTools();
    assert.equal(tools.length, 2);
    assert.equal(tools[0].name, 'read_only_fixture');
    assert.equal(tools[1].name, 'echo');
    assert.ok(tools[0].outputSchema, 'outputSchema should be present');
    assert.equal(tools[0].outputSchema.type, 'object');
  } finally {
    await client.close();
  }
});

test('discovers tools from SSE framing', async () => {
  const { client } = await connectClient('normal', 'sse');
  try {
    const { tools } = await client.listTools();
    assert.equal(tools.length, 2);
    assert.equal(tools[0].name, 'read_only_fixture');
  } finally {
    await client.close();
  }
});

test('executes read_only_fixture tool', async () => {
  const { client } = await connectClient('normal', 'json');
  try {
    const result = await client.callTool({ name: 'read_only_fixture', arguments: {} });
    assert.ok(result.content, 'Tool result should have content');
    assert.equal(result.content[0].type, 'text');
    const parsed = JSON.parse(result.content[0].text);
    assert.equal(parsed.content, 'fixture response');
  } finally {
    await client.close();
  }
});

test('executes echo tool with arguments', async () => {
  const { client } = await connectClient('normal', 'json');
  try {
    const result = await client.callTool({ name: 'echo', arguments: { message: 'hello world' } });
    assert.ok(result.content);
    const parsed = JSON.parse(result.content[0].text);
    assert.equal(parsed.echo, 'hello world');
  } finally {
    await client.close();
  }
});

test('returns error for unknown tool', async () => {
  const { client } = await connectClient('normal', 'json');
  try {
    await assert.rejects(
      () => client.callTool({ name: 'nonexistent_tool', arguments: {} }),
      /Unknown tool/,
    );
  } finally {
    await client.close();
  }
});

// ─── Scenario-specific tests ──────────────────────────────────────────

test('handles malformed schema scenario: null outputSchema causes SDK to reject tools/list', async () => {
  const { client } = await connectClient('malformed-schema', 'json');
  try {
    // SDK Zod validation rejects the entire tools/list response when any tool
    // has a null outputSchema. This is expected SDK behavior.
    await assert.rejects(
      () => client.listTools(),
      (err) => {
        assert.ok(err instanceof Error);
        assert.ok(err.message.includes('outputSchema') || err.message.includes('Invalid'));
        return true;
      },
    );
  } finally {
    await client.close();
  }
});

test('handles empty tool list scenario', async () => {
  const { client } = await connectClient('empty', 'json');
  try {
    const { tools } = await client.listTools();
    assert.equal(tools.length, 0);
  } finally {
    await client.close();
  }
});

test('handles oversized tool list scenario', async () => {
  const { client } = await connectClient('oversized', 'json');
  try {
    const { tools } = await client.listTools();
    assert.ok(tools.length > 100, `Expected >100 tools, got ${tools.length}`);
    assert.equal(tools[0].name, 'oversized_tool_000');
  } finally {
    await client.close();
  }
});

test('handles error scenario correctly', async () => {
  // Error scenario returns JSON-RPC errors for ALL requests, including initialize.
  // So client.connect() itself should reject with the MCP error.
  const transport = createTransport('error', 'json');
  const client = new Client(
    { name: 'fixture-test', version: '1.0.0' },
    { capabilities: {} },
  );
  try {
    await assert.rejects(
      () => client.connect(transport),
      (err) => {
        assert.equal(err.code, -32603);
        assert.ok(err.message.includes('Internal error'));
        return true;
      },
    );
  } finally {
    await client.close();
  }
});

test('handles all-capabilities scenario', async () => {
  const { client } = await connectClient('all-capabilities', 'json');
  try {
    const { tools } = await client.listTools();
    assert.equal(tools.length, 2);

    const { resources } = await client.listResources();
    assert.ok(resources.length > 0);
    assert.equal(resources[0].uri, 'fixture://resource/config');

    const { prompts } = await client.listPrompts();
    assert.ok(prompts.length > 0);
    assert.equal(prompts[0].name, 'fixture_prompt');
  } finally {
    await client.close();
  }
});

test('handles slow scenario within timeout', async () => {
  const transport = createTransport('slow', 'json');
  const client = new Client(
    { name: 'fixture-test', version: '1.0.0' },
    { capabilities: {} },
  );
  try {
    const startTime = Date.now();
    await client.connect(transport);
    const elapsed = Date.now() - startTime;
    assert.ok(elapsed >= 2000, `Slow scenario took ${elapsed}ms, expected >=2000ms`);
  } finally {
    await client.close();
  }
});

test('handles concurrent tool calls correctly', async () => {
  const { client } = await connectClient('normal', 'json');
  try {
    const results = await Promise.all([
      client.callTool({ name: 'echo', arguments: { message: 'req1' } }),
      client.callTool({ name: 'echo', arguments: { message: 'req2' } }),
      client.callTool({ name: 'echo', arguments: { message: 'req3' } }),
    ]);
    assert.equal(results.length, 3);
    const messages = results.map(r => JSON.parse(r.content[0].text).echo);
    assert.ok(messages.includes('req1'), 'req1 should be present');
    assert.ok(messages.includes('req2'), 'req2 should be present');
    assert.ok(messages.includes('req3'), 'req3 should be present');
  } finally {
    await client.close();
  }
});

test('server returns 405 for GET requests', async () => {
  const response = await fetch(`http://127.0.0.1:${FIXTURE_PORT}/mcp`);
  assert.equal(response.status, 405);
});
