/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';

const storage = new Map<string, string>();

(globalThis as any).window = {
  localStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  },
  location: { href: 'https://example.test/chat' },
};

const { automationService } = await import('../../pages/content/src/services/automation.service.js');
const { getDeliveryReceipt, recordDeliveryReceipt } = await import(
  '../../pages/content/src/services/delivery-recovery.js'
);
const { observeOperations } = await import('../../pages/content/src/services/operation-observation.js');

describe('delivery checkpoint recovery', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('serializes concurrent page deliveries to the same active input', async () => {
    const service = automationService as any;
    const originalGetAutomationState = service.getAutomationState;
    const originalExposeAutomationStateToWindow = service.exposeAutomationStateToWindow;
    const originalInsert = service.handleAutoInsert;

    let insertCalls = 0;
    let activeInsertions = 0;
    let maxConcurrentInsertions = 0;
    let releaseFirstInsert!: () => void;
    let firstInsertStarted!: () => void;
    const firstInsertStartedPromise = new Promise<void>(resolve => {
      firstInsertStarted = resolve;
    });
    const firstInsertReleasePromise = new Promise<void>(resolve => {
      releaseFirstInsert = resolve;
    });

    service.getAutomationState = async () => ({
      autoInsert: true,
      autoSubmit: false,
      autoExecute: false,
      autoInsertDelay: 0,
      autoSubmitDelay: 0,
      autoExecuteDelay: 0,
    });
    service.exposeAutomationStateToWindow = async () => undefined;
    service.handleAutoInsert = async () => {
      insertCalls += 1;
      activeInsertions += 1;
      maxConcurrentInsertions = Math.max(maxConcurrentInsertions, activeInsertions);
      if (insertCalls === 1) {
        firstInsertStarted();
        await firstInsertReleasePromise;
      }
      activeInsertions -= 1;
      return true;
    };

    try {
      const first = automationService.triggerTestAutomation({ result: 'first', callId: 'call-first' });
      await firstInsertStartedPromise;
      const second = automationService.triggerTestAutomation({ result: 'second', callId: 'call-second' });

      await new Promise(resolve => setImmediate(resolve));
      const callsBeforeFirstReleased = insertCalls;
      releaseFirstInsert();
      await Promise.all([first, second]);

      assert.strictEqual(callsBeforeFirstReleased, 1);
      assert.strictEqual(maxConcurrentInsertions, 1);
      assert.strictEqual(insertCalls, 2);
    } finally {
      releaseFirstInsert();
      service.getAutomationState = originalGetAutomationState;
      service.exposeAutomationStateToWindow = originalExposeAutomationStateToWindow;
      service.handleAutoInsert = originalInsert;
    }
  });

  it('promotes adapter acknowledgement to C5 only after verified page state', async () => {
    const service = automationService as any;
    const callId = 'call-page-verified';
    const confirmed = await service.confirmTextInsertion(
      { result: 'verified text', callId, functionName: 'test-tool' },
      window.location.href,
      { verifyTextInsertion: async () => 'verified' },
    );

    assert.strictEqual(confirmed, true);
    const receipt = getDeliveryReceipt(callId);
    assert.ok(receipt);
    assert.strictEqual(receipt.stage, 'delivered');

    const observation = observeOperations().operations.find(operation => operation.key === callId);
    assert.ok(observation);
    assert.strictEqual(observation.checkpoints.C5, 'confirmed');
  });

  it('keeps acknowledgement-only delivery unconfirmed and does not blindly reinsert on retry', async () => {
    const service = automationService as any;
    const callId = 'call-page-unverified';
    const confirmed = await service.confirmTextInsertion(
      { result: 'unverified text', callId, functionName: 'test-tool' },
      window.location.href,
      { verifyTextInsertion: async () => 'unavailable' },
    );

    assert.strictEqual(confirmed, false);
    const receipt = getDeliveryReceipt(callId);
    assert.ok(receipt);
    assert.strictEqual(receipt.stage, 'acknowledged');

    const observation = observeOperations().operations.find(operation => operation.key === callId);
    assert.ok(observation);
    assert.strictEqual(observation.status, 'delivery-acknowledged');
    assert.strictEqual(observation.checkpoints.C5, 'unknown');

    const originalReconcile = service.reconcileAcknowledgedDelivery;
    const originalInsert = service.handleAutoInsert;
    let insertCalls = 0;
    service.reconcileAcknowledgedDelivery = async () => false;
    service.handleAutoInsert = async () => {
      insertCalls += 1;
      return true;
    };

    try {
      const result = await automationService.retryDelivery(callId);
      assert.deepStrictEqual(result, { success: false, reason: 'page-state-unverified' });
      assert.strictEqual(insertCalls, 0);
    } finally {
      service.reconcileAcknowledgedDelivery = originalReconcile;
      service.handleAutoInsert = originalInsert;
    }
  });

  it('preserves confirmed C5 and retries only C6 after submission failure', async () => {
    const callId = 'call-submit-retry';
    recordDeliveryReceipt({
      callId,
      functionName: 'side-effecting-tool',
      stage: 'delivered',
      destinationUrl: window.location.href,
    });

    const service = automationService as any;
    service.recordSubmissionOutcome({ callId, functionName: 'side-effecting-tool' }, 'failed', 'submit-form-failed');

    const failedReceipt = getDeliveryReceipt(callId);
    assert.ok(failedReceipt);
    assert.strictEqual(failedReceipt.stage, 'delivered');
    assert.strictEqual(failedReceipt.submission?.stage, 'failed');

    const beforeRetry = observeOperations().operations.find(operation => operation.key === callId);
    assert.ok(beforeRetry);
    assert.strictEqual(beforeRetry.status, 'submission-failed');
    assert.strictEqual(beforeRetry.checkpoints.C5, 'confirmed');
    assert.strictEqual(beforeRetry.checkpoints.C6, 'failed');

    let insertCalls = 0;
    let submitCalls = 0;
    const originalInsert = service.handleAutoInsert;
    const originalSubmit = service.handleAutoSubmit;

    service.handleAutoInsert = async () => {
      insertCalls += 1;
      return true;
    };
    service.handleAutoSubmit = async (detail: { callId?: string; functionName?: string }) => {
      submitCalls += 1;
      service.recordSubmissionOutcome(detail, 'submitted');
      return true;
    };

    try {
      const result = await automationService.retryDelivery(callId);
      assert.deepStrictEqual(result, { success: true });
      assert.strictEqual(insertCalls, 0);
      assert.strictEqual(submitCalls, 1);

      const recoveredReceipt = getDeliveryReceipt(callId);
      assert.ok(recoveredReceipt);
      assert.strictEqual(recoveredReceipt.stage, 'delivered');
      assert.strictEqual(recoveredReceipt.submission?.stage, 'submitted');

      const afterRetry = observeOperations().operations.find(operation => operation.key === callId);
      assert.ok(afterRetry);
      assert.strictEqual(afterRetry.status, 'submitted');
      assert.strictEqual(afterRetry.checkpoints.C5, 'confirmed');
      assert.strictEqual(afterRetry.checkpoints.C6, 'confirmed');
    } finally {
      service.handleAutoInsert = originalInsert;
      service.handleAutoSubmit = originalSubmit;
    }
  });
});
