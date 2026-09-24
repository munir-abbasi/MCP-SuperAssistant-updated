export interface GlobalSettings {
  theme: 'light' | 'dark' | 'system';
  autoSubmit: boolean;
  debugMode: boolean;
  sidebarWidth: number;
  isPushMode: boolean;
  language: string;
  notifications: boolean;
}

export type ConnectionType = 'sse' | 'websocket' | 'streamable-http';

export interface ServerConfig {
  uri: string;
  connectionType: ConnectionType;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error' | 'reconnecting';

export interface Tool {
  name: string;
  description: string;
  // Legacy field used in some UI components
  schema?: string | Record<string, unknown>;
  // Newer field preferred going forward
  input_schema: Record<string, unknown>;
}

export interface DetectedTool {
  name: string;
  parameters: Record<string, unknown>;
  source: string;
  confidence: number;
}

export interface ToolExecution {
  id: string;
  toolName: string;
  parameters: Record<string, unknown>;
  result: unknown;
  timestamp: number;
  status: 'pending' | 'success' | 'error';
  error?: string;
  /** Operation identity from the renderer (tool-call card). Correlates execution with delivery. */
  callId?: string;
  /** Evidence about whether the request may have crossed the content→background dispatch boundary. */
  executionEvidence?: {
    dispatchState: 'not-dispatched' | 'possibly-dispatched' | 'response-received' | 'unknown';
    attemptCount: number;
    /** Distinguishes this concrete dispatch from other executions sharing the same logical callId. */
    attemptId?: string;
  };
  /**
   * Delivery outcome (Stage 2). Execution `status` stays execution-scoped; this
   * records what happened to the result afterwards so execution-success plus
   * delivery-failure remains a distinguishable outcome. Vocabulary matches the
   * delivery receipts in `services/delivery-recovery.ts`.
   */
  delivery?: {
    stage: 'acknowledged' | 'delivered' | 'failed' | 'skipped';
    at: number;
    destinationUrl: string;
    error?: string;
  };
}

export interface SidebarState {
  isVisible: boolean;
  isMinimized: boolean;
  position: 'left' | 'right';
  width: number;
}

export interface UserPreferences {
  autoSubmit: boolean;
  autoInsert: boolean; // New automation field
  autoExecute: boolean; // New automation field
  autoInsertDelay: number; // Delay in seconds for auto insert
  autoSubmitDelay: number; // Delay in seconds for auto submit
  autoExecuteDelay: number; // Delay in seconds for auto execute
  notifications: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  isPushMode: boolean;
  sidebarWidth: number;
  isMinimized: boolean;
  customInstructions: string;
  customInstructionsEnabled: boolean;
  mcpTimeout?: number; // Timeout for MCP tool calls in milliseconds
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  duration?: number; // Optional duration in milliseconds
}
