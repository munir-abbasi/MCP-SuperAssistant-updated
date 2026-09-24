/**
 * Operation Observation (Runtime Operation Contract, Stage 3)
 *
 * Derives a compact snapshot of in-flight and recent operations by joining the two
 * real owners of operation state:
 *   - `useToolStore.toolExecutions`  (in-memory; cleared on reload)
 *   - delivery receipts               (localStorage; survives reloads)
 *
 * Pure derivation: no new state, no events, no dispatch paths. Checkpoint states use
 * the C1–C6 ladder from SYSTEM.md; only C3–C6 are derivable here — C1 (parse) and
 * C2 (render) are owned by render_prescript and reported in `scope`, not guessed.
 * Per AGENT_GUIDE.md, `unknown` is a distinct outcome from `failed`.
 */

import { useToolStore } from '../stores/tool.store';
import type { ToolExecution } from '../types/stores';
import { MAX_RETAINED_RESULT_CHARS, MAX_RETRY_ATTEMPTS, listDeliveryReceipts } from './delivery-recovery';
import type { DeliveryReceipt, DeliveryStage, SubmissionStage } from './delivery-recovery';

/** Which checkpoints this snapshot can actually speak about. */
export const OBSERVATION_SCOPE = 'C3–C6 derivable from tool store + receipts; C1–C2 owned by render_prescript';

export type CheckpointState = 'confirmed' | 'failed' | 'skipped' | 'in-progress' | 'unknown';

export type OperationStatus =
  | 'executing'
  | 'execution-failed'
  | 'execution-uncertain'
  | 'awaiting-delivery'
  | 'delivery-acknowledged'
  | 'delivered'
  | 'submitted'
  | 'submission-failed'
  | 'delivery-failed'
  | 'delivery-skipped'
  | 'delivery-only';

export interface OperationObservation {
  /** Operation identity from the renderer; executions without one fall back to their executionId. */
  key: string;
  functionName?: string;
  /** How the two owners were joined. `receipt-only` means the page reloaded (store cleared, receipt persisted). */
  correlation: 'execution+receipt' | 'execution-only' | 'receipt-only';
  executionIds: string[];
  attemptIds: string[];
  status: OperationStatus;
  checkpoints: { C3: CheckpointState; C4: CheckpointState; C5: CheckpointState; C6: CheckpointState };
  blocker?: string;
  nextAction: string;
  uncertainty: string[];
  timestamps: { startedAt?: number; completedAt?: number; deliveredAt?: number };
}

export interface OperationSnapshot {
  scope: string;
  operations: OperationObservation[];
  summary: Record<OperationStatus, number>;
}

const stageToCheckpoint = (stage: DeliveryStage | undefined): CheckpointState =>
  stage === 'delivered' ? 'confirmed' : stage === 'failed' ? 'failed' : stage === 'skipped' ? 'skipped' : 'unknown';

const emptySummary = (): Record<OperationStatus, number> => ({
  executing: 0,
  'execution-failed': 0,
  'execution-uncertain': 0,
  'awaiting-delivery': 0,
  'delivery-acknowledged': 0,
  delivered: 0,
  submitted: 0,
  'submission-failed': 0,
  'delivery-failed': 0,
  'delivery-skipped': 0,
  'delivery-only': 0,
});

const deriveCheckpoints = (
  execution: ToolExecution | undefined,
  receiptStage: DeliveryStage | undefined,
  submitted: boolean | undefined,
  submissionStage: SubmissionStage | undefined,
): OperationObservation['checkpoints'] => ({
  C3:
    execution?.status === 'pending'
      ? 'in-progress'
      : execution?.status === 'success'
        ? 'confirmed'
        : execution?.status === 'error'
          ? execution.executionEvidence?.dispatchState === 'not-dispatched'
            ? 'failed'
            : 'unknown'
          : 'unknown',
  C4:
    execution?.status === 'success' && execution.result !== null && execution.result !== undefined
      ? 'confirmed'
      : 'unknown',
  C5: stageToCheckpoint(receiptStage ?? execution?.delivery?.stage),
  C6:
    submitted === true || submissionStage === 'submitted'
      ? 'confirmed'
      : submissionStage === 'failed'
        ? 'failed'
        : 'unknown',
});

