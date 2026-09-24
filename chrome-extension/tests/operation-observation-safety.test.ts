/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';

const storage = new Map<string, string>();

(globalThis as any).window = {
  localStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
  },
};

const { useToolStore } = await import('../../pages/content/src/stores/tool.store.js');
const { observeOperations } = await import('../../pages/content/src/services/operation-observation.js');

describe('operation observation safety', () => {
  beforeEach(() => {
    storage.clear();
    useToolStore.setState({
      toolExecutions: {},
      isExecuting: false,
      lastExecutionId: null,
    });
  });

  it('keeps C3 unknown and refuses blind re-execution after an ambiguous execution error', () => {
    const timestamp = Date.now();
    useToolStore.setState({
      toolExecutions: {
        'exec-1': {
          id: 'exec-1',
          toolName: 'side-effecting-tool',
          parameters: {},
          result: null,
          timestamp,
          status: 'error',
          error: 'Message timeout after 30000ms for mcp:call-tool to background',
          callId: 'call-1',
        },
      },
      isExecuting: false,
      lastExecutionId: 'exec-1',
    });

    const operation = observeOperations().operations.find(candidate => candidate.key === 'call-1');

    assert.ok(operation);
    assert.strictEqual(operation.status, 'execution-uncertain');
    assert.strictEqual(operation.checkpoints.C3, 'unknown');
    assert.match(operation.nextAction, /reconcile/i);
    assert.match(operation.nextAction, /stop/i);
    assert.doesNotMatch(operation.nextAction, /re-execute/i);
    assert.ok(operation.uncertainty.some(note => /dispatch.*unknown/i.test(note)));
  });
});
