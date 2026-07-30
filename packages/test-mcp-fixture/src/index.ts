import express from 'express';
import cors from 'cors';
import { handleMcpRequest } from './scenarios.js';

const app = express();
const port = process.env.PORT || 3030;

app.use(cors({
  origin: '*', // Allow extension
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization']
}));
app.use(express.json());

// Main MCP endpoint
app.post('/mcp', async (req, res) => {
  const scenario = req.query.scenario as string || 'default';
  
  console.log(`[MCP Fixture] POST /mcp scenario=${scenario} method=${req.body?.method}`);
  
  try {
    await handleMcpRequest(req, res, scenario);
  } catch (error) {
    console.error('[MCP Fixture] Error handling request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// SSE endpoint for legacy/Streamable HTTP SSE
app.get('/mcp/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  console.log(`[MCP Fixture] GET /mcp/sse connected`);

  res.write('event: endpoint\n');
  res.write(`data: http://localhost:${port}/mcp/message\n\n`);

  req.on('close', () => {
    console.log(`[MCP Fixture] GET /mcp/sse closed`);
  });
});

app.post('/mcp/message', async (req, res) => {
  const scenario = req.query.scenario as string || 'default';
  
  console.log(`[MCP Fixture] POST /mcp/message scenario=${scenario} method=${req.body?.method}`);
  
  try {
    await handleMcpRequest(req, res, scenario);
  } catch (error) {
    console.error('[MCP Fixture] Error handling message:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`MCP Fixture Server listening at http://localhost:${port}`);
});
