import { defineCollection } from "astro:content";
import { loadEnv } from "vite";
import { r2KnowledgeLoader } from "./loaders/r2-knowledge-loader";

const env = loadEnv("", process.cwd(), "");
const R2_BUCKET_URL = env.R2_BUCKET_URL;

if (!R2_BUCKET_URL) {
  throw new Error("R2_BUCKET_URL environment variable is not set. Create a .env file with R2_BUCKET_URL=https://knowledge-bucket.superbenefit.dev");
}

const knowledge = defineCollection({
  loader: r2KnowledgeLoader({
    bucketUrl: R2_BUCKET_URL,
  }),
});

export const collections = { knowledge };
