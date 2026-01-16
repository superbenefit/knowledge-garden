import * as lancedb from '@lancedb/lancedb';
import type { Table } from '@lancedb/lancedb';
import type { VectorRecord, SearchResult } from './types';

// Use LANCEDB_PATH env var for Railway volume mount, fallback to local path
const DB_PATH = process.env.LANCEDB_PATH || './lancedb';
const TABLE_NAME = 'knowledge_base';

console.log(`[VectorStore] Using database path: ${DB_PATH}`);

let db: lancedb.Connection | null = null;
let table: Table | null = null;

export async function initVectorStore(): Promise<void> {
  if (!db) {
    db = await lancedb.connect(DB_PATH);
  }
}

export async function getOrCreateTable(): Promise<Table> {
  if (table) return table;

  await initVectorStore();

  const tables = await db!.tableNames();
  if (tables.includes(TABLE_NAME)) {
    table = await db!.openTable(TABLE_NAME);
  }

  return table!;
}

export async function createTableWithData(records: VectorRecord[]): Promise<Table> {
  await initVectorStore();

  // Drop existing table if it exists
  const tables = await db!.tableNames();
  if (tables.includes(TABLE_NAME)) {
    await db!.dropTable(TABLE_NAME);
  }

  table = await db!.createTable(TABLE_NAME, records);
  return table;
}

export async function addRecords(records: VectorRecord[]): Promise<void> {
  const t = await getOrCreateTable();
  if (t) {
    await t.add(records);
  } else {
    // Table doesn't exist - create it with the provided records
    console.log(`[VectorStore] Table doesn't exist, creating with ${records.length} records`);
    await createTableWithData(records);
  }
}

export async function vectorSearch(
  embedding: number[],
  limit: number = 10
): Promise<SearchResult[]> {
  const t = await getOrCreateTable();
  if (!t) return [];

  const results = await t
    .vectorSearch(embedding)
    .limit(limit)
    .toArray();

  return results.map(r => ({
    id: r.id,
    text: r.text,
    title: r.title,
    url: r.url,
    section: r.section || '',
    file_path: r.file_path,
    _distance: r._distance
  }));
}

export async function getStats(): Promise<{ totalChunks: number; status: string }> {
  try {
    const t = await getOrCreateTable();
    if (!t) {
      return { totalChunks: 0, status: 'empty' };
    }
    const count = await t.countRows();
    return { totalChunks: count, status: 'ready' };
  } catch {
    return { totalChunks: 0, status: 'empty' };
  }
}

export async function getAllChunkIds(): Promise<Set<string>> {
  try {
    const t = await getOrCreateTable();
    if (!t) return new Set();

    const results = await t.query().select(['id']).toArray();
    return new Set(results.map(r => r.id));
  } catch {
    return new Set();
  }
}

// Get sample chunks for debugging
export async function getSampleChunks(limit: number = 10): Promise<SearchResult[]> {
  try {
    const t = await getOrCreateTable();
    if (!t) return [];

    const results = await t.query()
      .select(['id', 'text', 'title', 'url', 'section', 'file_path'])
      .limit(limit)
      .toArray();

    return results.map(r => ({
      id: r.id,
      text: r.text,
      title: r.title,
      url: r.url,
      section: r.section || '',
      file_path: r.file_path,
      _distance: 0
    }));
  } catch {
    return [];
  }
}
