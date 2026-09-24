/**
 * Automation Service for MCP SuperAssistant
 *
 * This service handles the automation features (auto insert, auto submit, auto execute)
 * that were previously part of the legacy adapter system. It integrates with the new
 * Zustand architecture and plugin-based adapter system.
 *
 * Features:
 * - Auto Insert: Automatically insert function execution results into the current page
 * - Auto Submit: Automatically submit forms after auto-insertion
 * - Auto Execute: Log when tool execution is completed (extensible for future features)
 *
 * The service listens for 'mcp:tool-execution-complete' events and performs actions
 * based on the current automation state from the user preferences store.
 */

import { eventBus } from '../events/event-bus';
import type { AdapterPlugin, TextInsertionVerification } from '../types/plugins';
import type { UserPreferences } from '../types/stores';
import { createLogger } from '@extension/shared/lib/logger';
import { IS_DEV } from '@extension/env';
import {
  MAX_RETRY_ATTEMPTS,
  boundRetainedResult,
  getDeliveryReceipt,
  listDeliveryReceipts,
  recordDeliveryReceipt,
  recordRetryAttempt,
  updateDeliveryReceipt,
} from './delivery-recovery';
import type { DeliveryStage, SubmissionStage } from './delivery-recovery';
import { formatOperationObservations, observeOperations } from './operation-observation';

// Store references for accessing state outside React components

const logger = createLogger('AutomationService');

interface CurrentAdapterState {
  plugin: AdapterPlugin | undefined;
  insertText: NonNullable<AdapterPlugin['insertText']> | null;
  attachFile: NonNullable<AdapterPlugin['attachFile']> | null;
  submitForm: NonNullable<AdapterPlugin['submitForm']> | null;
  isReady: boolean;
}

const storeRefs: {
  getUserPreferences: (() => Promise<UserPreferences>) | null;
  getCurrentAdapterState: (() => Promise<CurrentAdapterState>) | null;
} = {
  getUserPreferences: null,
  getCurrentAdapterState: null,
};

// Initialize store access functions
async function initializeStoreAccess() {
  try {
    // Store the store access functions for later use
    storeRefs.getUserPreferences = async () => {
      // Import dynamically to avoid circular dependencies
      const { useUIStore } = await import('../stores/ui.store');
      return useUIStore.getState().preferences;
    };

    storeRefs.getCurrentAdapterState = async () => {
      // Import dynamically to avoid circular dependencies
      const { useAdapterStore } = await import('../stores/adapter.store');
      const adapterState = useAdapterStore.getState();
      const activeAdapterRegistration = adapterState.getActiveAdapter();

      const plugin = activeAdapterRegistration?.plugin;

      return {
        plugin,
        // Bind methods to maintain proper 'this' context
        insertText: plugin?.insertText ? plugin.insertText.bind(plugin) : null,
        attachFile: plugin?.attachFile ? plugin.attachFile.bind(plugin) : null,
        submitForm: plugin?.submitForm ? plugin.submitForm.bind(plugin) : null,
        isReady: !!plugin && activeAdapterRegistration.status === 'active' && !adapterState.lastAdapterError,
      };
    };

    logger.debug('[AutomationService] Store access functions initialized');
  } catch (error) {
    logger.error('[AutomationService] Error initializing store access:', error);
  }
}

// Type definitions for automation events
export interface ToolExecutionCompleteDetail {
  result?: string;
  isFileAttachment?: boolean;
  file?: File;
  fileName?: string;
  confirmationText?: string;
  skipAutoInsertCheck?: boolean;
  callId?: string;
  functionName?: string;
  /** Destination URL captured when the operation completed. Delivery is invalidated if the page has navigated away. */
  destinationUrl?: string;
}

export interface AutomationState {
  autoInsert: boolean;
  autoSubmit: boolean;
  autoExecute: boolean;
  autoInsertDelay: number;
  autoSubmitDelay: number;
  autoExecuteDelay: number;
}

