import { test as base, expect, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({ }, use) => {
    const pathToExtension = path.join(__dirname, '../../../dist');
    const context = await chromium.launchPersistentContext('', {
      headless: true,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    // Wait for the background service worker
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker');
    }
    const extensionId = background.url().split('/')[2];
    await use(extensionId);
  },
});

test('extension loads and service worker is active', async ({ extensionId }) => {
  // Verify the extension loaded and has a valid extensionId
  expect(extensionId).toMatch(/^[a-z]{32}$/);

  // Verify the manifest is accessible (extension loads without fatal errors)
  const manifestUrl = `chrome-extension://${extensionId}/manifest.json`;
  const response = await fetch(manifestUrl);
  expect(response.ok).toBeTruthy();

  const manifest = await response.json();
  expect(manifest.name).toBe('MCP SuperAssistant');
  expect(manifest.manifest_version).toBe(3);
});
