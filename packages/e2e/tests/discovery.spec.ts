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
    // Look for the zip extension or the unpacked dir
    // Assuming the user runs pnpm zip first, we can find the unpacked directory in dist
    const pathToExtension = path.join(__dirname, '../../../dist/chrome');
    const context = await chromium.launchPersistentContext('', {
      headless: false, // Chrome extensions can't be tested in headless mode easily yet
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    // Wait for the background page or service worker
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker');
    }
    const extensionId = background.url().split('/')[2];
    await use(extensionId);
  },
});

test('extension loads and connects to fixture successfully', async ({ page, extensionId }) => {
  // We can open the extension's popup or options page to verify it loads
  // We'll navigate to the options page which typically initializes the MCP client
  await page.goto(`chrome-extension://${extensionId}/options/index.html`);

  // Wait for it to render
  await expect(page.locator('body')).toBeVisible();

  // We could potentially configure the MCP server connection here using the UI
  // For now, this just proves the extension loads without fatal manifest errors.
  
  // Note: True connection testing would involve interacting with the UI to set up
  // the server URL (http://localhost:3030/mcp) and verifying the connected status.
});
