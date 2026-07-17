/**
 * CDP Helper — interact with Chrome extension background service worker
 * or background page via Chrome DevTools Protocol.
 *
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  LIMITATION: MV3 extension service workers cannot be reliably found     ║
 * ║  via CDP's Target.getTargets because they are event-driven — they only  ║
 * ║  start when triggered (content-script message, action click, etc.) and  ║
 * ║  are NOT running at browser launch. Playwright has no API to force-     ║
 * ║  start them. This helper is retained as infrastructure for future       ║
 * ║  use if a purpose-built extension test harness is adopted, but is not   ║
 * ║  currently called by any active test.                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Usage:
 *   import { findExtensionTarget, callInExtension, findExtensionId } from './cdp-helper.mjs';
 *   const browserCDP = await browser.newBrowserCDPSession();
 *   const target = await findExtensionTarget(browserCDP);
 *   const result = await callInExtension(browserCDP, target, () => {
 *     return chrome.runtime.getManifest();
 *   });
 *
 *   // Or just get the extension ID:
 *   const extId = await findExtensionId(browserCDP);
 */

/**
 * Find the extension background target (service worker for MV3,
 * background_page for MV2) via CDP.
 * Polls up to `timeout` ms waiting for the target to appear.
 *
 * NOTE: For MV3 extensions, Target.getTargets will NEVER find an extension
 * service worker that hasn't been woken by an extension event. This is a
 * Chrome platform limitation, not a CDP issue.
 */
export async function findExtensionTarget(browserCDP, { timeout = 10000 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const { targetInfos } = await browserCDP.send('Target.getTargets');
    // MV3: service_worker target type
    const sw = targetInfos.find(
      (t) =>
        t.type === 'service_worker' &&
        (t.url?.includes('background') || t.title?.includes('background')),
    );
    if (sw) return sw;
    // MV2: background_page target type
    const bg = targetInfos.find((t) => t.type === 'background_page');
    if (bg) return bg;
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Extension background target not found within ${timeout}ms`);
}

/**
 * Extract the extension ID from the background target URL.
 */
export async function findExtensionId(browserCDP, { timeout = 10000 } = {}) {
  const target = await findExtensionTarget(browserCDP, { timeout });
  const match = target.url?.match(/chrome-extension:\/\/([^/]+)\//);
  if (match) return match[1];
  // Fallback: try the openerUrl or title
  const match2 = target.title?.match(/chrome-extension:\/\/([^/]+)\//);
  if (match2) return match2[1];
  throw new Error(`Could not parse extension ID from target: ${JSON.stringify(target)}`);
}

let _callIdCounter = 1;

/**
 * Execute an async function inside the extension background context.
 *
 * @param {import('playwright').CDPSession} browserCDP - Browser-level CDP session
 * @param {{ targetId: string }} target - Extension SW or background target from findExtensionTarget()
 * @param {Function} fn - Async function to execute in SW context
 * @param {...any} args - Arguments to pass to the function
 * @returns {Promise<any>} The return value of fn
 */
export async function callInExtension(browserCDP, target, fn, ...args) {
  const { sessionId } = await browserCDP.send('Target.attachToTarget', {
    targetId: target.targetId,
    flatten: false,
  });

  const callId = _callIdCounter++;

  const serialisedArgs = args.map((a) => JSON.stringify(a)).join(', ');

  const message = JSON.stringify({
    id: callId,
    method: 'Runtime.evaluate',
    params: {
      expression: `(${fn.toString()})(${serialisedArgs})`,
      returnByValue: true,
      awaitPromise: true,
    },
  });

  await browserCDP.send('Target.sendMessageToTarget', {
    sessionId,
    message,
  });

  return new Promise((resolve, reject) => {
    const timeoutHandle = setTimeout(() => {
      browserCDP.off('Target.receivedMessageFromTarget', handler);
      reject(new Error(`callInExtension timed out after 15000ms (callId=${callId})`));
    }, 15000);

    const handler = (event) => {
      if (event.sessionId !== sessionId) return;
      try {
        const msg = JSON.parse(event.message);
        if (msg.id !== callId) return;
        clearTimeout(timeoutHandle);
        browserCDP.off('Target.receivedMessageFromTarget', handler);

        if (msg.result?.exceptionDetails) {
          const desc =
            msg.result.exceptionDetails.exception?.description ||
            msg.result.exceptionDetails.text ||
            'Unknown CDP error';
          reject(new Error(desc));
        } else {
          resolve(msg.result?.result?.value);
        }
      } catch (e) {
        clearTimeout(timeoutHandle);
        browserCDP.off('Target.receivedMessageFromTarget', handler);
        reject(e);
      }
    };

    browserCDP.on('Target.receivedMessageFromTarget', handler);
  });
}
