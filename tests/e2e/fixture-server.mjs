#!/usr/bin/env node

/**
 * MCP Streamable HTTP Fixture Server
 *
 * A deterministic, scenario-driven MCP server for E2E testing.
 * Implements the Streamable HTTP transport (JSON-RPC over HTTP POST)
 * without using the MCP SDK on the server side.
 *
 * Usage:
 *   node fixture-server.mjs [--port PORT] [--scenario NAME]
 *
 * Scenarios:
 *   normal            - Standard valid MCP responses (default)
 *   malformed-schema  - Tools with invalid/broken outputSchema
 *   slow              - 3-second delay before each response
 *   error             - Return JSON-RPC errors for all requests
 *   oversized         - Very large tool list response
 *   only-tools        - Only tools capability, no resources/prompts
 *   all-capabilities  - tools + resources + prompts
 *   empty             - No tools in tool list
 *   concurrent-safe   - Tracks request IDs to verify concurrent call correctness
 */

import { createServer } from 'node:http';
import process from 'node:process';

// ─── Configuration ────────────────────────────────────────────────────

const PORT = parseInt(process.env.FIXTURE_PORT ?? process.argv.find((_, i, a) => a[i - 1] === '--port') ?? '3006', 10);
const SCENARIO = process.env.FIXTURE_SCENARIO ?? process.argv.find((_, i, a) => a[i - 1] === '--scenario') ?? 'normal';

const PROTOCOL_VERSION = '2025-06-18';
const SERVER_INFO = { name: 'mcp-e2e-fixture', version: '1.0.0' };

// ─── Scenario data ────────────────────────────────────────────────────

const normalTools = [
  {
    name: 'read_only_fixture',
    description: 'Framing fixture tool for E2E tests',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    outputSchema: {
      type: 'object',
      properties: { content: { type: 'string' } },
      required: ['content'],
      additionalProperties: false,
    },
  },
  {
    name: 'echo',
    description: 'Echoes back the input message',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Message to echo' },
      },
      required: ['message'],
    },
    outputSchema: {
      type: 'object',
      properties: { echo: { type: 'string' } },
      required: ['echo'],
      additionalProperties: false,
    },
  },
];

const malformedTools = [
  {
    name: 'bad_output_schema',
    description: 'Tool with outputSchema containing unsupported keywords',
    inputSchema: { type: 'object', properties: {} },
    outputSchema: {
      type: 'object',
      properties: { result: { type: 'string' } },
      required: ['result'],
      additionalProperties: false,
      // Add $schema to test if the extension handles it
      $schema: 'http://json-schema.org/draft-07/schema#',
    },
  },
  {
    name: 'no_output_schema',
    description: 'Tool without outputSchema',
    inputSchema: { type: 'object', properties: {} },
    // Intentionally missing outputSchema to test the extension handles this gracefully
  },
  {
    name: 'null_output_schema',
    description: 'Tool with null outputSchema',
    inputSchema: { type: 'object', properties: {} },
    outputSchema: null,
  },
  {
    name: 'weird_input_schema',
    description: 'Tool with unusual inputSchema patterns',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          oneOf: [
            { type: 'string', enum: ['read', 'write'] },
            { type: 'number' },
          ],
        },
        recursive: { type: 'boolean', default: false },
        depth: { type: 'integer', minimum: 1, maximum: 10 },
        tags: { type: 'array', items: { type: 'string' }, maxItems: 5 },
      },
      required: ['command'],
    },
  },
];

const thirtyTools = Array.from({ length: 30 }, (_, i) => ({
  name: `fixture_tool_${String(i).padStart(2, '0')}`,
  description: `E2E fixture tool number ${i + 1}`,
  inputSchema: {
    type: 'object',
    properties: {
      input: { type: 'string', description: `Input for tool ${i + 1}` },
    },
    required: i < 3 ? ['input'] : [],
  },
  outputSchema: {
    type: 'object',
    properties: { result: { type: 'string' } },
    required: ['result'],
  },
}));

const oversizedTools = Array.from({ length: 200 }, (_, i) => ({
  name: `oversized_tool_${String(i).padStart(3, '0')}`,
  description: 'A'.repeat(2000) + ` tool ${i}`,
  inputSchema: {
    type: 'object',
    properties: Object.fromEntries(
      Array.from({ length: 20 }, (_, j) => [
        `param_${j}`,
        {
          type: 'string',
          description: 'X'.repeat(500),
        },
      ]),
    ),
    required: [],
  },
}));

const sampleResources = [
  {
    uri: 'fixture://resource/config',
    name: 'Fixture Config',
    description: 'A sample resource for E2E testing',
    mimeType: 'application/json',
  },
  {
    uri: 'fixture://resource/log',
    name: 'Fixture Log',
    description: 'A log resource for E2E testing',
    mimeType: 'text/plain',
  },
];

const samplePrompts = [
  {
    name: 'fixture_prompt',
    description: 'A sample prompt for E2E testing',
    arguments: [
      { name: 'topic', description: 'Topic to discuss', required: true },
    ],
  },
];

// ─── Response handlers ────────────────────────────────────────────────

function getCapabilities(scenario) {
  switch (scenario) {
    case 'only-tools':
      return { tools: {} };
    case 'all-capabilities':
      return { tools: {}, resources: {}, prompts: {} };
    default:
      return { tools: {} };
  }
}

function getToolsList(scenario) {
  switch (scenario) {
    case 'malformed-schema':
      return malformedTools;
    case 'empty':
      return [];
    case 'oversized':
      return oversizedTools;
    default:
      return normalTools;
  }
}

