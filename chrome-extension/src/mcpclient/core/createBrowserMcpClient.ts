import '../configureZodForExtension.js';

import { Client, type ClientOptions } from '@modelcontextprotocol/sdk/client/index.js';
import { BrowserJsonSchemaValidator } from './BrowserJsonSchemaValidator.js';

export const createBrowserMcpClient = (
  clientInfo: { name: string; version: string },
  options: ClientOptions = {},
): Client =>
  new Client(clientInfo, {
    ...options,
    jsonSchemaValidator: new BrowserJsonSchemaValidator(),
  });

export { BrowserJsonSchemaValidator, schemaDraftFromUri } from './BrowserJsonSchemaValidator.js';
