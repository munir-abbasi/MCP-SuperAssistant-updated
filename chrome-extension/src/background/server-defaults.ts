import type { TransportType } from '../mcpclient/types/plugin';

export type ConnectionType = TransportType;

export const DEFAULT_SSE_URL = 'http://localhost:3006/sse';
export const DEFAULT_WEBSOCKET_URL = 'ws://localhost:3006/message';
export const DEFAULT_STREAMABLE_HTTP_URL = 'http://localhost:3006';
export const DEFAULT_CONNECTION_TYPE: ConnectionType = 'sse';

export function getDefaultServerUrlForConnectionType(type: ConnectionType | undefined): string {
  switch (type) {
    case 'websocket':
      return DEFAULT_WEBSOCKET_URL;
    case 'streamable-http':
      return DEFAULT_STREAMABLE_HTTP_URL;
    case 'sse':
    default:
      return DEFAULT_SSE_URL;
  }
}