function handleInitialize(requestId, scenario) {
  return {
    jsonrpc: '2.0',
    id: requestId,
    result: {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: getCapabilities(scenario),
      serverInfo: SERVER_INFO,
    },
  };
}

function handleToolsList(requestId, scenario) {
  return {
    jsonrpc: '2.0',
    id: requestId,
    result: {
      tools: getToolsList(scenario),
    },
  };
}

function handleResourcesList(requestId) {
  return {
    jsonrpc: '2.0',
    id: requestId,
    result: {
      resources: sampleResources,
    },
  };
}

function handlePromptsList(requestId) {
  return {
    jsonrpc: '2.0',
    id: requestId,
    result: {
      prompts: samplePrompts,
    },
  };
}

function handleToolCall(requestId, params) {
  const { name, arguments: args } = params ?? {};

  if (name === 'echo') {
    return {
      jsonrpc: '2.0',
      id: requestId,
      result: {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ echo: args?.message ?? '' }),
          },
        ],
      },
    };
  }

  if (name === 'read_only_fixture') {
    return {
      jsonrpc: '2.0',
      id: requestId,
      result: {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ content: 'fixture response' }),
          },
        ],
      },
    };
  }

  if (name === 'error_tool') {
    return {
      jsonrpc: '2.0',
      id: requestId,
      error: {
        code: -32000,
        message: 'Tool execution error',
        data: { details: 'Intentional error for E2E testing' },
      },
    };
  }

  // Unknown tool
  return {
    jsonrpc: '2.0',
    id: requestId,
    error: {
      code: -32602,
      message: `Unknown tool: ${name}`,
    },
  };
}

function handleError(requestId) {
  return {
    jsonrpc: '2.0',
    id: requestId,
    error: {
      code: -32603,
      message: 'Internal error (error scenario)',
      data: { scenario: 'error' },
    },
  };
}

function dispatchRequest(request, scenario) {
  if (!request || !request.method) {
    return null;
  }

  const id = request.id ?? null;

  switch (request.method) {
    case 'initialize':
      return handleInitialize(id, scenario);
    case 'tools/list':
      return handleToolsList(id, scenario);
    case 'tools/call':
      return handleToolCall(id, request.params);
    case 'resources/list':
      return handleResourcesList(id);
    case 'prompts/list':
      return handlePromptsList(id);
    case 'ping':
      return { jsonrpc: '2.0', id, result: {} };
    default:
      return null;
  }
}

// ─── HTTP handler ─────────────────────────────────────────────────────

function sendJSON(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

function sendSSE(res, data) {
  res.writeHead(200, { 'content-type': 'text/event-stream' });
  res.write(`event: message\ndata: ${JSON.stringify(data)}\n\n`);
  res.end();
}

function send202(res) {
  res.writeHead(202, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ status: 'accepted' }));
}

async function handleRequest(req, res) {
  // Extract scenario from query param, or path segment, or default
  const url = new URL(req.url, `http://${req.headers.host ?? '127.0.0.1'}`);
  const scenario = url.searchParams.get('scenario') ?? SCENARIO;
  const framing = url.searchParams.get('framing') ?? 'json';

  // Only accept POST on the MCP endpoint
  if (req.method === 'GET') {
    sendJSON(res, 405, { error: 'Method not allowed' });
    return;
  }

  if (req.method !== 'POST') {
    sendJSON(res, 405, { error: `Method ${req.method} not allowed` });
    return;
  }

  // Check required accept header for Streamable HTTP
  const accept = req.headers['accept'] ?? '';
  if (!accept.includes('application/json') && !accept.includes('text/event-stream')) {
    // Non-strict: still process but log would be nice
  }

  // Read body
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks).toString('utf8');

  if (!body) {
    sendJSON(res, 400, { error: 'Empty request body' });
    return;
  }

  // Parse JSON-RPC
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    sendJSON(res, 400, { error: 'Invalid JSON', jsonrpc: '2.0', id: null });
    return;
  }

  const requests = Array.isArray(parsed) ? parsed : [parsed];

  // Handle slow scenario: add delay
  if (scenario === 'slow') {
    await new Promise(r => setTimeout(r, 3000));
  }

  // Handle error scenario
  if (scenario === 'error') {
    const errorResponses = requests
      .filter(r => r.id != null)
      .map(r => handleError(r.id));
    if (errorResponses.length === 0) {
      send202(res);
      return;
    }
    const payload = errorResponses.length === 1 ? errorResponses[0] : errorResponses;
    if (framing === 'sse') {
      sendSSE(res, payload);
    } else {
      sendJSON(res, 200, payload);
    }
    return;
  }

  // Dispatch each request
  const responses = requests
    .map(req => dispatchRequest(req, scenario))
    .filter(r => r !== null);

  if (responses.length === 0) {
    send202(res);
    return;
  }

  const payload = responses.length === 1 ? responses[0] : responses;
  if (framing === 'sse') {
    sendSSE(res, payload);
  } else {
    sendJSON(res, 200, payload);
  }
}

// ─── Server startup ──────────────────────────────────────────────────

const server = createServer(handleRequest);

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[fixture-server] listening on http://127.0.0.1:${PORT}`);
  console.log(`[fixture-server] scenario: ${SCENARIO}`);
  console.log(`[fixture-server] pid: ${process.pid}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});

// Export for test usage
export { server, PORT as FIXTURE_PORT };
