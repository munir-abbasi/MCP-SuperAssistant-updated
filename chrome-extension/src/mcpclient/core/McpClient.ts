import '../configureZodForExtension.js';

import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { LoggingMessageNotificationSchema } from '@modelcontextprotocol/sdk/types.js';

import { EventEmitter } from './EventEmitter.js';
import { PluginRegistry } from './PluginRegistry.js';
import { SSEPlugin } from '../plugins/sse/SSEPlugin.js';
import { WebSocketPlugin } from '../plugins/websocket/WebSocketPlugin.js';
import { StreamableHttpPlugin } from '../plugins/streamable-http/StreamableHttpPlugin.js';
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ClientConfig, ConnectionRequest } from '../types/config.js';
import { DEFAULT_CLIENT_CONFIG } from '../types/config.js';
import type { TransportType, ITransportPlugin } from '../types/plugin.js';
import type { NormalizedTool, PrimitivesResponse } from '../types/primitives.js';
import type { AllEvents } from '../types/events.js';
import { createLogger } from '@extension/shared/lib/logger';
import { analyticsService } from '../../../utils/analytics-service.js';
import { createBrowserMcpClient } from './createBrowserMcpClient.js';

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTING = 'DISCONNECTING',
}

const logger = createLogger('McpClient');

export class McpClient extends EventEmitter<AllEvents> {
  private registry: PluginRegistry;
  private config: ClientConfig;
  private client: Client | null = null;
  private activePlugin: ITransportPlugin | null = null;
  private activeTransport: Transport | null = null;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private connectionPromise: Promise<void> | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private primitivesCache: PrimitivesResponse | null = null;
  private primitivesCacheTime: number = 0;
  private readonly CACHE_TTL = 300000; // 5 minutes
  private activeCalls: Map<string, { reject: (reason?: any) => void; abortController: AbortController }> = new Map();

  constructor(config: Partial<ClientConfig> = {}) {
    super();

    this.config = {
      ...DEFAULT_CLIENT_CONFIG,
      ...config,
      global: {
        ...DEFAULT_CLIENT_CONFIG.global,
        ...config.global,
      },
      plugins: {
        ...DEFAULT_CLIENT_CONFIG.plugins,
        ...config.plugins,
      },
    };

    this.registry = new PluginRegistry();

    // Forward registry events
    this.registry.on('registry:plugin-registered', data => {
      this.emit('registry:plugin-registered', data);
    });

    this.registry.on('registry:plugins-loaded', data => {
      this.emit('registry:plugins-loaded', data);
    });

    logger.debug('[McpClient] Initialized with config:', this.config);
    this.emit('client:initialized', { config: this.config });
  }

  async initialize(): Promise<void> {
    try {
      logger.debug('[McpClient] Loading default plugins...');
      await this.registry.loadDefaultPlugins();
      logger.debug('[McpClient] Initialization complete');
    } catch (error) {
      logger.error('[McpClient] Initialization failed:', error);
      logger.debug('[McpClient] Attempting manual plugin registration as fallback...');

      try {
        // Try manual registration as fallback for Service Worker environments
        await this.manualPluginRegistration();
        logger.debug('[McpClient] Manual plugin registration successful');
      } catch (fallbackError) {
        logger.error('[McpClient] Manual plugin registration also failed:', fallbackError);
        throw error; // Throw original error
      }
    }
  }

  private async manualPluginRegistration(): Promise<void> {
    // Use static imports that are available at module level
    await this.registry.register(new SSEPlugin());
    await this.registry.register(new WebSocketPlugin());
    await this.registry.register(new StreamableHttpPlugin());

    logger.debug('[McpClient] Manual plugin registration completed');
  }

