import fs from 'fs';

const filePath = 'chrome-extension/src/mcpclient/core/McpClient.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// Replace getters
content = content.replace(/this\.isConnectedFlag/g, '(this.connectionState === ConnectionState.CONNECTED)');

// Revert assignments that were falsely converted
content = content.replace(/\(this\.connectionState === ConnectionState\.CONNECTED\) = false;/g, 'this.connectionState = ConnectionState.DISCONNECTED;');
content = content.replace(/\(this\.connectionState === ConnectionState\.CONNECTED\) = true;/g, 'this.connectionState = ConnectionState.CONNECTED;');

// Also fix the property declaration if I didn't get it right
content = content.replace(/private \(this\.connectionState === ConnectionState\.CONNECTED\): boolean = false;/g, 'private connectionState: ConnectionState = ConnectionState.DISCONNECTED;');

// Fix disconnect() signature and cleanup activeCalls
const callToolRegex = /async callTool\(toolName: string, args: Record<string, any>, adapterName\?: string\): Promise<any> \{/g;
const newCallTool = `async callTool(toolName: string, args: Record<string, any>, adapterName?: string, signal?: AbortSignal): Promise<any> {
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

  private async executeToolCall(callId: string, toolName: string, args: Record<string, any>, adapterName?: string): Promise<any> {`;

content = content.replace(callToolRegex, newCallTool);

// Need to resolve the Promise at the end of executeToolCall
content = content.replace(/return result;\n    } catch \(error\)/, `this.activeCalls.delete(callId);\n      return result;\n    } catch (error) {`);

// In cleanup() we need to reject active calls
content = content.replace(/this\.clearPrimitivesCache\(\);/g, `this.clearPrimitivesCache();\n    \n    // Reject all active calls\n    for (const [callId, call] of this.activeCalls.entries()) {\n      call.reject(new Error('Connection dropped or disconnected'));\n    }\n    this.activeCalls.clear();`);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Refactoring complete.');
