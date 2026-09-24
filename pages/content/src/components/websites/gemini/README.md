# Gemini Site Components

This directory contains the Gemini-specific content components and input helpers. It is not the owner of the full adapter lifecycle or response-observation pipeline.

## Files

- `index.ts` — public exports for the Gemini component helpers.
- `chatInputHandler.ts` — current Gemini editor insertion, tool-result insertion, submission, and file-attachment helpers.

The site adapter and its configuration live in `pages/content/src/plugins/adapters/gemini.adapter.ts` and `pages/content/src/plugins/adapters/defaultConfigs/gemini.config.ts`. Those files own hostname-specific lifecycle behavior and selector/configuration details. Keep this README aligned with those source contracts; do not add observer or markdown-processing modules here unless they exist and are exported.

## Maintenance

When Gemini changes its editor or submit controls, inspect the handler, adapter, and configuration together. Verify the adapter contract on the target site and update the scoped qualification evidence only after an actual browser/artifact check.
