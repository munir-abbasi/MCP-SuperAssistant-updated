/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { StreamableHttpPlugin } from '../src/mcpclient/plugins/streamable-http/StreamableHttpPlugin.js';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

describe('StreamableHttpPlugin Discovery State', () => {
  it('should expose failure when tool discovery fails despite tools being advertised', async () => {
    const plugin = new StreamableHttpPlugin();
    (plugin as any).transport = {} as Transport;

    const mockClient = {
      getServerCapabilities: () => ({ tools: {} }),
      listResources: async () => ({ resources: [] }),
      listTools: async () => {
        throw new Error('Simulated discovery failure');
      },
      listPrompts: async () => ({ prompts: [] }),
    } as unknown as Client;

    const primitives = await plugin.getPrimitives(mockClient);

    const errors = primitives.filter(p => p.type === 'error');
    assert.strictEqual(errors.length, 1);
    assert.strictEqual(errors[0].value.capability, 'tools');
    assert.match(errors[0].value.message, /Simulated discovery failure/);
  });

  it('should invalidate cache or correctly expose failure after a previous success (stale-cache-after-failure)', async () => {
    const plugin = new StreamableHttpPlugin();
    (plugin as any).transport = {} as Transport;

    let toolsCallCount = 0;
    const mockClient = {
      getServerCapabilities: () => ({ tools: {} }),
      listResources: async () => ({ resources: [] }),
      listTools: async () => {
        toolsCallCount++;
        if (toolsCallCount === 1) {
          return { tools: [{ name: 'test-tool', description: 'test' }] };
        }
        throw new Error('Simulated later discovery failure');
      },
      listPrompts: async () => ({ prompts: [] }),
    } as unknown as Client;

    const firstPrimitives = await plugin.getPrimitives(mockClient);
    assert.strictEqual(firstPrimitives.filter(p => p.type === 'tool').length, 1);
    assert.strictEqual(firstPrimitives.filter(p => p.type === 'error').length, 0);

    const secondPrimitives = await plugin.getPrimitives(mockClient);
    const errors = secondPrimitives.filter(p => p.type === 'error');
    assert.strictEqual(errors.length, 1);
    assert.strictEqual(errors[0].value.capability, 'tools');
  });
});
