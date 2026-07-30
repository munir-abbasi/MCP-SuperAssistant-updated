# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: discovery.spec.ts >> extension loads and connects to fixture successfully
- Location: tests/discovery.spec.ts:37:1

# Error details

```
Error: browserType.launchPersistentContext: Executable doesn't exist at /home/meer/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome
╔════════════════════════════════════════════════════════════╗
║ Looks like Playwright was just installed or updated.       ║
║ Please run the following command to download new browsers: ║
║                                                            ║
║     pnpm exec playwright install                           ║
║                                                            ║
║ <3 Playwright Team                                         ║
╚════════════════════════════════════════════════════════════╝
```

# Test source

```ts
  1  | import { test as base, expect, chromium, type BrowserContext } from '@playwright/test';
  2  | import path from 'path';
  3  | import { fileURLToPath } from 'url';
  4  | 
  5  | const __filename = fileURLToPath(import.meta.url);
  6  | const __dirname = path.dirname(__filename);
  7  | 
  8  | export const test = base.extend<{
  9  |   context: BrowserContext;
  10 |   extensionId: string;
  11 | }>({
  12 |   context: async ({ }, use) => {
  13 |     // Look for the zip extension or the unpacked dir
  14 |     // Assuming the user runs pnpm zip first, we can find the unpacked directory in dist
  15 |     const pathToExtension = path.join(__dirname, '../../../dist/chrome');
> 16 |     const context = await chromium.launchPersistentContext('', {
     |                     ^ Error: browserType.launchPersistentContext: Executable doesn't exist at /home/meer/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome
  17 |       headless: false, // Chrome extensions can't be tested in headless mode easily yet
  18 |       args: [
  19 |         `--disable-extensions-except=${pathToExtension}`,
  20 |         `--load-extension=${pathToExtension}`,
  21 |       ],
  22 |     });
  23 |     await use(context);
  24 |     await context.close();
  25 |   },
  26 |   extensionId: async ({ context }, use) => {
  27 |     // Wait for the background page or service worker
  28 |     let [background] = context.serviceWorkers();
  29 |     if (!background) {
  30 |       background = await context.waitForEvent('serviceworker');
  31 |     }
  32 |     const extensionId = background.url().split('/')[2];
  33 |     await use(extensionId);
  34 |   },
  35 | });
  36 | 
  37 | test('extension loads and connects to fixture successfully', async ({ page, extensionId }) => {
  38 |   // We can open the extension's popup or options page to verify it loads
  39 |   // We'll navigate to the options page which typically initializes the MCP client
  40 |   await page.goto(`chrome-extension://${extensionId}/options/index.html`);
  41 | 
  42 |   // Wait for it to render
  43 |   await expect(page.locator('body')).toBeVisible();
  44 | 
  45 |   // We could potentially configure the MCP server connection here using the UI
  46 |   // For now, this just proves the extension loads without fatal manifest errors.
  47 |   
  48 |   // Note: True connection testing would involve interacting with the UI to set up
  49 |   // the server URL (http://localhost:3030/mcp) and verifying the connected status.
  50 | });
  51 | 
```