/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { ContextBridge, ContextBridgeDispatchError } from '../../pages/content/src/core/context-bridge.js';

function createReadyBridge(maxRetries: number): ContextBridge {
  const bridge = new ContextBridge({ enableLogging: false, maxRetries, retryDelay: 0 });

  // Exercise send/retry semantics directly without starting long-lived listeners
  // or the bridge health-check interval.
  (bridge as any).initialized = true;
  (bridge as any).isExtensionContextValid = true;

  return bridge;
}

function installHangingRuntime(onDispatch: () => void): void {
  (globalThis as any).chrome = {
    runtime: {
      sendMessage: () => {
        onDispatch();
        // Deliberately never invoke the callback. This models a request whose
        // background/server effect may still be in flight when the timeout fires.
      },
    },
  };
}

describe('ContextBridge retry safety', () => {
  it('dispatches mcp:call-tool at most once when the response times out', async () => {
    let dispatchCount = 0;
    installHangingRuntime(() => {
      dispatchCount += 1;
    });

    const bridge = createReadyBridge(3);

    const error = await bridge
      .sendMessage('background', 'mcp:call-tool', { toolName: 'side-effecting-tool' }, { timeout: 5, retries: 3 })
      .then(
        () => null,
        caught => caught,
      );

    assert.strictEqual(dispatchCount, 1);
    assert.ok(error instanceof ContextBridgeDispatchError);
    assert.match(error.message, /Message timeout after 5ms for mcp:call-tool to background/);
    assert.strictEqual(error.dispatchState, 'possibly-dispatched');
  });

  it('keeps configured retries for ordinary retryable bridge messages', async () => {
    let dispatchCount = 0;
    installHangingRuntime(() => {
      dispatchCount += 1;
    });

    const bridge = createReadyBridge(2);

    await assert.rejects(
      bridge.sendMessage('background', 'mcp:get-tools', {}, { timeout: 5 }),
      /Failed to send message after 2 retries/,
    );

    assert.strictEqual(dispatchCount, 3);
  });
});
