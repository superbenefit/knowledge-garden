import 'dotenv/config';
import { generateAllEmbeddings, parseContentFiles } from './embeddings';
import { getStats } from './vector-store';

const CONTENT_DIR = './content'; // Adjust to your content directory
const MIN_CHUNK_THRESHOLD = 50; // If DB has fewer chunks than this, force full regeneration

async function main() {
  const forceFullFlag = process.argv.includes('--full');

  if (!process.env.OPENAI_API_KEY) {
    console.error('ERROR: OPENAI_API_KEY environment variable is required');
    process.exit(1);
  }

  // Check current database state
  const stats = await getStats();
  console.log(`[Startup] Current database has ${stats.totalChunks} chunks (status: ${stats.status})`);

  // Parse content to see how many chunks we should have
  const expectedChunks = parseContentFiles(CONTENT_DIR);
  console.log(`[Startup] Content directory has ${expectedChunks.length} chunks`);

  // Determine if we need full regeneration
  let fullRegenerate = forceFullFlag;

  if (!fullRegenerate && stats.totalChunks < MIN_CHUNK_THRESHOLD && expectedChunks.length > MIN_CHUNK_THRESHOLD) {
    console.log(`[Startup] Database appears empty or incomplete (${stats.totalChunks} < ${MIN_CHUNK_THRESHOLD}), triggering full regeneration`);
    fullRegenerate = true;
  }

  if (!fullRegenerate && stats.totalChunks < expectedChunks.length * 0.5) {
    console.log(`[Startup] Database has less than 50% of expected chunks, triggering full regeneration`);
    fullRegenerate = true;
  }

  console.log(`Mode: ${fullRegenerate ? 'Full regeneration' : 'Incremental update'}`);
  console.log(`Content directory: ${CONTENT_DIR}`);

  await generateAllEmbeddings(CONTENT_DIR, fullRegenerate);
}

main().catch(console.error);
