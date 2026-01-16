import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import type { ContentChunk, VectorRecord } from './types';
import { createTableWithData, addRecords, getAllChunkIds } from './vector-store';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const BATCH_SIZE = 100;
const MAX_TOKENS_PER_BATCH = 8000;

// Patterns to ignore (matches Quartz config ignorePatterns)
const IGNORE_PATTERNS = ['private', 'templates', '.obsidian', '.github'];

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Parse YAML frontmatter from markdown content
function parseFrontmatter(content: string): Record<string, unknown> {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};

  const yaml = match[1];
  const frontmatter: Record<string, unknown> = {};

  // Simple YAML parsing for key: value pairs
  const lines = yaml.split('\n');
  for (const line of lines) {
    const keyValue = line.match(/^(\w+):\s*(.*)$/);
    if (keyValue) {
      const [, key, value] = keyValue;
      // Parse booleans
      if (value === 'true') frontmatter[key] = true;
      else if (value === 'false') frontmatter[key] = false;
      // Parse quoted strings
      else if (value.match(/^["'].*["']$/)) frontmatter[key] = value.slice(1, -1);
      else frontmatter[key] = value;
    }
  }

  return frontmatter;
}

// Check if a file should be indexed (respects Quartz publish filters)
function shouldIndex(content: string, relativePath: string): boolean {
  // Check ignore patterns
  const pathParts = relativePath.split('/');
  for (const part of pathParts) {
    if (IGNORE_PATTERNS.includes(part)) {
      return false;
    }
  }

  const frontmatter = parseFrontmatter(content);

  // Skip drafts (RemoveDrafts filter)
  if (frontmatter.draft === true) {
    return false;
  }

  // Require explicit publish (ExplicitPublish filter)
  // This is the critical security filter - only index content marked for publication
  // Handle both boolean true and string "true" (YAML parsing varies)
  if (frontmatter.publish !== true && frontmatter.publish !== 'true') {
    return false;
  }

  return true;
}

// Estimate tokens (conservative)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5);
}

// Generate embeddings for a batch of texts
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });

  return response.data.map(d => d.embedding);
}

