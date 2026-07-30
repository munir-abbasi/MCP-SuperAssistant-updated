<div align="center">
   <h1>MCP SuperAssistant Chrome Extension</h1>
</div>

<p align="center">
Brings MCP to ChatGPT, Perplexity, Grok, Gemini, Google AI Studio, OpenRouter, Kimi, GitHub Copilot, Mistral, and more...
</p>

<p align="center">
   <a href="https://mcpsuperassistant.ai/" target="_blank"><strong>🌐 Visit Official Website</strong></a>
</p>

<!-- ![MCP SuperAssistant](chrome-extension/public/Cover3.jpg) -->
<div align="center">
 <img src="chrome-extension/public/Cover5.jpg" alt="MCP SuperAssistant Cover" width="800">
</div>

<div align="center">
    
   ![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)
   ![Build Status](https://img.shields.io/badge/Status-Active-success?style=flat-square)

</div>

## Installation

> **Note:** This extension has not been published to the Chrome Web Store or Firefox Add-ons yet. Use the manual installation instructions below.

<br>

## Overview

MCP SuperAssistant is a Chrome extension that integrates the Model Context Protocol (MCP) tools with AI platforms like Perplexity, ChatGPT, Google Gemini, Google AI Studio, Grok, and more. It allows users to execute MCP tools directly from these platforms, enhancing the capabilities of web-based AI assistants.

## Currently Supported Platforms

- [ChatGPT](https://chatgpt.com/)
- [Google Gemini](https://gemini.google.com/)
- [Perplexity](https://perplexity.ai/)
- [Grok](https://grok.com/)
- [Google AI Studio](https://aistudio.google.com/)
- [OpenRouter Chat](https://openrouter.ai/chat)
- [DeepSeek](https://chat.deepseek.com/)
- [T3 Chat](https://t3.chat/)
- [GitHub Copilot](https://github.com/copilot)
- [Kagi](https://kagi.com/)
- [Mistral AI](https://chat.mistral.ai/)
- [Kimi](https://kimi.com/)
- [Qwen Chat](https://chat.qwen.ai/)
- [Z Chat](https://chat.z.ai/)


## Demo Video

Kimi.com

[![MCP SuperAssistant Demo](https://img.youtube.com/vi/jnBPh2jzunM/0.jpg)](https://www.youtube.com/watch?v=jnBPh2jzunM)

ChatGPT

[![MCP SuperAssistant Demo](https://img.youtube.com/vi/PY0SKjtmy4E/0.jpg)](https://www.youtube.com/watch?v=PY0SKjtmy4E)

Watch the demo to see MCP SuperAssistant in action!

[MCP SuperAssistant Demo Playlist](https://www.youtube.com/playlist?list=PLOK1DBnkeaJFzxC4M-z7TU7_j04SShX_w)

## Setup Tutorial

[![Setup Tutorial](https://img.youtube.com/vi/h9f_GX1Ef20/0.jpg)](https://www.youtube.com/watch?v=h9f_GX1Ef20&pp=ygUTbWNwIHN1cGVyIGFzc2lzdGFudA%3D%3D)

**New to MCP SuperAssistant?** Watch this complete setup guide to get started in minutes!

[View Setup Tutorial](https://www.youtube.com/watch?v=h9f_GX1Ef20&pp=ygUTbWNwIHN1cGVyIGFzc2lzdGFudA%3D%3D)

## What is MCP?

The Model Context Protocol (MCP) is an open standard developed by Anthropic that connects AI assistants to systems where data actually lives, including content repositories, business tools, and development environments. It serves as a universal protocol that enables AI systems to securely and dynamically interact with data sources in real time.

## Key Features

- **Multiple AI Platform Support**: Works with ChatGPT, Perplexity, Google Gemini, Grok, Google AI Studio, OpenRouter Chat, DeepSeek, Kagi, T3 Chat, GitHub Copilot, Mistral AI, Kimi, Qwen Chat, Z Chat, and more
- **Tool Detection**: Automatically detects MCP tool calls in AI responses
- **Tool Execution**: Execute MCP tools with a single click
- **Tool Result Integration**: Seamlessly insert tool execution results back into the AI conversation
- **Render Mode**: Renders function calls and function results
- **Auto-Execute Mode**: Automatically execute detected tools
- **Auto-Submit Mode**: Automatically submit chat input after result insertion
- **Push Content Mode**: Option to push page content instead of overlaying
- **Preferences Persistence**: Remembers sidebar position, size, and settings
- **Dark/Light Mode Support**: Adapts to the AI platform's theme

```mermaid
flowchart TD
    A[AI Chat Interface] -->|Generate| B[Tool Calls]
    B -->|Detect| C[Extension Detects Tool Calls]
    C -->|Send via SSE| D[MCP Local Proxy Server]
    D -->|Forward| E[Actual MCP Server]
    E -->|Return Results| D
    D -->|Return Results| C
    C -->|Insert| F[Add Results Back to Chat]
```

### Connecting to Local Proxy Server

To connect the Chrome extension to a local server for proxying connections. The proxy is a standalone npm package published by the original author — it is not bundled with the extension and works with any fork. You do not need to publish your own proxy.

#### Run MCP SuperAssistant Proxy via npx:

1. Create a `config.json` file with your MCP server details. For example, to use the [Desktop Commander](https://github.com/wonderwhy-er/DesktopCommanderMCP):


   **Example config.json:**
   ```json
   {
     "mcpServers": {
       "desktop-commander": {
         "command": "npx",
         "args": [
           "-y",
           "@wonderwhy-er/desktop-commander"
         ]
       }
     }
   }
   ```
   config.json also supports other MCP server configurations like remote MCP server URLs.
   Try Composio MCP, Zapier MCP, Smithery, or any other remote MCP server.

   **Or use existing config file location from Cursor or other tools:**
   ```
   macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
   Windows: %APPDATA%\Claude\claude_desktop_config.json
   ```

2. Start the MCP SuperAssistant Proxy server using one of the following commands:

   ```bash
   npx -y @srbhptl39/mcp-superassistant-proxy@latest --config ./config.json --outputTransport sse
   ```
   or 
   ```bash
   npx -y @srbhptl39/mcp-superassistant-proxy --config ./config.json --outputTransport streamableHttp
   ```
   or
   ```bash
   npx -y @srbhptl39/mcp-superassistant-proxy --config ./config.json --outputTransport ws
   ```

   **View all available options:**
   ```bash
   npx -y @srbhptl39/mcp-superassistant-proxy@latest --help
   ```
   
   This is useful for:
   - Proxying remote MCP servers
   - Adding CORS support to remote servers
   - Providing health endpoints for monitoring

#### Connection Steps:

1. Start the proxy server using one of the commands above
2. Open the MCP SuperAssistant sidebar in one of the supported AI platforms — the sidebar UI should appear
3. Click on the server status indicator (usually showing as "Disconnected")
4. Enter the local server URL (default: `http://localhost:3006/sse`)
   URL format depends on the --outputTransport method used:
   - For SSE: `http://localhost:3006/sse`
   - For Streamable HTTP: `http://localhost:3006/mcp`
   - For WebSocket: `ws://localhost:3006/message`
   - Choose the appropriate transport method (SSE or Streamable HTTP or WebSocket) 
   - You can add any remote MCP server URL here as well, if it supports CORS or is proxied via this local proxy server. Try [Composio MCP](https://mcp.composio.dev/), [Zapier MCP](https://zapier.com/mcp), or [Smithery](https://smithery.ai/), or any other remote MCP server.
5. Click "Connect" to establish the connection
6. The status indicator should change to "Connected" if successful

## Usage
Example Workflow:
1. Navigate to a supported AI platform, e.g., ChatGPT.
2. The MCP SuperAssistant sidebar will appear on the right side of the page
3. Configure your MCP Tools to enable and disable the tools you want to use.
4. In the message prompt area, hover the 'MCP' button to see the available tools and their descriptions.
5. Add an MCP working instructions prompt to the chat to inform the AI about its new capabilities and how to use the tools. Use the 'Insert' or attach button to add the instructions.
6. Once the instructions are added, you can ask the AI to read files or perform any related MCP tool operations.
7. When AI wants to use any tool it will show a custom tool call card with the tool name and parameters.
8. User can manually execute the tool call by clicking on the "RUN" button on the tool call card, or if Auto-Execute mode is enabled, it will execute automatically.
9. Automation can be achieved by enabling Auto-Execute and Auto-Submit modes, by clicking on the 'MCP' button and configuring the Auto modes.


## Tips & Tricks

1. **Turn off search mode** (ChatGPT, Perplexity) in AI chat interfaces for a better tool call experience and to prevent MCP SuperAssistant from being derailed.
2. **Turn on Reasoning mode** (ChatGPT, Perplexity, Grok) in AI chat interfaces — this helps the AI understand context better and generate correct tool calls.
3. Use newer high-end models as they are better at understanding the context and generating the correct tool calls.
4. Copy the MCP instructions prompt and paste it in the AI chat system prompt (Google AI Studio).
5. Mention the specific tools you want to use in your conversation.
6. Use the MCP Auto toggles to control the tool execution.

## Common Issues with MCP SuperAssistant

This page covers the most common issues users encounter with MCP SuperAssistant and provides solutions to resolve them.

### 1. Extension Not Detecting Tool Calls

- Make sure the extension is enabled in your browser.
- Make sure the **mcp prompt instructions are properly attached or inserted** in the chat, before starting any chat.
- Check that your AI platform supports tool calls and that the feature is enabled.
- Refresh the page or restart your browser if the issue persists.

### 2. Tool Execution Fails

- Ensure your proxy server is running and the URL is correct in the sidebar server settings.
- Check your config.json file for any errors or formatting issues.
- Check your network connectivity and firewall settings.

### 3. Connection Issues

- Ensure that your MCP server is running and accessible.
- Check the server URL in the extension settings.
- First start the npx proxy server, then reload/restart the extension from the `chrome://extensions/` page.
- Check the proxy server logs for any errors or issues.
- Ensure that your firewall or antivirus software is not blocking the connection.
- Make sure the server shows the proper connected status and exposes the `/sse` endpoint.

### 4. Incorrect tool call format 

- There are times the model does not generate the correct tool call format as requested, which causes tool detection to fail.
In such cases, use models that are designed for tool calling or have stronger tool calling capabilities.
- Use the custom instructions prompt, which can be found in the MCP SuperAssistant sidebar.
- Ask explicitly to use the tools by mentioning them in the prompt.
- Below is an example of the correct MCP function call format, rendered by the MCP SuperAssistant extension:

```jsonl
{"type": "function_call_start", "name": "function_name", "call_id": 1}
{"type": "description", "text": "Short 1 line of what this function does"}
{"type": "parameter", "key": "parameter_1", "value": "value_1"}
{"type": "parameter", "key": "parameter_2", "value": "value_2"}
{"type": "function_call_end", "call_id": 1}
```

### Manual Installation (Development)

#### Release Version
1. Download the latest release from [Releases](https://github.com/munir-abbasi/MCP-SuperAssistant-updated/releases)
2. Unzip the downloaded file
3. Navigate to `chrome://extensions/` in Chrome
4. Enable "Developer mode"
5. Click "Load unpacked" and select the unzipped directory
6. Follow [Connecting to Local Proxy Server](#connecting-to-local-proxy-server) to connect to your MCP server

## Development

### Prerequisites

- Node.js (v16+)
- pnpm

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Create zip package for distribution
pnpm zip
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Authors

### Original Author

- **[Saurabh Patel](https://github.com/srbhptl39)** — Original creator and maintainer of MCP SuperAssistant

### This Repository

- **[Munir Abbasi](https://github.com/munir-abbasi)** — Fork maintainer, updates, and improvements

## Sponsor & Support

This repository is a maintained fork of the original [MCP SuperAssistant](https://github.com/srbhptl39/MCP-SuperAssistant) by Saurabh Patel.

**Support the original project:**
- ⭐ [Star the original repo](https://github.com/srbhptl39/MCP-SuperAssistant)
- 💖 [Sponsor Saurabh Patel on GitHub](https://github.com/sponsors/srbhptl39)

## Improvements Over the Original

This fork introduces significant engineering improvements over the upstream [MCP SuperAssistant](https://github.com/srbhptl39/MCP-SuperAssistant):

- **Truthful connection states** — 8 distinct states (disconnected → connecting → initialized → discovering → ready / degraded / error / reconnecting). Never shows "connected, zero tools" when discovery fails.
- **CSP-safe validation** — Replaced AJV runtime code generation with `@cfworker/json-schema`. No `unsafe-eval`, no `new Function`, no CSP violations.
- **Bounded failure** — One malformed tool schema no longer hides all valid tools. Partial discovery exposes which capabilities failed. Tool output errors produce visible, bounded failures.
- **Exactly-once execution** — Timeouts, reconnects, stream re-renders, and duplicate observations never dispatch the same tool call twice.
- **Streamable HTTP fixes** — Correct JSON and SSE-framed tool discovery, proper `Accept` and session headers, fragmented chunk handling.
- **MCP protocol preservation** — `outputSchema`, `annotations`, `structuredContent`, and other valid MCP fields are preserved, not stripped.
- **Hardened site adapter contract** — 13 requirements per supported site: idempotent mounting, SPA navigation survival, semantic selectors, verified insertion and submission, clean teardown.
- **Chrome/Firefox parity** — Tested from the same commit with identical payloads. Firefox manifest, CSP, and module conversion verified independently.
- **Payload safety** — Explicit size budgets, no megabyte-base64 DOM injection, bounded previews for oversized results.
- **Deterministic testing** — Regression tests before every fix, real-browser core flow, integrity-checked release artifacts with SHA-256 hashes.
- **Issue-ledger discipline** — 70+ upstream issues classified by first failing boundary, reproduced before any fix claim.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

The original work is Copyright (c) 2025 Saurabh Patel. Modifications and updates in this fork are Copyright (c) 2026 Munir Abbasi, distributed under the same MIT terms.

## Acknowledgments

- [Saurabh Patel](https://github.com/srbhptl39) for creating the original MCP SuperAssistant
- Inspired by the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) by Anthropic
- Thanks to [Cline](https://github.com/cline/cline) for idea inspiration
- Built with [Chrome Extension Boilerplate with React + Vite](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite)