const deriveStatus = (
  execution: ToolExecution | undefined,
  receiptStage: DeliveryStage | undefined,
  submitted: boolean | undefined,
  submissionStage: SubmissionStage | undefined,
): OperationStatus => {
  if (!execution) {
    // Receipt survived a reload; map the receipt stage directly.
    if (receiptStage === 'acknowledged') return 'delivery-acknowledged';
    if (receiptStage === 'delivered') {
      if (submitted || submissionStage === 'submitted') return 'submitted';
      if (submissionStage === 'failed') return 'submission-failed';
      return 'delivered';
    }
    if (receiptStage === 'failed') return 'delivery-failed';
    if (receiptStage === 'skipped') return 'delivery-skipped';
    return 'delivery-only';
  }
  if (execution.status === 'pending') return 'executing';
  if (execution.status === 'error') {
    return execution.executionEvidence?.dispatchState === 'not-dispatched' ? 'execution-failed' : 'execution-uncertain';
  }
  if (receiptStage === 'acknowledged') return 'delivery-acknowledged';
  if (receiptStage === 'delivered') {
    if (submitted || submissionStage === 'submitted') return 'submitted';
    if (submissionStage === 'failed') return 'submission-failed';
    return 'delivered';
  }
  if (receiptStage === 'failed') return 'delivery-failed';
  if (receiptStage === 'skipped') return 'delivery-skipped';
  return 'awaiting-delivery';
};

const deriveNextAction = (
  status: OperationStatus,
  callId: string,
  receipt: Pick<DeliveryReceipt, 'retainedResult' | 'attempts'> | undefined,
): string => {
  switch (status) {
    case 'executing':
      return 'wait for completion event (tool:execution-completed)';
    case 'execution-failed':
      return 'inspect the pre-dispatch failure; retry only after correcting it';
    case 'execution-uncertain':
      return 'dispatch may have occurred — reconcile the server effect; otherwise stop';
    case 'delivery-failed':
    case 'delivery-skipped': {
      if (!receipt?.retainedResult) {
        return 'no retained result — verify/reconcile page and server state; do not re-execute automatically';
      }
      const attempts = receipt.attempts ?? 0;
      if (attempts >= MAX_RETRY_ATTEMPTS) {
        return 'retry budget exhausted — verify page state or stop';
      }
      return `retry (attempt ${attempts + 1}/${MAX_RETRY_ATTEMPTS}): __automationService.retryDelivery('${callId}')`;
    }
    case 'awaiting-delivery':
      return 'C5 not attempted — check auto-insert preference or insert manually';
    case 'delivery-acknowledged':
      return 'adapter acknowledged insertion — verify page state before submit or retry';
    case 'delivered':
      return 'optional submit (auto-submit off or pending)';
    case 'submitted':
      return 'none — C7 outside observation boundary';
    case 'submission-failed': {
      const attempts = receipt?.attempts ?? 0;
      if (attempts >= MAX_RETRY_ATTEMPTS) {
        return 'retry budget exhausted — verify page state or stop';
      }
      return `retry submission (attempt ${attempts + 1}/${MAX_RETRY_ATTEMPTS}): __automationService.retryDelivery('${callId}')`;
    }
    case 'delivery-only':
      return 'verify page state; execution record was lost on reload';
  }
};

/**
 * Build the unified snapshot. Executions are grouped by `callId` when present
 * (re-executions intentionally reuse the callId); legacy executions without a
 * callId form standalone entries that cannot be correlated with delivery.
 */