  async connect(request: ConnectionRequest): Promise<void> {
    // If same connection type and already connected, skip
    if (
      this.connectionState === ConnectionState.CONNECTED &&
      this.activePlugin?.metadata.transportType === request.type
    ) {
      logger.debug(`Already connected via ${request.type}, skipping`);
      return;
    }

    // If there's a connection in progress, wait for it
    if (this.connectionState === ConnectionState.CONNECTING && this.connectionPromise) {
      logger.debug('[McpClient] Connection already in progress, waiting...');
      try {
        await this.connectionPromise;
        if (
          this.connectionState === ConnectionState.CONNECTED &&
          this.activePlugin?.metadata.transportType === request.type
        ) {
          logger.debug('[McpClient] Existing connection matches request');
          return;
        }
      } catch {
        logger.debug('[McpClient] Previous connection failed, starting new one');
      }
    }

    // Disconnect from current connection if any
    if (this.connectionState !== ConnectionState.DISCONNECTED) {
      logger.debug(`Disconnecting before new connection to ${request.type}`);
      await this.disconnect();
    }

    this.connectionState = ConnectionState.CONNECTING;
    this.connectionPromise = this.performConnection(request);

    try {
      await this.connectionPromise;
    } finally {
      if (this.connectionState === ConnectionState.CONNECTING) {
        // If it failed and didn't transition to CONNECTED
        this.connectionState = ConnectionState.DISCONNECTED;
      }
      this.connectionPromise = null;
    }
  }

