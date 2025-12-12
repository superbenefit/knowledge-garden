FROM node:20-slim

WORKDIR /app

# Copy package files from parent directory
COPY ../package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy server files
COPY . ./server/

# Copy content for embedding generation
COPY ../content/ ./content/

# Create lancedb directory
RUN mkdir -p /app/lancedb

EXPOSE 3001

CMD ["npx", "tsx", "server/index.ts"]
