import assert from 'node:assert/strict';
import test from 'node:test';

import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';

import {
  BrowserJsonSchemaValidator,
  createBrowserMcpClient,
  schemaDraftFromUri,
} from '../src/mcpclient/core/createBrowserMcpClient.ts';

const reportedOutputSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object' as const,
  properties: { content: { type: 'string' as const } },
  required: ['content'],
  additionalProperties: false,
};

const tools = [
  {
    name: 'without_output_schema',
    description: 'Baseline tool',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'reported_schema',
    title: 'Issue 199 fixture',
    description: 'Tool containing the reported output schema',
    inputSchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: { value: { type: 'string' } },
      required: ['value'],
    },
    annotations: { readOnlyHint: true },
    execution: { taskSupport: 'forbidden' },
    outputSchema: reportedOutputSchema,
  },
  {
    name: 'minimal_schema',
    description: 'Minimal output schema',
    inputSchema: { type: 'object', properties: {} },
    outputSchema: { type: 'object' },
  },
  {
    name: 'unsupported_schema',
    description: 'Malformed metadata must not hide valid tools',
    inputSchema: { type: 'object', properties: {} },
    outputSchema: {
      type: 'object',
      properties: { value: { type: 'string', pattern: '[' } },
      required: ['value'],
    },
  },
] as const;

class FixtureTransport implements Transport {
  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: <T extends JSONRPCMessage>(message: T) => void;

  async start(): Promise<void> {}

  async close(): Promise<void> {
    this.onclose?.();
  }

  async send(message: JSONRPCMessage): Promise<void> {
    if (!('method' in message) || !('id' in message)) return;

    let result: unknown;
    if (message.method === 'initialize') {
      result = {
        protocolVersion: '2025-06-18',
        capabilities: { tools: {} },
        serverInfo: { name: 'fixture-server', version: '1.0.0' },
      };
    } else if (message.method === 'tools/list') {
      result = { tools };
    } else if (message.method === 'tools/call') {
      const params = message.params as { name: string; arguments?: Record<string, unknown> };
      result = {
        content: [{ type: 'text', text: 'fixture result' }],
        structuredContent:
          params.name === 'reported_schema' ? { content: params.arguments?.value ?? 'ok' } : { value: 'fixture' },
      };
    } else {
      throw new Error(`Unexpected fixture request: ${message.method}`);
    }

    this.onmessage?.({ jsonrpc: '2.0', id: message.id, result } as JSONRPCMessage);
  }
}

test('selects the declared JSON Schema draft and defaults to 2020-12', () => {
  assert.equal(schemaDraftFromUri({ $schema: 'http://json-schema.org/draft-04/schema#' }), '4');
  assert.equal(schemaDraftFromUri({ $schema: 'http://json-schema.org/draft-07/schema#' }), '7');
  assert.equal(schemaDraftFromUri({ $schema: 'https://json-schema.org/draft/2019-09/schema' }), '2019-09');
  assert.equal(schemaDraftFromUri({ type: 'object' }), '2020-12');
});

test('validates the issue #199 outputSchema without runtime code generation', () => {
  const validator = new BrowserJsonSchemaValidator().getValidator(reportedOutputSchema);
  const originalFunction = globalThis.Function;

  globalThis.Function = (() => {
    throw new Error('MV3 CSP blocked runtime code generation');
  }) as FunctionConstructor;

  try {
    assert.equal(validator({ content: 'ok' }).valid, true);
    const invalid = validator({ content: 'ok', unexpected: true });
    assert.equal(invalid.valid, false);
    assert.match(invalid.errorMessage ?? '', /additional|unexpected|property/i);
  } finally {
    globalThis.Function = originalFunction;
  }
});

test('listTools discovers mixed schemas under MV3 CSP and contains malformed metadata', async () => {
  const client = createBrowserMcpClient({ name: 'fixture-client', version: '1.0.0' }, { capabilities: {} });

  const originalFunction = globalThis.Function;
  globalThis.Function = (() => {
    throw new Error('MV3 CSP blocked runtime code generation');
  }) as FunctionConstructor;

  try {
    await client.connect(new FixtureTransport());
    const { tools } = await client.listTools();
    assert.deepEqual(
      tools.map(tool => tool.name),
      ['without_output_schema', 'reported_schema', 'minimal_schema', 'unsupported_schema'],
    );

    const result = await client.callTool({ name: 'reported_schema', arguments: { value: 'ok' } });
    assert.deepEqual(result.structuredContent, { content: 'ok' });

    await assert.rejects(
      client.callTool({ name: 'unsupported_schema', arguments: {} }),
      /validate structured content|invalid regular expression|output schema/i,
    );
  } finally {
    globalThis.Function = originalFunction;
    await client.close();
  }
});