  private async performConnection(request: ConnectionRequest): Promise<void> {
    const { uri, type, config: pluginConfig } = request;

    try {
      logger.debug(`Connecting to ${uri} via ${type}`);
      this.emit('client:connecting', { uri, type });

      // Disconnect from current connection if exists
      if (this.connectionState !== ConnectionState.DISCONNECTED) {
        await this.disconnect();
      }

      // Get the plugin configuration
      const finalConfig = {
        ...this.config.plugins[type],
        ...pluginConfig,
      };

      // Get and initialize the plugin
      const plugin = await this.registry.getInitializedPlugin(type, finalConfig);

      if (!plugin.isSupported(uri)) {
        throw new Error(`Plugin ${type} does not support URI: ${uri}`);
      }

      // Get transport from plugin (plugin creates but doesn't connect)
      const transport = await plugin.connect(uri);

      // Set up disconnection callback for WebSocket plugin
      if (type === 'websocket' && 'setDisconnectionCallback' in plugin) {
        (plugin as any).setDisconnectionCallback((reason: string, code?: number, details?: string) => {
          logger.debug(`WebSocket disconnection detected: ${reason} (code: ${code})`);

          // Mark as disconnected immediately
          this.connectionState = ConnectionState.DISCONNECTED;

          // Emit disconnection event with details
          this.emit('connection:status-changed', {
            isConnected: false,
            type: 'websocket',
            error: `WebSocket disconnected: ${reason}${code ? ` (code: ${code})` : ''}${details ? ` - ${details}` : ''}`,
          });

          // Clean up connection state
          this.cleanup().catch(error => {
            logger.error('[McpClient] Error during cleanup after WebSocket disconnection:', error);
          });
        });
      }

      // Create MCP client
      this.client = createBrowserMcpClient(
        {
          name: `mcp-client-${type}`,
          version: '1.0.0',
        },
        { capabilities: {} },
      );

      // Set up logging notification handler
      this.client.setNotificationHandler(LoggingMessageNotificationSchema, notification => {
        logger.debug(`Server log:`, notification.params.data);
      });

      // Connect client to transport (this will start the transport)
      logger.debug(`Starting MCP client connection to transport...`);

      // Add timeout to prevent hanging
      const connectionTimeout = 30000; // 30 seconds
      const connectionPromise = this.client.connect(transport);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`MCP client connection timeout after ${connectionTimeout}ms`));
        }, connectionTimeout);
      });

      await Promise.race([connectionPromise, timeoutPromise]);
      logger.debug(`MCP client connected successfully`);

      // Store connection state
      this.activePlugin = plugin;
      this.activeTransport = transport;
      this.connectionState = ConnectionState.CONNECTED;

      // Clear cache on new connection
      this.clearPrimitivesCache();

      // Reject all active calls
      for (const [, call] of this.activeCalls.entries()) {
        call.reject(new Error('Connection dropped or disconnected'));
      }
      this.activeCalls.clear();

      // Start health monitoring
      this.startHealthMonitoring();

      logger.debug(`Successfully connected via ${type}`);
      this.emit('client:connected', { uri, type });
      this.emit('connection:status-changed', {
        isConnected: true,
        type,
        error: undefined,
      });

      // Track successful connection
      analyticsService
        .trackConnectionChange({
          connection_status: 'connected',
          transport_type: type,
          tools_discovered: 0, // Will be updated after getPrimitives
        })
        .catch((error: unknown) => {
          logger.warn('[McpClient] Analytics tracking failed:', error);
        });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Connection failed:`, error);

      // Clean up partial connection state
      await this.cleanup();

      this.emit('client:error', {
        error: error instanceof Error ? error : new Error(errorMessage),
        context: 'connection',
      });
      this.emit('connection:status-changed', {
        isConnected: false,
        type,
        error: errorMessage,
      });

      // Track connection failure
      analyticsService
        .trackConnectionChange({
          connection_status: 'error',
          transport_type: type,
          error_type: error instanceof Error ? error.name : 'UnknownError',
        })
        .catch((analyticsError: unknown) => {
          logger.warn('[McpClient] Analytics tracking failed:', analyticsError);
        });

      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (
      this.connectionState === ConnectionState.DISCONNECTED ||
      this.connectionState === ConnectionState.DISCONNECTING
    ) {
      logger.debug('[McpClient] Already disconnected or disconnecting');
      return;
    }

    this.connectionState = ConnectionState.DISCONNECTING;

    const currentType = this.activePlugin?.metadata.transportType;
    logger.debug(`Disconnecting from ${currentType || 'unknown'}`);

    if (currentType) {
      this.emit('client:disconnecting', { type: currentType });
    }

    try {
      await this.cleanup();
      logger.debug('[McpClient] Disconnected successfully');

      if (currentType) {
        this.emit('client:disconnected', { type: currentType });
      }
      this.emit('connection:status-changed', {
        isConnected: false,
        type: currentType || null,
      });
    } catch (error) {
      logger.error('[McpClient] Error during disconnect:', error);
      this.emit('client:error', {
        error: error instanceof Error ? error : new Error(String(error)),
        context: 'disconnect',
      });
    }
  }

  private async cleanup(): Promise<void> {
    // Stop health monitoring
    this.stopHealthMonitoring();

    // Close client connection
    if (this.client) {
      try {
        await this.client.close();
      } catch (error) {
        logger.warn('[McpClient] Error closing client:', error);
      }
      this.client = null;
    }

    // Disconnect plugin
    if (this.activePlugin) {
      try {
        await this.activePlugin.disconnect();
      } catch (error) {
        logger.warn('[McpClient] Error disconnecting plugin:', error);
      }
      this.activePlugin = null;
    }

    this.activeTransport = null;
    this.connectionState = ConnectionState.DISCONNECTED;
    this.clearPrimitivesCache();

    // Reject all active calls
    for (const [, call] of this.activeCalls.entries()) {
      call.reject(new Error('Connection dropped or disconnected'));
    }
    this.activeCalls.clear();
  }

  async callTool(
    toolName: string,
    args: Record<string, any>,
    adapterName?: string,
    signal?: AbortSignal,
  ): Promise<any> {
    if (this.connectionState !== ConnectionState.CONNECTED || !this.activePlugin || !this.client) {
      throw new Error('Not connected to any MCP server');
    }

    const callId = crypto.randomUUID();
    const abortController = new AbortController();

    if (signal) {
      signal.addEventListener('abort', () => abortController.abort(signal.reason));
    }

    return new Promise((resolve, reject) => {
      this.activeCalls.set(callId, { reject, abortController });

      abortController.signal.addEventListener('abort', () => {
        if (this.activeCalls.has(callId)) {
          this.activeCalls.delete(callId);
          reject(abortController.signal.reason || new Error('Tool call aborted'));
        }
      });

      this.executeToolCall(callId, toolName, args, adapterName).then(resolve).catch(reject);
    });
  }

  private async executeToolCall(
    callId: string,
    toolName: string,
    args: Record<string, any>,
    adapterName?: string,
  ): Promise<any> {
    if (this.connectionState !== ConnectionState.CONNECTED || !this.activePlugin || !this.client) {
      throw new Error('Not connected to any MCP server');
    }

    const startTime = Date.now();
    this.emit('tool:call-started', { toolName, args });

    try {
      logger.debug(`Calling tool: ${toolName}`);
      const result = await this.activePlugin.callTool(this.client, toolName, args);

      const duration = Date.now() - startTime;
      this.emit('tool:call-completed', { toolName, result, duration });

      // Track tool execution analytics with enhanced context
      analyticsService
        .trackToolExecution({
          tool_name: toolName,
          execution_status: 'success',
          execution_duration_ms: duration,
          transport_type: this.activePlugin?.metadata.transportType || 'unknown',
          adapter_name: adapterName, // Pass adapter name from content script
        })
        .catch((error: unknown) => {
          // Don't fail tool execution if analytics fails
          logger.warn('[McpClient] Analytics tracking failed:', error);
        });

      this.activeCalls.delete(callId);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const toolError = error instanceof Error ? error : new Error(String(error));

      this.emit('tool:call-failed', { toolName, error: toolError, duration });

      // Track failed tool execution analytics with enhanced context
      analyticsService
        .trackToolExecution({
          tool_name: toolName,
          execution_status: 'error',
          execution_duration_ms: duration,
          transport_type: this.activePlugin?.metadata.transportType || 'unknown',
          error_type: toolError.name || 'UnknownError',
          adapter_name: adapterName, // Pass adapter name from content script
        })
        .catch((analyticsError: unknown) => {
          // Don't fail tool execution if analytics fails
          logger.warn('[McpClient] Analytics tracking failed:', analyticsError);
        });

      // Check if connection is still healthy after error
      if (!(await this.isHealthy())) {
        this.connectionState = ConnectionState.DISCONNECTED;
        this.emit('connection:status-changed', {
          isConnected: false,
          type: this.activePlugin?.metadata.transportType || null,
          error: 'Connection lost during tool call',
        });
      }

      throw toolError;
    }
  }

  async getPrimitives(forceRefresh: boolean = false): Promise<PrimitivesResponse> {
    if (this.connectionState !== ConnectionState.CONNECTED || !this.activePlugin || !this.client) {
      throw new Error('Not connected to any MCP server');
    }

    // Check cache first
    if (!forceRefresh && this.primitivesCache && this.isCacheValid()) {
      logger.debug('[McpClient] Returning cached primitives');
      return this.primitivesCache;
    }

    try {
      logger.debug('[McpClient] Fetching primitives from server...');
      const primitives = await this.activePlugin.getPrimitives(this.client);

      // Normalize tools
      const tools = this.normalizeTools(primitives.filter(p => p.type === 'tool') as any[]);
      const resources = primitives.filter(p => p.type === 'resource').map(p => p.value as any);
      const prompts = primitives.filter(p => p.type === 'prompt').map(p => p.value as any);
      const errors = primitives.filter(p => p.type === 'error').map(p => p.value as any);

      const response: PrimitivesResponse = {
        tools,
        resources,
        prompts,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: Date.now(),
      };

      if (errors.length > 0) {
        const toolsError = errors.find(e => e.capability === 'tools');
        if (toolsError) {
          logger.error(`[McpClient] Tool discovery failed: ${toolsError.message}`);
          this.connectionState = ConnectionState.DISCONNECTED;
          this.emit('connection:status-changed', {
            isConnected: false,
            type: this.activePlugin.metadata.transportType,
            error: `Tool discovery failed: ${toolsError.message}`,
          });
          // Use 'connection failed' to ensure background script categorizes this as a connection error
          throw new Error(`Connection failed: Tool discovery failed - ${toolsError.message}`);
        }
      }

      // Cache the response
      this.primitivesCache = response;
      this.primitivesCacheTime = Date.now();

      // Emit tools update event
      this.emit('tools:list-updated', {
        tools,
        type: this.activePlugin.metadata.transportType,
      });

      // Update connection tracking with tools count (only if this is the first time discovering tools)
      // This prevents duplicate connection events when tools are refreshed
      if (this.primitivesCache === null || this.primitivesCache.tools.length === 0) {
        analyticsService
          .trackConnectionChange({
            connection_status: 'connected',
            transport_type: this.activePlugin.metadata.transportType,
            tools_discovered: tools.length,
          })
          .catch((error: unknown) => {
            logger.warn('[McpClient] Analytics tracking failed:', error);
          });
      }

      logger.debug(`Retrieved ${tools.length} tools, ${resources.length} resources, ${prompts.length} prompts`);
      return response;
    } catch (error) {
      logger.error('[McpClient] Failed to get primitives:', error);

      // Check if connection is still healthy after error
      if (!(await this.isHealthy())) {
        this.connectionState = ConnectionState.DISCONNECTED;
        this.emit('connection:status-changed', {
          isConnected: false,
          type: this.activePlugin?.metadata.transportType || null,
          error: 'Connection lost while getting primitives',
        });
      }

      throw error;
    }
  }

  private normalizeTools(toolPrimitives: any[]): NormalizedTool[] {
    return toolPrimitives.map(p => {
      const tool = p.value;
      return {
        name: tool.name,
        description: tool.description || '',
        input_schema: tool.inputSchema || tool.input_schema || {},
        schema: tool.inputSchema
          ? JSON.stringify(tool.inputSchema)
          : tool.input_schema
            ? JSON.stringify(tool.input_schema)
            : '{}',
        ...(tool.uri && { uri: tool.uri }),
        ...(tool.arguments && { arguments: tool.arguments }),
      };
    });
  }

  private clearPrimitivesCache(): void {
    this.primitivesCache = null;
    this.primitivesCacheTime = 0;
  }

  private isCacheValid(): boolean {
    return Date.now() - this.primitivesCacheTime < this.CACHE_TTL;
  }

  async isHealthy(): Promise<boolean> {
    if (this.connectionState !== ConnectionState.CONNECTED || !this.activePlugin) {
      return false;
    }

    try {
      return await this.activePlugin.isHealthy();
    } catch (error) {
      logger.warn('[McpClient] Health check failed:', error);
      return false;
    }
  }

  isConnected(): boolean {
    return this.connectionState === ConnectionState.CONNECTED && this.activePlugin?.isConnected() === true;
  }

  getConnectionInfo(): {
    isConnected: boolean;
    type: TransportType | null;
    uri: string | null;
    pluginInfo: any;
  } {
    return {
      isConnected: this.connectionState === ConnectionState.CONNECTED,
      type: this.activePlugin?.metadata.transportType || null,
      uri: null, // Could store this if needed
      pluginInfo: this.activePlugin?.metadata || null,
    };
  }

  getAvailableTransports(): TransportType[] {
    return this.registry.listAvailable();
  }

  async switchTransport(request: ConnectionRequest): Promise<void> {
    const currentType = this.activePlugin?.metadata.transportType || null;

    if (currentType === request.type) {
      logger.debug(`Already using ${request.type}, reconnecting...`);
    } else {
      logger.debug(`Switching from ${currentType} to ${request.type}`);
      this.emit('client:plugin-switched', { from: currentType, to: request.type });
    }

    await this.connect(request);
  }

  private startHealthMonitoring(): void {
    const interval = this.config.global.healthCheckInterval;
    if (interval <= 0) return;

    this.healthCheckTimer = setInterval(async () => {
      if (this.connectionState !== ConnectionState.CONNECTED) {
        this.stopHealthMonitoring();
        return;
      }

      try {
        const healthy = await this.isHealthy();
        const type = this.activePlugin?.metadata.transportType || null;

        if (type) {
          this.emit('connection:health-check', {
            healthy,
            type,
            timestamp: Date.now(),
          });
        }

        if (!healthy) {
          logger.warn(`Health check failed for ${type}`);
          this.connectionState = ConnectionState.DISCONNECTED;
          this.emit('connection:status-changed', {
            isConnected: false,
            type,
            error: 'Health check failed',
          });
        }
      } catch (error) {
        logger.error('[McpClient] Health check error:', error);
      }
    }, interval);
  }

  private stopHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  getConfig(): ClientConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<ClientConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      global: {
        ...this.config.global,
        ...newConfig.global,
      },
      plugins: {
        ...this.config.plugins,
        ...newConfig.plugins,
      },
    };

    logger.debug('[McpClient] Configuration updated');
  }
}
