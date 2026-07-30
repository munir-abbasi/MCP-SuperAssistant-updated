import { Request, Response } from 'express';

const defaultTools = [
  {
    name: 'test-tool',
    description: 'A test tool',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      },
      required: ['message']
    }
  }
];

export async function handleMcpRequest(req: Request, res: Response, scenario: string) {
  const method = req.body?.method;
  const id = req.body?.id;
  
  if (scenario === 'slow') {
    await new Promise(r => setTimeout(r, 2000));
  }

  if (scenario === 'hanging') {
    // Hang indefinitely (well, 1 hour to prevent actual memory leak in test server)
    await new Promise(r => setTimeout(r, 3600000));
  }
  
  if (scenario === 'malformed') {
    return res.status(200).send('This is not json');
  }

  if (method === 'initialize') {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'test-fixture',
          version: '1.0.0'
        }
      }
    });
  }

  if (method === 'notifications/initialized') {
    return res.status(204).send();
  }

  if (method === 'tools/list') {
    if (scenario === 'zero_tools') {
      return res.json({
        jsonrpc: '2.0',
        id,
        result: { tools: [] }
      });
    }

    if (scenario === 'discovery_error') {
      return res.json({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: 'Simulated discovery failure'
        }
      });
    }

    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        tools: defaultTools
      }
    });
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = req.body.params || {};
    
    if (scenario === 'tool_error') {
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            { type: 'text', text: 'Simulated tool failure' }
          ],
          isError: true
        }
      });
    }

    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        content: [
          { type: 'text', text: `Success: Called ${name} with ${JSON.stringify(args)}` }
        ]
      }
    });
  }
  
  if (method === 'ping') {
    return res.json({ jsonrpc: '2.0', id, result: {} });
  }

  return res.json({
    jsonrpc: '2.0',
    id,
    error: {
      code: -32601,
      message: `Method not found: ${method}`
    }
  });
}
