import { defineLiveCollection } from "astro:content";
import { r2KnowledgeLoader } from "./loaders/r2-knowledge-loader";

// Single collection — type and path filtering happens at query time in pages.
const knowledge = defineLiveCollection({
  loader: r2KnowledgeLoader(),
});

export const collections = { knowledge };
