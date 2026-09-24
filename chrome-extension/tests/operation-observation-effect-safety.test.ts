/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'node:assert';
import { afterEach, describe, it } from 'node:test';
import {
  formatOperationObservations,
  observeOperations,
} from '../../pages/content/src/services/operation-observation.js';
import { useToolStore } from '../../pages/content/src/stores/tool.store.js';

const storage = new Map<string, string>();

(globalThis as any).window = {
  localStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  },
};

afterEach(() => {
  storage.clear();
  useToolStore.setState({ toolExecutions: {}, isExecuting: false, lastExecutionId: null });
});

describe('operation observation effect safety', () => {
  it('keeps C3 unknown and recommends reconciliation when dispatch may have occurred', () => {
    useToolStore.setState({
      toolExecutions: {
        exec_1: {
          id: 'exec_1',
          callId: 'call_1',
          toolName: 'side-effecting-tool',
          parameters: {},
          result: null,
          timestamp: Date.now(),
          status: 'error',
          error: 'Message timeout',
          executionEvidence: { dispatchState: 'possibly-dispatched', attemptCount: 1, attemptId: 'attempt_1' },
        },
      },
      isExecuting: false,
      lastExecutionId: 'exec_1',
    });

    const operation = observeOperations().operations[0];
    assert.ok(operation);
    assert.strictEqual(operation.status, 'execution-uncertain');
    assert.strictEqual(operation.checkpoints.C3, 'unknown');
    assert.deepStrictEqual(operation.attemptIds, ['attempt_1']);
    assert.match(operation.nextAction, /reconcile the server effect; otherwise stop/);
    assert.ok(operation.uncertainty.some(note => note.includes('external effect is unresolved')));
    assert.match(formatOperationObservations(), /attempts=attempt_1/);
  });

  it('marks C3 failed when the bridge proves the request was not dispatched', () => {
    useToolStore.setState({
      toolExecutions: {
        exec_2: {
          id: 'exec_2',
          callId: 'call_2',
          toolName: 'tool',
          parameters: {},
          result: null,
          timestamp: Date.now(),
          status: 'error',
          error: 'Chrome runtime not available',
          executionEvidence: { dispatchState: 'not-dispatched', attemptCount: 1 },
        },
      },
      isExecuting: false,
      lastExecutionId: 'exec_2',
    });

    const operation = observeOperations().operations[0];
    assert.ok(operation);
    assert.strictEqual(operation.checkpoints.C3, 'failed');
    assert.match(operation.nextAction, /pre-dispatch failure/);
  });
});