/**
 * Automation Service Class
 * Handles all automation logic for MCP tool execution results
 */
export class AutomationService {
  private static instance: AutomationService | null = null;
  private isInitialized = false;
  private eventListener: ((event: Event) => void) | null = null;
  private pageMutationQueue: Promise<unknown> = Promise.resolve();

  // Private constructor for singleton pattern
  private constructor() {}

  /**
   * Get the singleton instance of AutomationService
   */
  public static getInstance(): AutomationService {
    if (!AutomationService.instance) {
      AutomationService.instance = new AutomationService();
    }
    return AutomationService.instance;
  }

  /**
   * Initialize the automation service
   * Sets up event listeners and integrates with the store system
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.debug('[AutomationService] Already initialized, skipping');
      return;
    }

    logger.debug('[AutomationService] Initializing automation service');

    // Initialize store access functions
    await initializeStoreAccess();

    // Set up event listener for tool execution completion
    this.setupToolExecutionListener();

    // Listen for MCP state changes to update automation availability
    this.setupMCPStateListener();

    // Expose initial automation state to window for render_prescript access
    await this.exposeAutomationStateToWindow();

    this.isInitialized = true;
    logger.debug('[AutomationService] Automation service initialized successfully');
  }

  /**
   * Clean up the automation service
   * Removes event listeners and cleans up resources
   */
  public cleanup(): void {
    if (!this.isInitialized) {
      return;
    }

    logger.debug('[AutomationService] Cleaning up automation service');

    // Remove DOM event listener
    if (this.eventListener) {
      document.removeEventListener('mcp:tool-execution-complete', this.eventListener);
      this.eventListener = null;
    }

    this.isInitialized = false;
    logger.debug('[AutomationService] Automation service cleaned up');
  }

  /**
   * Set up the main event listener for tool execution completion
   */
  private setupToolExecutionListener(): void {
    // Remove existing listener if any
    if (this.eventListener) {
      document.removeEventListener('mcp:tool-execution-complete', this.eventListener);
    }

    // Create new event listener
    this.eventListener = (event: Event) => {
      this.handleToolExecutionComplete(event as CustomEvent<ToolExecutionCompleteDetail>);
    };

    // Add event listener to document
    document.addEventListener('mcp:tool-execution-complete', this.eventListener);
    logger.debug('[AutomationService] Tool execution event listener registered');
  }

