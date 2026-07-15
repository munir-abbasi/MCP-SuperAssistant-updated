import '../configureZodForExtension.js';

// The SDK imports its Node-oriented AJV provider even when callers pass a
// custom validator. Redirect that provider in extension bundles so prohibited
// runtime code-generation code is not shipped in the packaged service worker.
export { BrowserJsonSchemaValidator as AjvJsonSchemaValidator } from './BrowserJsonSchemaValidator.js';
