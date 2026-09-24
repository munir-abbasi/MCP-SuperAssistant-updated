/**
 * Delivery Recovery Store (Runtime Operation Contract, Stage 2)
 *
 * Persists bounded delivery receipts so a failed or skipped delivery can be retried
 * from the RETAINED RESULT without re-executing the tool. Deliberately separate from
 * execution history (`render_prescript/src/mcpexecute/storage.ts`): history proves
 * what ran; receipts prove what was delivered and enable recovery.
 *
 * Retention policy (explicit, per the runtime operation contract in ARCHITECTURE.md):
 * - Scope: text results only. File-attachment payloads are never retained.
 * - Size: retained results are capped at MAX_RETAINED_RESULT_CHARS; larger results
 *   are truncated and flagged via `resultTruncated`.
 * - Expiry: receipts expire after DELIVERY_RECEIPT_TTL_MS and are purged lazily on access.
 * - Restart: receipts live in localStorage and survive page reloads.
 * - Volume: at most MAX_RECEIPTS receipts; the oldest are pruned first.
 */

import { createLogger } from '@extension/shared/lib/logger';

const logger = createLogger('DeliveryRecovery');

export const DELIVERY_RECEIPT_TTL_MS = 30 * 60 * 1000; // 30 minutes
export const MAX_RETAINED_RESULT_CHARS = 64 * 1024; // 64 KiB
export const MAX_RECEIPTS = 20;
/** Retry budget per operation (Stage 4). Exhaustion stops retryDelivery with an explicit reason. */
export const MAX_RETRY_ATTEMPTS = 3;

const STORAGE_KEY = 'mcp_delivery_receipts';

/** Stage of the delivery pipeline (C5/C6 vocabulary from SYSTEM.md). */
export type DeliveryStage = 'acknowledged' | 'delivered' | 'failed' | 'skipped';
export type SubmissionStage = 'submitted' | 'failed';

export interface DeliveryReceipt {
  /** Operation identity from the renderer (tool-call card). */
  callId: string;
  functionName?: string;
  stage: DeliveryStage;
  attemptedAt: number;
  expiresAt: number;
  /** Destination bound at completion time (Stage 1). */
  destinationUrl: string;
  /** Retained result for retry; absent for file attachments or when nothing failed. */
  retainedResult?: string;
  resultTruncated?: boolean;
  /** Whether the (optional) auto-submit step completed for this operation. */
  submitted?: boolean;
  /** C6 evidence, kept separate so later submission failure cannot erase confirmed C5 delivery. */
  submission?: {
    stage: SubmissionStage;
    attemptedAt: number;
    error?: string;
  };
  error?: string;
  /**
   * Retry attempts consumed for this operation (Stage 4 budget). Incremented BEFORE
   * each retry acts, so a crash mid-retry still counts; preserved when a later
   * outcome overwrites the receipt so the budget cannot silently reset.
   */
  attempts?: number;
}

const safeRead = (): Record<string, DeliveryReceipt> => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, DeliveryReceipt>) : {};
  } catch (error) {
    logger.warn('[DeliveryRecovery] Failed to read receipts:', error);
    return {};
  }
};

const safeWrite = (receipts: Record<string, DeliveryReceipt>): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
  } catch (error) {
    logger.warn('[DeliveryRecovery] Failed to persist receipts:', error);
  }
};

/** Drops expired receipts and enforces the volume cap. Returns the live set. */
const purgeAndEnforce = (receipts: Record<string, DeliveryReceipt>): Record<string, DeliveryReceipt> => {
  const now = Date.now();
  const live = Object.entries(receipts)
    .filter(([, receipt]) => receipt.expiresAt > now)
    .sort(([, a], [, b]) => b.attemptedAt - a.attemptedAt)
    .slice(0, MAX_RECEIPTS);
  return Object.fromEntries(live);
};

export function boundRetainedResult(result: string): { retainedResult: string; resultTruncated: boolean } {
  if (result.length <= MAX_RETAINED_RESULT_CHARS) {
    return { retainedResult: result, resultTruncated: false };
  }
  return { retainedResult: result.slice(0, MAX_RETAINED_RESULT_CHARS), resultTruncated: true };
}

/**
 * Record (or overwrite) the receipt for an operation. Overwriting is intentional:
 * the latest delivery attempt for a callId is the authoritative outcome.
 */
export function recordDeliveryReceipt(
  input: Omit<DeliveryReceipt, 'attemptedAt' | 'expiresAt'> & { attemptedAt?: number },
): DeliveryReceipt {
  const attemptedAt = input.attemptedAt ?? Date.now();
  const receipt: DeliveryReceipt = {
    ...input,
    attemptedAt,
    expiresAt: attemptedAt + DELIVERY_RECEIPT_TTL_MS,
  };

  const receipts = purgeAndEnforce(safeRead());
  // Preserve the retry budget across outcome rewrites (latest attempt is authoritative
  // for stage/error, but consumed attempts are cumulative for the operation).
  const priorAttempts = receipts[receipt.callId]?.attempts;
  if (priorAttempts && !receipt.attempts) receipt.attempts = priorAttempts;
  receipts[receipt.callId] = receipt;
  safeWrite(receipts);
  logger.debug(`[DeliveryRecovery] Receipt recorded (${receipt.stage}) for callId=${receipt.callId}`);
  return receipt;
}

export function getDeliveryReceipt(callId: string): DeliveryReceipt | null {
  const receipts = purgeAndEnforce(safeRead());
  safeWrite(receipts);
  return receipts[callId] ?? null;
}

export function listDeliveryReceipts(): DeliveryReceipt[] {
  const receipts = purgeAndEnforce(safeRead());
  safeWrite(receipts);
  return Object.values(receipts).sort((a, b) => b.attemptedAt - a.attemptedAt);
}

/**
 * Consume one unit of the retry budget for an operation. Callers must do this
 * BEFORE attempting the retry (crash-safe accounting). Returns the updated receipt
 * or null when the operation has no receipt or the budget is already exhausted.
 */
export function recordRetryAttempt(callId: string): DeliveryReceipt | null {
  const receipts = purgeAndEnforce(safeRead());
  const existing = receipts[callId];
  if (!existing) return null;
  const attempts = (existing.attempts ?? 0) + 1;
  if (attempts > MAX_RETRY_ATTEMPTS) return null;
  const updated: DeliveryReceipt = { ...existing, attempts };
  receipts[callId] = updated;
  safeWrite(receipts);
  return updated;
}

export function updateDeliveryReceipt(callId: string, patch: Partial<DeliveryReceipt>): DeliveryReceipt | null {
  const receipts = purgeAndEnforce(safeRead());
  const existing = receipts[callId];
  if (!existing) return null;
  const updated: DeliveryReceipt = { ...existing, ...patch };
  receipts[callId] = updated;
  safeWrite(receipts);
  return updated;
}
