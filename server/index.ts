import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chat, getStats } from './rag-service';
import { generateAllEmbeddings } from './embeddings';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Question logging
const LOGS_DIR = path.join(__dirname, 'logs');

interface QuestionLog {
  timestamp: string;
  sessionId: string;
  question: string;
  response: string;
  historyLength: number;
}

function logQuestion(entry: QuestionLog): void {
  try {
    // Ensure logs directory exists
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    }

    // Get today's date for filename
    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(LOGS_DIR, `questions-${today}.json`);

    // Read existing logs or start fresh
    let logs: QuestionLog[] = [];
    if (fs.existsSync(logFile)) {
      const content = fs.readFileSync(logFile, 'utf-8');
      logs = JSON.parse(content);
    }

    // Append new entry and write
    logs.push(entry);
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('[QuestionLog] Error writing log:', error);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// CUSTOMIZE THESE FOR YOUR SITE
const SITE_NAME = 'SuperBenefit Knowledge Garden';
const SITE_DESCRIPTION = 'A comprehensive knowledge base about DAOs, governance, and decentralized coordination.';
const CONTENT_DIR = './content';

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Stats endpoint
app.get('/api/stats', async (req, res) => {
  const stats = await getStats();
  res.json(stats);
});

// Debug endpoint - shows sample indexed content to diagnose search issues
app.get('/api/debug', async (req, res) => {
  try {
    const { getSampleChunks } = await import('./vector-store');
    const samples = await getSampleChunks(20);
    const stats = await getStats();
    res.json({
      totalChunks: stats.totalChunks,
      status: stats.status,
      sampleTitles: samples.map(s => ({
        title: s.title,
        section: s.section,
        file_path: s.file_path,
        textPreview: s.text?.substring(0, 150) + '...'
      }))
    });
  } catch (error) {
    res.json({ error: String(error), status: 'error' });
  }
});

// Chat endpoint with streaming
app.post('/api/chat', async (req, res) => {
  const { message, history = [], sessionId = 'unknown' } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let fullResponse = '';

  try {
    for await (const chunk of chat(message, history, SITE_NAME, SITE_DESCRIPTION)) {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);

    // Log the question and response
    logQuestion({
      timestamp: new Date().toISOString(),
      sessionId,
      question: message,
      response: fullResponse,
      historyLength: history.length
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.write(`data: ${JSON.stringify({ error: 'An error occurred' })}\n\n`);
  }

  res.end();
});

// Regenerate embeddings endpoint
// POST /api/regenerate - incremental update (only new content)
// POST /api/regenerate?full=true - full regeneration (drops and rebuilds all embeddings)
let isRegenerating = false;
app.post('/api/regenerate', async (req, res) => {
  if (isRegenerating) {
    return res.json({ status: 'already_running', message: 'Regeneration already in progress' });
  }

  const fullRegenerate = req.query.full === 'true' || req.body.full === true;

  isRegenerating = true;
  const mode = fullRegenerate ? 'full' : 'incremental';
  console.log(`[Regenerate] Starting ${mode} embedding regeneration...`);
  res.json({ status: 'started', message: `Embedding ${mode} regeneration started` });

  try {
    await generateAllEmbeddings(CONTENT_DIR, fullRegenerate);
    console.log(`[Regenerate] ${mode} regeneration completed successfully`);
  } catch (error) {
    console.error('[Regenerate] Error:', error);
  } finally {
    isRegenerating = false;
  }
});

// Validate environment
if (!process.env.OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY is required');
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('WARNING: ANTHROPIC_API_KEY not set, using OpenAI for chat');
}

app.listen(PORT, () => {
  console.log(`Chat server running on port ${PORT}`);
});
