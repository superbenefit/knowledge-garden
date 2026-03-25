import { defineCollection } from "astro:content";
import { r2KnowledgeLoader } from "./loaders/r2-knowledge-loader";

const knowledge = defineCollection({
  loader: r2KnowledgeLoader({
    bucketUrl: "https://knowledge-bucket.superbenefit.dev",
  }),
});

export const collections = { knowledge };