  /** Serialize page-input mutations so concurrent operations cannot interleave insert/submit steps. */
  private enqueuePageMutation<T>(operation: () => Promise<T>): Promise<T> {
    const run = this.pageMutationQueue.then(operation, operation);
    this.pageMutationQueue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  /**
   * Set up listener for MCP state changes
   */
  private setupMCPStateListener(): void {
    // Listen for MCP connection state changes via the event bus
    eventBus.on('connection:status-changed', ({ status }) => {
      logger.debug('[AutomationService] MCP connection status changed:', status);
      // Could add logic here to disable automation when MCP is disconnected
    });
  }

  /**
   * Main handler for tool execution completion events
   */
  private handleToolExecutionComplete(event: CustomEvent<ToolExecutionCompleteDetail>): Promise<void> {
    const destinationUrl = window.location.href;
    return this.enqueuePageMutation(() => this.processToolExecutionComplete(event, destinationUrl));
  }

  private async processToolExecutionComplete(
    event: CustomEvent<ToolExecutionCompleteDetail>,
    destinationUrl: string,
  ): Promise<void> {
    if (!event.detail) {
      logger.warn('[AutomationService] Tool execution complete event received without detail');
      return;
    }

    const detail = event.detail;
    logger.debug('[AutomationService] Tool execution complete event received:', detail);

    try {
      // Get current automation state from user preferences
      const automationState = await this.getAutomationState();

      if (!automationState) {
        logger.debug('[AutomationService] Could not get automation state, skipping automation');
        return;
      }

      // Update automation state on window for render_prescript access
      await this.exposeAutomationStateToWindow();

      logger.debug('[AutomationService] Current automation state:', automationState);

      // Handle Auto Execute (always run if enabled, independent of other actions)
      if (automationState.autoExecute) {
        this.handleAutoExecute(detail);
      }

      // Handle Auto Insert and Auto Submit logic
      // Skip auto-insert if skipAutoInsertCheck is true (for manual actions)
      const shouldAutoInsert = automationState.autoInsert && !detail.skipAutoInsertCheck;

      if (shouldAutoInsert) {
        const insertSuccess = await this.handleAutoInsert(detail, destinationUrl);

        // Only proceed with auto submit if auto insert was successful
        // and auto submit is enabled
        if (insertSuccess && automationState.autoSubmit) {
          await this.handleAutoSubmit(detail, destinationUrl);
        }
      } else {
        logger.debug('[AutomationService] Auto Insert disabled, skipping insert and submit actions');
      }
    } catch (error) {
      logger.error('[AutomationService] Error handling tool execution complete:', error);
    }
  }

  /**
   * Get current automation state from user preferences store
   */
  private async getAutomationState(): Promise<AutomationState | null> {
    try {
      // Access the user preferences using the store reference
      if (!storeRefs.getUserPreferences) {
        logger.error('[AutomationService] Store access not initialized');
        return null;
      }

      const preferences = await storeRefs.getUserPreferences();

      // Extract automation settings from preferences
      return {
        autoInsert: preferences.autoInsert || false,
        autoSubmit: preferences.autoSubmit || false,
        autoExecute: preferences.autoExecute || false,
        autoInsertDelay: preferences.autoInsertDelay || 0,
        autoSubmitDelay: preferences.autoSubmitDelay || 0,
        autoExecuteDelay: preferences.autoExecuteDelay || 0,
      };
    } catch (error) {
      logger.error('[AutomationService] Error getting automation state:', error);
      return null;
    }
  }

  /**
   * Handle Auto Execute functionality
   * Currently just logs the execution, but extensible for future features
   */
  private async handleAutoExecute(detail: ToolExecutionCompleteDetail): Promise<void> {
    const preferences = await storeRefs.getUserPreferences?.();
    const delay = preferences?.autoExecuteDelay || 0;

    if (delay > 0) {
      logger.debug(`Auto Execute: Waiting ${delay} seconds before execution`);
      await new Promise(resolve => setTimeout(resolve, delay * 1000));
    }

    logger.debug('[AutomationService] Auto Execute: Tool execution completed', {
      functionName: detail.functionName,
      callId: detail.callId,
      hasResult: !!detail.result,
      isFileAttachment: detail.isFileAttachment,
      fileName: detail.fileName,
      appliedDelay: delay,
    });

    // Emit event for potential future integrations
    // eventBus.emit('automation:execute-completed', {
    //   detail,
    //   timestamp: Date.now()
    // });
  }

  /**
   * Check whether the page is still at the destination captured for this operation.
   * Returns true when the destination matches (or was never recorded).
   */
  private isDestinationCurrent(destinationUrl?: string): boolean {
    if (!destinationUrl) return true; // No binding recorded; behave as before
    if (window.location.href !== destinationUrl) {
      logger.warn(
        `[AutomationService] Destination changed during delay; invalidating stale delivery ` +
          `(bound: ${destinationUrl}, current: ${window.location.href})`,
      );
      return false;
    }
    return true;
  }

  /**
   * Record a delivery outcome: persisted receipt (bounded, Stage 2) plus the
   * delivery field on the correlated tool-store execution. Failures and skips
   * retain the text result so retryDelivery can replay it without re-execution.
   */
  private recordDeliveryOutcome(
    detail: ToolExecutionCompleteDetail,
    destinationUrl: string | undefined,
    stage: DeliveryStage,
    error?: string,
    options?: { retainResult?: boolean },
  ): void {
    if (!detail.callId) {
      logger.debug('[AutomationService] No callId in completion detail; delivery outcome not persisted');
      return;
    }
    try {
      let retainedResult: string | undefined;
      let resultTruncated: boolean | undefined;
      if (options?.retainResult && !detail.isFileAttachment && typeof detail.result === 'string') {
        const bound = boundRetainedResult(detail.result);
        retainedResult = bound.retainedResult;
        resultTruncated = bound.resultTruncated;
      }

      recordDeliveryReceipt({
        callId: detail.callId,
        functionName: detail.functionName,
        stage,
        destinationUrl: destinationUrl ?? '',
        error,
        retainedResult,
        resultTruncated,
      });

      void this.markExecutionDelivery(detail.callId, stage, destinationUrl, error);
    } catch (recordError) {
      logger.warn('[AutomationService] Failed to record delivery outcome:', recordError);
    }
  }

  /** Update the delivery field on the tool-store execution correlated by callId. */
  private async markExecutionDelivery(
    callId: string,
    stage: DeliveryStage,
    destinationUrl: string | undefined,
    error?: string,
  ): Promise<void> {
    try {
      // Import dynamically to avoid circular dependencies (same pattern as above)
      const { useToolStore } = await import('../stores/tool.store');
      const state = useToolStore.getState();
      const entries = Object.values(state.toolExecutions);
      const match = [...entries].reverse().find(execution => execution.callId === callId);
      if (!match) {
        logger.debug(`[AutomationService] No execution record correlated to callId=${callId}`);
        return;
      }
      state.updateToolExecution({
        id: match.id,
        delivery: { stage, at: Date.now(), destinationUrl: destinationUrl ?? '', error },
      });
    } catch (storeError) {
      logger.warn('[AutomationService] Failed to mark execution delivery:', storeError);
    }
  }

  /** Record C6 independently from C5 so submission failure never rewrites confirmed delivery. */
  private recordSubmissionOutcome(detail: ToolExecutionCompleteDetail, stage: SubmissionStage, error?: string): void {
    if (!detail.callId) return;
    try {
      updateDeliveryReceipt(detail.callId, {
        ...(stage === 'submitted' ? { submitted: true } : {}),
        submission: { stage, attemptedAt: Date.now(), error },
      });
    } catch (recordError) {
      logger.warn('[AutomationService] Failed to record submission outcome:', recordError);
    }
  }

  /**
   * Promote an adapter insertion acknowledgement to confirmed C5 only when the
   * adapter can independently observe the expected text in page state.
   */
  private async confirmTextInsertion(
    detail: ToolExecutionCompleteDetail,
    destinationUrl: string | undefined,
    activePlugin: AdapterPlugin,
  ): Promise<boolean> {
    if (typeof detail.result !== 'string') return false;

    let verification: TextInsertionVerification = 'unavailable';
    try {
      verification = activePlugin.verifyTextInsertion
        ? await activePlugin.verifyTextInsertion(detail.result)
        : 'unavailable';
    } catch (verificationError) {
      logger.warn('[AutomationService] Text insertion page-state verification failed:', verificationError);
    }

    if (verification === 'verified') {
      this.recordDeliveryOutcome(detail, destinationUrl, 'delivered');
      return true;
    }

    if (verification === 'mismatch') {
      this.recordDeliveryOutcome(detail, destinationUrl, 'failed', 'page-state-mismatch', {
        retainResult: true,
      });
      return false;
    }

    this.recordDeliveryOutcome(detail, destinationUrl, 'acknowledged', 'page-state-unverified', {
      retainResult: true,
    });
    return false;
  }

  /** Reconcile an acknowledgement-only receipt without repeating the insertion. */
  private async reconcileAcknowledgedDelivery(
    detail: ToolExecutionCompleteDetail,
    destinationUrl: string | undefined,
  ): Promise<boolean> {
    if (!storeRefs.getCurrentAdapterState) return false;
    const { plugin: activePlugin, isReady } = await storeRefs.getCurrentAdapterState();
    if (!isReady || !activePlugin) return false;
    return this.confirmTextInsertion(detail, destinationUrl, activePlugin);
  }

  /**
   * Handle Auto Insert functionality
   * Inserts text or attaches files based on the execution result
   */
  private async handleAutoInsert(
    detail: ToolExecutionCompleteDetail,
    destinationUrl?: string,
    options?: { ignoreAutoInsertPreference?: boolean },
  ): Promise<boolean> {
    const preferences = await storeRefs.getUserPreferences?.();
    const delay = preferences?.autoInsertDelay || 0;

    if (delay > 0) {
      logger.debug(`Auto Insert: Waiting ${delay} seconds before insertion`);
      await new Promise(resolve => setTimeout(resolve, delay * 1000));
    }

    // Destination recheck after any configured delay: never retarget a stale delivery
    if (!this.isDestinationCurrent(destinationUrl)) {
      this.recordDeliveryOutcome(detail, destinationUrl, 'skipped', 'destination-changed', {
        retainResult: true,
      });
      return false;
    }

    // Preference recheck after any configured delay (Stage 4): a toggle-off during
    // the delay halts the stale action instead of delivering anyway.
    if (!options?.ignoreAutoInsertPreference) {
      const prefsAfterDelay = await storeRefs.getUserPreferences?.();
      if (prefsAfterDelay && prefsAfterDelay.autoInsert === false) {
        logger.debug('[AutomationService] auto-insert disabled during delay; halting stale action');
        this.recordDeliveryOutcome(detail, destinationUrl, 'skipped', 'auto-insert-disabled-during-delay', {
          retainResult: true,
        });
        return false;
      }
    }

    logger.debug('[AutomationService] Handling auto insert', {
      appliedDelay: delay,
      callId: detail.callId,
      functionName: detail.functionName,
      destinationUrl,
    });

    // Additional safety check: Don't auto-insert if skipAutoInsertCheck is true
    if (detail.skipAutoInsertCheck) {
      logger.debug('[AutomationService] Skipping auto insert due to skipAutoInsertCheck flag');
      return false;
    }

    try {
      // Get current adapter from the adapter hook
      if (!storeRefs.getCurrentAdapterState) {
        logger.error('[AutomationService] Adapter store access not initialized');
        return false;
      }

      const { plugin: activePlugin, insertText, attachFile, isReady } = await storeRefs.getCurrentAdapterState();

      if (!isReady || !activePlugin) {
        logger.warn('[AutomationService] No active adapter available for auto insert');
        this.recordDeliveryOutcome(detail, destinationUrl, 'failed', 'no-active-adapter', {
          retainResult: true,
        });
        return false;
      }

      logger.debug('[AutomationService] Using adapter for auto insert:', activePlugin.name);

      // Handle file attachment
      if (detail.isFileAttachment && detail.file && attachFile) {
        logger.debug('[AutomationService] Auto inserting file:', detail.file.name);

        try {
          const success = await attachFile(detail.file);

          if (success) {
            logger.debug('[AutomationService] File attached successfully via auto insert');
            this.recordDeliveryOutcome(detail, destinationUrl, 'delivered');

            // Optionally insert confirmation text if provided
            if (detail.confirmationText && insertText) {
              logger.debug('[AutomationService] Inserting file confirmation text');
              // Small delay to ensure file attachment is processed
              setTimeout(async () => {
                try {
                  await insertText(detail.confirmationText!);
                } catch (error) {
                  logger.error('[AutomationService] Error inserting confirmation text:', error);
                }
              }, 100);
            }

            return true;
          } else {
            logger.warn('[AutomationService] File attachment failed');
            this.recordDeliveryOutcome(detail, destinationUrl, 'failed', 'file-attachment-failed');
            return false;
          }
        } catch (attachError) {
          logger.error('[AutomationService] Error calling attachFile method:', attachError);
          this.recordDeliveryOutcome(detail, destinationUrl, 'failed', 'file-attachment-error');
          logger.error('[AutomationService] attachFile context info:', {
            hasAttachFile: !!attachFile,
            attachFileType: typeof attachFile,
            activePluginName: activePlugin?.name,
            fileName: detail.file?.name,
          });
          return false;
        }
      }

      // Handle text insertion
      else if (detail.result && insertText) {
        logger.debug('[AutomationService] Auto inserting text result');

        try {
          const success = await insertText(detail.result);

          if (success) {
            logger.debug('[AutomationService] Adapter acknowledged text insertion; verifying page state');
            return await this.confirmTextInsertion(detail, destinationUrl, activePlugin);
          } else {
            logger.warn('[AutomationService] Text insertion failed');
            this.recordDeliveryOutcome(detail, destinationUrl, 'failed', 'insert-text-failed', {
              retainResult: true,
            });
            return false;
          }
        } catch (insertError) {
          logger.error('[AutomationService] Error calling insertText method:', insertError);
          this.recordDeliveryOutcome(detail, destinationUrl, 'failed', 'insert-text-error', {
            retainResult: true,
          });
          logger.error('[AutomationService] insertText context info:', {
            hasInsertText: !!insertText,
            insertTextType: typeof insertText,
            activePluginName: activePlugin?.name,
          });
          return false;
        }
      }

      // No valid insertion method found
      else {
        logger.warn('[AutomationService] No valid insertion method found for auto insert', {
          hasResult: !!detail.result,
          isFileAttachment: detail.isFileAttachment,
          hasFile: !!detail.file,
          hasInsertText: !!insertText,
          hasAttachFile: !!attachFile,
        });
        return false;
      }
    } catch (error) {
      logger.error('[AutomationService] Error during auto insert:', error);
      return false;
    }
  }

  /**
   * Handle Auto Submit functionality
   * Submits the current form after auto insertion
   */
  private async handleAutoSubmit(detail: ToolExecutionCompleteDetail, destinationUrl?: string): Promise<boolean> {
    const preferences = await storeRefs.getUserPreferences?.();
    const delay = preferences?.autoSubmitDelay || 0;

    if (delay > 0) {
      logger.debug(`Auto Submit: Waiting ${delay} seconds before submission`);
      await new Promise(resolve => setTimeout(resolve, delay * 1000));
    }

    // Destination recheck after any configured delay: never retarget a stale delivery
    if (!this.isDestinationCurrent(destinationUrl)) {
      return false;
    }

    // Preference recheck after any configured delay (Stage 4): a toggle-off during
    // the delay halts the stale action. No receipt change: delivered-but-unsubmitted
    // is already the truthful recorded state.
    const prefsAfterDelay = await storeRefs.getUserPreferences?.();
    if (prefsAfterDelay && prefsAfterDelay.autoSubmit === false) {
      logger.debug('[AutomationService] auto-submit disabled during delay; not submitting');
      return false;
    }

    logger.debug('[AutomationService] Handling auto submit', {
      appliedDelay: delay,
      callId: detail.callId,
      functionName: detail.functionName,
      destinationUrl,
    });

    try {
      // Get current adapter from the adapter hook
      if (!storeRefs.getCurrentAdapterState) {
        logger.error('[AutomationService] Adapter store access not initialized');
        return false;
      }

      const { plugin: activePlugin, submitForm, isReady } = await storeRefs.getCurrentAdapterState();

      if (!isReady || !activePlugin || !submitForm) {
        logger.warn('[AutomationService] No active adapter or submit capability available for auto submit');
        this.recordSubmissionOutcome(detail, 'failed', 'no-submit-capability');
        return false;
      }

      logger.debug('[AutomationService] Using adapter for auto submit:', activePlugin.name);

      // Add a small delay to ensure any prior insertion/attachment has settled in the UI
      await new Promise(resolve => setTimeout(resolve, 800));

      try {
        const success = await submitForm();

        if (success) {
          logger.debug('[AutomationService] Form submitted successfully via auto submit');
          this.recordSubmissionOutcome(detail, 'submitted');
          return true;
        } else {
          logger.warn('[AutomationService] Form submission failed');
          this.recordSubmissionOutcome(detail, 'failed', 'submit-form-failed');
          return false;
        }
      } catch (submitError) {
        logger.error('[AutomationService] Error calling submitForm method:', submitError);
        this.recordSubmissionOutcome(detail, 'failed', 'submit-form-error');
        logger.error('[AutomationService] submitForm context info:', {
          hasSubmitForm: !!submitForm,
          submitFormType: typeof submitForm,
          activePluginName: activePlugin?.name,
        });
        return false;
      }
    } catch (error) {
      logger.error('[AutomationService] Error during auto submit:', error);
      return false;
    }
  }

  /**
   * Retry delivery for a failed/skipped operation using the RETAINED RESULT.
   * Never re-executes the tool: the server invocation count is unchanged.
   * Rejects when the destination no longer matches (Stage 1 rule).
   */
  public async retryDelivery(callId: string): Promise<{ success: boolean; reason?: string }> {
    return this.enqueuePageMutation(() => this.retryDeliveryNow(callId));
  }

  private async retryDeliveryNow(callId: string): Promise<{ success: boolean; reason?: string }> {
    const receipt = getDeliveryReceipt(callId);
    if (!receipt) {
      return { success: false, reason: 'no-receipt' };
    }
    if (receipt.submitted === true || receipt.submission?.stage === 'submitted') {
      return { success: false, reason: 'already-submitted' };
    }
    const reconcileAcknowledgementOnly = receipt.stage === 'acknowledged';
    const retrySubmissionOnly = receipt.stage === 'delivered' && receipt.submission?.stage === 'failed';
    if (receipt.stage === 'delivered' && !retrySubmissionOnly) {
      return { success: false, reason: 'already-delivered' };
    }
    if (!retrySubmissionOnly && !receipt.retainedResult) {
      return { success: false, reason: 'no-retained-result' };
    }
    if (!this.isDestinationCurrent(receipt.destinationUrl || undefined)) {
      return { success: false, reason: 'destination-changed' };
    }

    // Numeric budget (Stage 4): refusal IS the stop condition — no auto-retry loops.
    if ((receipt.attempts ?? 0) >= MAX_RETRY_ATTEMPTS) {
      logger.warn(
        `[AutomationService] Retry budget exhausted for callId=${callId} ` +
          `(${receipt.attempts}/${MAX_RETRY_ATTEMPTS}); refusing further retries`,
      );
      return { success: false, reason: 'retry-budget-exhausted' };
    }
    // Consume budget before acting so a crash mid-retry still counts.
    recordRetryAttempt(callId);

    logger.info(`[AutomationService] Retrying delivery for callId=${callId} from retained result`);

    const retryDetail: ToolExecutionCompleteDetail = {
      result: receipt.retainedResult,
      isFileAttachment: false,
      skipAutoInsertCheck: false,
      callId: receipt.callId,
      functionName: receipt.functionName,
    };

    if (reconcileAcknowledgementOnly) {
      if (receipt.resultTruncated) {
        return { success: false, reason: 'retained-result-truncated' };
      }
      const verified = await this.reconcileAcknowledgedDelivery(retryDetail, receipt.destinationUrl);
      if (!verified) {
        return { success: false, reason: 'page-state-unverified' };
      }

      const preferences = await storeRefs.getUserPreferences?.();
      if (preferences?.autoSubmit) {
        await this.handleAutoSubmit(retryDetail, receipt.destinationUrl);
      }
      return { success: true };
    }

    if (retrySubmissionOnly) {
      const submitSuccess = await this.handleAutoSubmit(retryDetail, receipt.destinationUrl);
      return submitSuccess ? { success: true } : { success: false, reason: 'submit-failed' };
    }

    // Retry is an explicit user action, not automation: bypass the auto-insert
    // preference recheck (the user asked for this delivery).
    const insertSuccess = await this.handleAutoInsert(retryDetail, receipt.destinationUrl, {
      ignoreAutoInsertPreference: true,
    });
    if (!insertSuccess) {
      return { success: false, reason: 'insert-failed' };
    }

    // A submitted receipt was rejected above. If auto-submit is currently enabled,
    // continue from the freshly recovered C5 state into C6.
    const preferences = await storeRefs.getUserPreferences?.();
    if (preferences?.autoSubmit) {
      await this.handleAutoSubmit(retryDetail, receipt.destinationUrl);
    }

    return { success: true };
  }

  /**
   * Check if automation service is initialized
   */
  public isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current automation state (public method for external access)
   */
  public async getCurrentAutomationState(): Promise<AutomationState | null> {
    return await this.getAutomationState();
  }

  /**
   * Force trigger automation for testing/debugging purposes
   */
  public async triggerTestAutomation(detail: ToolExecutionCompleteDetail): Promise<void> {
    logger.debug('[AutomationService] Triggering test automation');
    await this.handleToolExecutionComplete(new CustomEvent('mcp:tool-execution-complete', { detail }));
  }

  /**
   * Expose current automation state to window object for access by render_prescript
   */
  private async exposeAutomationStateToWindow(): Promise<void> {
    try {
      const automationState = await this.getAutomationState();
      if (automationState) {
        (window as Window & { __mcpAutomationState?: AutomationState }).__mcpAutomationState = automationState;
        logger.debug('[AutomationService] Exposed automation state to window:', automationState);
      }
    } catch (error) {
      logger.error('[AutomationService] Error exposing automation state to window:', error);
    }
  }

  /**
   * Update automation state on window object when preferences change
   */
  public async updateAutomationStateOnWindow(): Promise<void> {
    await this.exposeAutomationStateToWindow();
  }
}

// Export singleton instance
export const automationService = AutomationService.getInstance();

// Export initialization function for easy setup
export async function initializeAutomationService(): Promise<void> {
  await automationService.initialize();
}

// Export cleanup function
export function cleanupAutomationService(): void {
  automationService.cleanup();
}

// Default export for convenience
export default automationService;

// Development utilities
if (typeof window !== 'undefined' && IS_DEV) {
  // Expose automation service for debugging
  (window as Window & { __automationService?: unknown }).__automationService = {
    service: automationService,
    getState: async () => await automationService.getCurrentAutomationState(),
    testAutoInsert: async (text: string) => {
      return automationService.triggerTestAutomation({
        result: text,
        isFileAttachment: false,
        skipAutoInsertCheck: false,
      });
    },
    testAutoSubmit: async () => {
      return automationService.triggerTestAutomation({
        result: 'Test result for auto submit',
        isFileAttachment: false,
        skipAutoInsertCheck: true, // Force insert so submit can run
      });
    },
    testFileAttachment: async (fileName: string = 'test.txt', content: string = 'Test file content') => {
      const file = new File([content], fileName, { type: 'text/plain' });
      return automationService.triggerTestAutomation({
        isFileAttachment: true,
        file,
        fileName,
        confirmationText: `File ${fileName} attached successfully`,
        skipAutoInsertCheck: false,
      });
    },
    // Stage 2: delivery-recovery inspection and retry (dev builds)
    listDeliveryReceipts: () => listDeliveryReceipts(),
    getDeliveryReceipt: (callId: string) => getDeliveryReceipt(callId),
    retryDelivery: async (callId: string) => automationService.retryDelivery(callId),
    // Stage 3: unified operation observation (dev builds)
    observeOperations: () => observeOperations(),
    formatOperations: () => formatOperationObservations(),
  };

  logger.debug('[AutomationService] Debug utilities exposed on window.__automationService');
}