// Parse your content files and create chunks
// CUSTOMIZE THIS FUNCTION FOR YOUR CONTENT STRUCTURE
export function parseContentFiles(contentDir: string): ContentChunk[] {
  const chunks: ContentChunk[] = [];

  function walkDir(dir: string) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.md')) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const relativePath = path.relative(contentDir, filePath);

        // SECURITY: Only index published content (respects Quartz ExplicitPublish filter)
        if (!shouldIndex(content, relativePath)) {
          continue;
        }

        // Extract title from frontmatter or filename
        const titleMatch = content.match(/^---\s*\n(?:.*\n)*?title:\s*["']?([^"'\n]+)["']?\s*\n/);
        const title = titleMatch ? titleMatch[1] : path.basename(file, '.md');

        // Extract description from frontmatter for additional context
        const descMatch = content.match(/^---\s*\n(?:.*\n)*?description:\s*["']?([^"'\n]+)["']?\s*\n/);
        const description = descMatch ? descMatch[1] : '';

        // Extract parent folder name for context (e.g., "reimagining-power")
        const parentFolder = path.dirname(relativePath).split('/').pop() || '';

        // Convert file path to URL (adjust for your routing)
        const url = '/' + relativePath.replace(/\.md$/, '').replace(/\/index$/, '');

        // Split content into sections by headers
        const sections = content.split(/(?=^##?\s)/m);

        sections.forEach((section, index) => {
          const sectionTitle = section.match(/^##?\s+(.+)$/m)?.[1] || 'Introduction';
          const cleanText = section
            .replace(/^---[\s\S]*?---\n/, '') // Remove frontmatter
            .replace(/^##?\s+.+$/m, '')       // Remove header
            .trim();

          if (cleanText.length > 50) { // Skip very short sections
            // Create context-enriched text for better semantic search
            // This helps queries like "RPP partners" find content about specific case studies
            let contextPrefix = `Document: ${title}`;
            if (description) {
              contextPrefix += `\nDescription: ${description}`;
            }
            if (parentFolder && parentFolder !== 'content' && parentFolder !== 'artifacts') {
              contextPrefix += `\nProject: ${parentFolder.replace(/-/g, ' ')}`;
            }
            contextPrefix += `\nSection: ${sectionTitle}\n\n`;

            const textWithContext = contextPrefix + cleanText;

            chunks.push({
              id: `${relativePath}-section-${index}`,
              text: textWithContext.slice(0, 8000), // Limit chunk size
              metadata: {
                title,
                url,
                section: sectionTitle,
                file_path: relativePath
              }
            });
          }
        });
      }
    }
  }

  walkDir(contentDir);
  return chunks;
}

// Main embedding generation function
export async function generateAllEmbeddings(
  contentDir: string,
  fullRegenerate: boolean = false
): Promise<void> {
  console.log('Parsing content files...');
  const chunks = parseContentFiles(contentDir);
  console.log(`Found ${chunks.length} chunks`);

  // Check which chunks already exist
  let existingIds = new Set<string>();
  if (!fullRegenerate) {
    existingIds = await getAllChunkIds();
    console.log(`Found ${existingIds.size} existing chunks in database`);
  }

  // Filter to new chunks only
  const newChunks = chunks.filter(c => !existingIds.has(c.id));
  console.log(`Processing ${newChunks.length} new chunks`);

  if (newChunks.length === 0) {
    console.log('No new chunks to process');
    return;
  }

  // Process in batches
  const records: VectorRecord[] = [];
  let batch: ContentChunk[] = [];
  let batchTokens = 0;

  // Track whether we've created the table in full regeneration mode
  // This prevents dropping and recreating the table on every batch
  let tableCreatedForFullRegen = false;

  for (const chunk of newChunks) {
    const tokens = estimateTokens(chunk.text);

    if (batch.length >= BATCH_SIZE || batchTokens + tokens > MAX_TOKENS_PER_BATCH) {
      // Process current batch
      if (batch.length > 0) {
        console.log(`Processing batch of ${batch.length} chunks...`);
        const embeddings = await generateEmbeddings(batch.map(c => c.text));

        for (let i = 0; i < batch.length; i++) {
          records.push({
            id: batch[i].id,
            text: batch[i].text,
            vector: embeddings[i],
            title: batch[i].metadata.title,
            url: batch[i].metadata.url,
            section: batch[i].metadata.section || '',
            file_path: batch[i].metadata.file_path
          });
        }

        // Save incrementally every 10 chunks
        if (records.length >= 10) {
          if (fullRegenerate && !tableCreatedForFullRegen) {
            // First batch in full regeneration: drop and create table
            await createTableWithData(records);
            tableCreatedForFullRegen = true;
            console.log(`[FullRegen] Created table with ${records.length} initial records`);
          } else {
            // Subsequent batches: append to existing table
            await addRecords(records);
            console.log(`[Save] Added ${records.length} records to database`);
          }
          records.length = 0; // Clear after saving
        }
      }

      batch = [];
      batchTokens = 0;
    }

    batch.push(chunk);
    batchTokens += tokens;
  }

  // Process remaining batch
  if (batch.length > 0) {
    console.log(`Processing final batch of ${batch.length} chunks...`);
    const embeddings = await generateEmbeddings(batch.map(c => c.text));

    for (let i = 0; i < batch.length; i++) {
      records.push({
        id: batch[i].id,
        text: batch[i].text,
        vector: embeddings[i],
        title: batch[i].metadata.title,
        url: batch[i].metadata.url,
        section: batch[i].metadata.section || '',
        file_path: batch[i].metadata.file_path
      });
    }
  }

  // Save any remaining records
  if (records.length > 0) {
    if (fullRegenerate && !tableCreatedForFullRegen) {
      // Edge case: all chunks fit in one batch, table never created yet
      await createTableWithData(records);
      console.log(`[FullRegen] Created table with ${records.length} records`);
    } else {
      await addRecords(records);
      console.log(`[Save] Added final ${records.length} records to database`);
    }
  }

  console.log('Embedding generation complete!');
}
