import '../src/mcpclient/configureZodForExtension.ts';

import assert from 'node:assert/strict';
import test from 'node:test';

import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';

import { McpClient } from '../src/mcpclient/core/McpClient.ts';
import { DEFAULT_CLIENT_CONFIG } from '../src/mcpclient/types/config.ts';
import type { ITransportPlugin, PluginConfig, TransportType } from '../src/mcpclient/types/plugin.ts';
import type { PrimitivesResponse } from '../src/mcpclient/types/primitives.ts';

const setPrivateField = (target: object, name: string, value: unknown): void => {
  Object.defineProperty(target, name, {
    configurable: true,
    value,
    writable: true,
  });
};

class InitializationFixtureTransport implements Transport {
  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: <T extends JSONRPCMessage>(message: T) => void;

  async start(): Promise<void> {}

  async close(): Promise<void> {
    this.onclose?.();
  }

  async send(message: JSONRPCMessage): Promise<void> {
    if (!('method' in message) || !('id' in message)) return;

    if (message.method !== 'initialize') {
      throw new Error(`Unexpected fixture request: ${message.method}`);
    }

    this.onmessage?.({
      jsonrpc: '2.0',
      id: message.id,
      result: {
        capabilities: { tools: {} },
        protocolVersion: '2025-06-18',
        serverInfo: { name: 'fixture-server', version: '1.0.0' },
      },
    } as JSONRPCMessage);
  }
}

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

const hangingToolCallPlugin = (): ITransportPlugin => ({
  metadata: {
    name: 'hanging-streamable-http',
    transportType: 'streamable-http',
    version: 'test',
  },
  callTool: async () => new Promise(() => {}),
  connect: async () => {
    throw new Error('transport is not used by this test');
  },
  disconnect: async () => {},
  getDefaultConfig: () => ({}),
  getPrimitives: async () => [],
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

test('bounds a tool call that never resolves', async () => {
  const client = new McpClient({
    global: {
      ...DEFAULT_CLIENT_CONFIG.global,
      timeout: 20,
    },
  });
  connectForDiscovery(client, hangingToolCallPlugin());

  await assert.rejects(() => client.callTool('hanging_tool', {}), /Tool call timeout after 20ms for hanging_tool/);

  assert.equal(client.isConnected(), true);
});

/**
 * Regression test for v0.6.2 tool-call hang after discovery failure.
 *
 * Scenario:
 * 1. Client is connected and primitives are cached.
 * 2. A forced getPrimitives refresh fails, setting isConnectedFlag = false.
 * 3. callTool is invoked (simulating the backwards-compatibility path where
 *    callToolWithBackwardsCompatibility sees isConnected() === false and
 *    calls connect() before callTool()).
 * 4. Previously, performConnection() skipped cleanup because isConnectedFlag
 *    was false, leaking the old transport/client and causing the new
 *    connection or tool call to hang indefinitely.
 *
 * This test verifies that cleanup is always called during performConnection(),
 * allowing the reconnection to succeed and the tool call to complete.
 */
test('cleans up old connection state before reconnecting after discovery failure', async () => {
  // Track whether the old plugin's disconnect was called during reconnection
  let oldPluginDisconnected = false;

  const client = new McpClient({
    global: {
      ...DEFAULT_CLIENT_CONFIG.global,
      timeout: 1000,
    },
  });

  // Simulate a connected state with a plugin that fails discovery on refresh
  const failingDiscoveryWithDisconnectPlugin: ITransportPlugin = {
    metadata: {
      name: 'failing-streamable-http',
      transportType: 'streamable-http',
      version: 'test',
    },
    callTool: async () => ({ result: 'success' }),
    connect: async () => {
      throw new Error('connect is not used by this test');
    },
    disconnect: async () => {
      oldPluginDisconnected = true;
    },
    getDefaultConfig: () => ({}),
    getPrimitives: async () => {
      throw new Error('tools/list failed');
    },
    initialize: async () => {},
    isConnected: () => true,
    isHealthy: async () => true,
    isSupported: () => true,
  };

  try {
    connectForDiscovery(client, failingDiscoveryWithDisconnectPlugin);

    // Step 1: Discovery fails, setting isConnectedFlag = false
    await assert.rejects(() => client.getPrimitives(true), /tools\/list failed/);
    assert.equal(client.isConnected(), false);

    // Step 2: Simulate the backwards-compatibility path where connect() is called
    // before callTool() because isConnected() returned false.
    // We need to mock the registry to return a working plugin for reconnection.
    const workingPlugin: ITransportPlugin = {
      metadata: {
        name: 'working-streamable-http',
        transportType: 'streamable-http',
        version: 'test',
      },
      callTool: async () => ({ result: 'reconnected_success' }),
      connect: async () => new InitializationFixtureTransport(),
      disconnect: async () => {},
      getDefaultConfig: () => ({}),
      getPrimitives: async () => [{ type: 'tool', value: { name: 'test_tool', description: 'test', inputSchema: {} } }],
      initialize: async () => {},
      isConnected: () => true,
      isHealthy: async () => true,
      isSupported: () => true,
    };

    // Mock the registry to return the working plugin
    const registry = (
      client as unknown as {
        registry: {
          getInitializedPlugin: (type: TransportType, config?: PluginConfig) => Promise<ITransportPlugin>;
        };
      }
    ).registry;
    registry.getInitializedPlugin = async () => workingPlugin;

    // Step 3: Attempt reconnection - this should NOT hang
    // Previously, performConnection() would skip cleanup because isConnectedFlag was false,
    // leaking the old transport and causing the new connection to conflict.
    const connectPromise = client.connect({ uri: 'http://test.local', type: 'streamable-http' });

    // Verify connect doesn't hang (completes within reasonable time)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Reconnection hung - cleanup was not called')), 2000),
    );

    await Promise.race([connectPromise, timeoutPromise]);

    // Step 4: Verify cleanup happened (old plugin's disconnect was called)
    assert.equal(oldPluginDisconnected, true, 'Old plugin should have been disconnected during cleanup');

    // Step 5: Verify tool call works after reconnection
    const result = await client.callTool('test_tool', {});
    assert.deepEqual(result, { result: 'reconnected_success' });
  } finally {
    await client.disconnect();
  }
});