export function observeOperations(): OperationSnapshot {
  const summary = emptySummary();
  const executions = Object.values(useToolStore.getState().toolExecutions);
  const receipts = new Map(listDeliveryReceipts().map(receipt => [receipt.callId, receipt]));

  // Group executions by callId (or their own id when uncorrelated).
  const groups = new Map<string, ToolExecution[]>();
  for (const execution of executions) {
    const key = execution.callId ?? execution.id;
    groups.set(key, [...(groups.get(key) ?? []), execution]);
  }

  const operations: OperationObservation[] = [];

  for (const [key, execs] of groups) {
    const receipt = receipts.get(key);
    if (receipt) receipts.delete(key); // consumed; leftovers become receipt-only ops
    const current = execs.reduce((a, b) => (b.timestamp >= a.timestamp ? b : a));
    const receiptStage = receipt?.stage;
    const submitted = receipt?.submitted;
    const submissionStage = receipt?.submission?.stage;
    const status = deriveStatus(current, receiptStage, submitted, submissionStage);
    const uncertainty: string[] = [];
    let correlation: OperationObservation['correlation'] = receipt
      ? execs.length > 0
        ? 'execution+receipt'
        : 'receipt-only'
      : 'execution-only';

    if (!current?.callId) {
      correlation = 'execution-only';
      uncertainty.push('no callId on execution — delivery cannot be correlated (legacy path)');
    }
    if (correlation === 'receipt-only') {
      uncertainty.push('execution record not in memory (store cleared on reload; receipt persisted)');
    }
    if (receipt?.resultTruncated) {
      uncertainty.push(`retained result truncated at ${MAX_RETAINED_RESULT_CHARS} chars`);
    }
    if (receipt?.attempts) {
      uncertainty.push(`${receipt.attempts} retry attempt(s) consumed`);
    }
    if (receipt?.stage === 'acknowledged') {
      uncertainty.push('adapter acknowledged insertion, but C5 page state is not independently verified');
    }

    const checkpoints = deriveCheckpoints(current, receiptStage, submitted, submissionStage);
    if (current?.status === 'error' && checkpoints.C3 === 'unknown') {
      uncertainty.push('tool dispatch is unknown; external effect is unresolved');
    }

    summary[status] += 1;
    operations.push({
      key,
      functionName: current?.toolName ?? receipt?.functionName,
      correlation,
      executionIds: execs.map(execution => execution.id),
      attemptIds: execs.flatMap(execution =>
        execution.executionEvidence?.attemptId ? [execution.executionEvidence.attemptId] : [],
      ),
      status,
      checkpoints,
      blocker:
        current?.status === 'error'
          ? current.error
          : (receipt?.submission?.error ?? receipt?.error ?? current?.delivery?.error),
      nextAction: deriveNextAction(status, key, receipt),
      uncertainty,
      timestamps: {
        startedAt: execs.length > 0 ? Math.min(...execs.map(execution => execution.timestamp)) : undefined,
        completedAt: current && current.status !== 'pending' ? current.timestamp : undefined,
        deliveredAt: receipt?.attemptedAt ?? current?.delivery?.at,
      },
    });
  }

  // Receipts whose execution no longer exists (reload, or delivery recorded post-navigation).
  for (const [callId, receipt] of receipts) {
    const status = deriveStatus(undefined, receipt.stage, receipt.submitted, receipt.submission?.stage);
    const checkpoints = deriveCheckpoints(undefined, receipt.stage, receipt.submitted, receipt.submission?.stage);
    summary[status] += 1;
    operations.push({
      key: callId,
      functionName: receipt.functionName,
      correlation: 'receipt-only',
      executionIds: [],
      attemptIds: [],
      status,
      checkpoints,
      blocker: receipt.submission?.error ?? receipt.error,
      nextAction: deriveNextAction(status, callId, receipt),
      uncertainty: [
        'execution record not in memory (store cleared on reload; receipt persisted)',
        ...(receipt.stage === 'acknowledged'
          ? ['adapter acknowledged insertion, but C5 page state is not independently verified']
          : []),
      ],
      timestamps: { deliveredAt: receipt.attemptedAt },
    });
  }

  operations.sort(
    (a, b) =>
      (b.timestamps.startedAt ?? b.timestamps.deliveredAt ?? 0) -
      (a.timestamps.startedAt ?? a.timestamps.deliveredAt ?? 0),
  );
  return { scope: OBSERVATION_SCOPE, operations, summary };
}

const CHECKPOINT_GLYPH: Record<CheckpointState, string> = {
  confirmed: 'OK',
  failed: 'FAIL',
  skipped: 'SKIP',
  'in-progress': '...',
  unknown: '?',
};

/** One line per operation — the cheapest possible scan for a driving agent. */
export function formatOperationObservations(): string {
  const { scope, operations, summary } = observeOperations();
  const lines: string[] = [
    `operations (${operations.length}) — ${scope}`,
    `summary: ${
      Object.entries(summary)
        .filter(([, count]) => count > 0)
        .map(([status, count]) => `${status}=${count}`)
        .join(' ') || 'empty'
    }`,
  ];
  for (const op of operations) {
    const cps = Object.entries(op.checkpoints)
      .map(([checkpoint, state]) => `${checkpoint}:${CHECKPOINT_GLYPH[state]}`)
      .join(' ');
    const attempts = op.attemptIds.length > 0 ? op.attemptIds.join(',') : 'none';
    lines.push(
      `${op.key}  ${op.functionName ?? '(unknown tool)'}  attempts=${attempts}  status=${op.status}  ${cps}  next=${op.nextAction}`,
    );
    if (op.blocker) lines.push(`  blocker: ${op.blocker}`);
    for (const note of op.uncertainty) lines.push(`  uncertainty: ${note}`);
  }
  return lines.join('\n');
}
