import '../src/mcpclient/configureZodForExtension.ts';

import assert from 'node:assert/strict';
import test from 'node:test';

import { McpClient } from '../src/mcpclient/core/McpClient.ts';
import type { ITransportPlugin } from '../src/mcpclient/types/plugin.ts';
import type { PrimitivesResponse } from '../src/mcpclient/types/primitives.ts';

const setPrivateField = (target: object, name: string, value: unknown): void => {
  Object.defineProperty(target, name, {
    configurable: true,
    value,
    writable: true,
  });
};

const failingDiscoveryPlugin = (error: Error): ITransportPlugin => ({
  metadata: {
    name: 'failing-streamable-http',
    transportType: 'streamable-http',
    version: 'test',
  },
  callTool: async () => {
    throw new Error('callTool is not used by this test');
  },
  connect: async () => {
    throw new Error('transport is not used by this test');
  },
  disconnect: async () => {},
  getDefaultConfig: () => ({}),
  getPrimitives: async () => {
    throw error;
  },
  initialize: async () => {},
  isConnected: () => true,
  isHealthy: async () => true,
  isSupported: () => true,
});

const connectForDiscovery = (client: McpClient, plugin: ITransportPlugin): void => {
  setPrivateField(client, 'activePlugin', plugin);
  setPrivateField(client, 'client', {});
  setPrivateField(client, 'isConnectedFlag', true);
};

test('marks the connection unhealthy when primitive discovery fails while transport stays healthy', async () => {
  // Given: a connected Streamable HTTP plugin whose transport health check still passes.
  const client = new McpClient();
  const discoveryError = new Error('tools/list failed');
  connectForDiscovery(client, failingDiscoveryPlugin(discoveryError));

  // When: primitive discovery fails.
  await assert.rejects(() => client.getPrimitives(true), /tools\/list failed/);

  // Then: the client must not keep reporting a healthy connection.
  assert.equal(client.isConnected(), false);
  assert.equal(client.getConnectionInfo().isConnected, false);
});

test('does not serve stale cached primitives after forced discovery fails', async () => {
  // Given: a connected plugin with a previously cached tool list.
  const client = new McpClient();
  const discoveryError = new Error('tools/list failed');
  connectForDiscovery(client, failingDiscoveryPlugin(discoveryError));

  const cachedPrimitives: PrimitivesResponse = {
    prompts: [],
    resources: [],
    timestamp: Date.now(),
    tools: [
      {
        description: 'stale cached tool',
        input_schema: {},
        name: 'stale_tool',
        schema: '{}',
      },
    ],
  };
  setPrivateField(client, 'primitivesCache', cachedPrimitives);
  setPrivateField(client, 'primitivesCacheTime', Date.now());

  // When: a forced discovery refresh fails.
  await assert.rejects(() => client.getPrimitives(true), /tools\/list failed/);

  // Then: a later non-forced read must not silently return the stale cache.
  await assert.rejects(() => client.getPrimitives(), /tools\/list failed|Not connected/);
});
