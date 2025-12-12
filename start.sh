#!/bin/bash

echo "=== SuperBenefit Knowledge Garden Chat Server ==="
echo ""

# Step 1: Generate embeddings for any new content
# This runs in incremental mode by default - only processes new/changed documents
echo "Checking for new content and generating embeddings..."
npx tsx server/generate-embeddings.ts

# Step 2: Start the chat server
echo ""
echo "Starting chat server on port ${PORT:-3001}..."
npx tsx server/index.ts
