import '../src/mcpclient/configureZodForExtension.ts';

import assert from 'node:assert/strict';
import test from 'node:test';

import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { FetchLike } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';

import { createBrowserMcpClient } from '../src/mcpclient/core/createBrowserMcpClient.ts';

type Framing = 'json' | 'sse';

const responseFor = (request: JSONRPCMessage): JSONRPCMessage | null => {
  if (!('method' in request) || !('id' in request)) return null;

  if (request.method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: '2025-06-18',
        capabilities: { tools: {} },
        serverInfo: { name: 'streamable-fixture', version: '1.0.0' },
      },
    };
  }

  if (request.method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        tools: [
          {
            name: 'read_only_fixture',
            description: 'Framing fixture',
            inputSchema: { type: 'object', properties: {} },
            outputSchema: {
              type: 'object',
              properties: { content: { type: 'string' } },
              required: ['content'],
              additionalProperties: false,
            },
          },
        ],
      },
    };
  }

  throw new Error(`Unexpected request: ${request.method}`);
};

const fixtureFetch =
  (framing: Framing, observedAcceptHeaders: string[]): FetchLike =>
  async (_url, init) => {
    const headers = new Headers(init?.headers);
    observedAcceptHeaders.push(headers.get('accept') ?? '');

    if (init?.method === 'GET') {
      return new Response(null, { status: 405 });
    }

    const parsed = JSON.parse(String(init?.body)) as JSONRPCMessage | JSONRPCMessage[];
    const requests = Array.isArray(parsed) ? parsed : [parsed];
    const responses = requests.map(responseFor).filter(response => response !== null);

    if (responses.length === 0) return new Response(null, { status: 202 });

    const payload = responses.length === 1 ? responses[0] : responses;
    if (framing === 'sse') {
      return new Response(`event: message\ndata: ${JSON.stringify(payload)}\n\n`, {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      });
    }

    return Response.json(payload, { status: 200 });
  };

for (const framing of ['json', 'sse'] as const) {
  test(`discovers tools from ${framing.toUpperCase()} POST responses`, async () => {
    const observedAcceptHeaders: string[] = [];
    const transport = new StreamableHTTPClientTransport(new URL('http://127.0.0.1:3006/mcp'), {
      fetch: fixtureFetch(framing, observedAcceptHeaders),
    });
    const client = createBrowserMcpClient(
      { name: `streamable-${framing}-fixture`, version: '1.0.0' },
      { capabilities: {} },
    );

    try {
      await client.connect(transport);
      const { tools } = await client.listTools();

      assert.equal(tools.length, 1);
      assert.equal(tools[0]?.name, 'read_only_fixture');
      assert.ok(
        observedAcceptHeaders.some(value => value.includes('application/json') && value.includes('text/event-stream')),
      );
    } finally {
      await client.close();
    }
  });
}
