import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { vectorSearch, getStats } from './vector-store';
import { getSystemPrompt } from './system-prompt';
import type { ChatMessage, SearchResult } from './types';

const TOP_K = 20; // Number of chunks to retrieve (increased for better coverage)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// Generate embedding for the query
async function getQueryEmbedding(query: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });
  return response.data[0].embedding;
}

// Build context from search results
function buildContext(results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No relevant content found in the knowledge base.';
  }

  return results.map((r, i) => {
    return `--- Source ${i + 1}: ${r.title} (${r.section}) ---
URL: ${r.url}
Content:
${r.text}
---`;
  }).join('\n\n');
}

// Main chat function with streaming
export async function* chat(
  message: string,
  history: ChatMessage[],
  siteName: string = 'Knowledge Base',
  siteDescription: string = ''
): AsyncGenerator<string> {
  // 1. Generate query embedding
  const embedding = await getQueryEmbedding(message);

  // 2. Search vector store
  const results = await vectorSearch(embedding, TOP_K);

  // Log search results for debugging (only in development)
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_SEARCH) {
    console.log(`[Chat] Query: "${message}"`);
    console.log(`[Chat] Found ${results.length} results:`);
    results.slice(0, 5).forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.title} - ${r.section} (distance: ${r._distance?.toFixed(4)})`);
    });
  }

  // 3. Build context
  const context = buildContext(results);

  // 4. Prepare messages
  const systemPrompt = getSystemPrompt(siteName, siteDescription);
  const userMessage = `Context from knowledge base:
${context}

User question: ${message}`;

  // 5. Stream response from LLM
  if (anthropic && process.env.LLM_PROVIDER !== 'openai') {
    // Use Claude
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2500,
      system: systemPrompt,
      messages: [
        ...history.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        })),
        { role: 'user' as const, content: userMessage }
      ]
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  } else {
    // Use OpenAI
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2500,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        })),
        { role: 'user', content: userMessage }
      ]
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }
}

export { getStats };
