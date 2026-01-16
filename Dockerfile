FROM node:20-slim as builder
WORKDIR /usr/src/app
COPY package.json .
COPY package-lock.json* .
RUN npm ci --legacy-peer-deps

FROM node:20-slim
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/ /usr/src/app/

# Copy server files and content
COPY server/ ./server/
COPY content/ ./content/
COPY start.sh ./

# Make start script executable
RUN chmod +x start.sh

# Create directory for Railway volume mount
# On Railway: Create a volume and mount it to /data
# Then set env var LANCEDB_PATH=/data/lancedb
RUN mkdir -p /data/lancedb

EXPOSE 3001

# Run the chat server (generates embeddings for new content, then starts API)
CMD ["./start.sh"]
