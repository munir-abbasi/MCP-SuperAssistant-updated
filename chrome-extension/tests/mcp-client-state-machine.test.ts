/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { McpClient, ConnectionState } from '../src/mcpclient/core/McpClient.js';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

describe('McpClient State Machine & Execution Tracking', () => {
  it('should cleanly abort active calls when disconnected', async () => {
    const client = new McpClient();

    // Mock the internal connection state
    (client as any).connectionState = ConnectionState.CONNECTED;
    (client as any).activePlugin = {
      metadata: { transportType: 'streamable-http' },
      disconnect: async () => {},
      callTool: async () => {
        // Simulate a hanging tool call
        return new Promise(() => {});
      },
    };
    (client as any).client = {
      close: async () => {},
    } as unknown as Client;

    // Start a tool call which will hang
    const callPromise = client.callTool('hanging-tool', {});

    // Ensure it's active
    assert.strictEqual((client as any).activeCalls.size, 1);

    // Disconnect should reject the active call
    await client.disconnect();

    try {
      await callPromise;
      assert.fail('Call should have been rejected on disconnect');
    } catch (err: any) {
      assert.match(err.message, /Connection dropped or disconnected/);
    }

    assert.strictEqual((client as any).activeCalls.size, 0);
  });

  it('should support AbortSignal for explicit tool cancellation', async () => {
    const client = new McpClient();
    (client as any).connectionState = ConnectionState.CONNECTED;
    (client as any).activePlugin = {
      metadata: { transportType: 'streamable-http' },
      callTool: async () => new Promise(() => {}), // hangs
    };
    (client as any).client = {} as unknown as Client;

    const controller = new AbortController();
    const callPromise = client.callTool('abortable-tool', {}, undefined, controller.signal);

    controller.abort(new Error('User aborted'));

    try {
      await callPromise;
      assert.fail('Call should have been aborted');
    } catch (err: any) {
      assert.strictEqual(err.message, 'User aborted');
    }
    assert.strictEqual((client as any).activeCalls.size, 0);
  });

  it('tracks separate dispatch attempts for the same logical operation', async () => {
    const client = new McpClient();
    (client as any).connectionState = ConnectionState.CONNECTED;
    (client as any).activePlugin = {
      metadata: { transportType: 'streamable-http' },
      disconnect: async () => {},
      callTool: async () => new Promise(() => {}),
    };
    (client as any).client = { close: async () => {} } as unknown as Client;

    const started: Array<{ callId?: string; attemptId: string }> = [];
    client.on('tool:call-started', event => started.push(event));

    const first = client.callTool('tool', {}, undefined, undefined, 'logical-call', 'attempt-1');
    const second = client.callTool('tool', {}, undefined, undefined, 'logical-call', 'attempt-2');

    assert.strictEqual((client as any).activeCalls.size, 2);
    assert.deepStrictEqual(
      started.map(event => ({ callId: event.callId, attemptId: event.attemptId })),
      [
        { callId: 'logical-call', attemptId: 'attempt-1' },
        { callId: 'logical-call', attemptId: 'attempt-2' },
      ],
    );

    await client.disconnect();
    const settled = await Promise.allSettled([first, second]);
    assert.ok(settled.every(result => result.status === 'rejected'));
    assert.strictEqual((client as any).activeCalls.size, 0);
  });

  it('should ignore duplicate connect requests while CONNECTING', async () => {
    const client = new McpClient();

    // Mock registry
    (client as any).registry = {
      getInitializedPlugin: async () => ({
        isSupported: () => true,
        connect: async () => ({}) as Transport,
      }),
    };

    let connectionsAttempted = 0;
    (client as any).performConnection = async () => {
      connectionsAttempted++;
      await new Promise(r => setTimeout(r, 50));
      (client as any).connectionState = ConnectionState.CONNECTED;
      (client as any).activePlugin = { metadata: { transportType: 'sse' } };
    };

    client.connect({ uri: 'http://test', type: 'sse' });
    const p2 = client.connect({ uri: 'http://test', type: 'sse' });

    assert.strictEqual((client as any).connectionState, ConnectionState.CONNECTING);
    assert.strictEqual(connectionsAttempted, 1);

    await p2;
    // ensure performConnection wasn't called twice
    assert.strictEqual(connectionsAttempted, 1);
  });
});
