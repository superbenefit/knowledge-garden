import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/**
 * Build-time content collections.
 * These are loaded from local markdown files at build time via glob().
 * No Cloudflare bindings are available during build.
 */

/** Docs collection — static content built at compile time */
const docs = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./content/docs" }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    type: z.string().optional(),
    tags: z.array(z.string()).optional(),
    aliases: z.array(z.string()).optional(),
    publish: z.boolean().optional(),
    date: z.coerce.date().optional(),
    created: z.coerce.date().optional(),
    modified: z.coerce.date().optional(),
    banner: z.string().optional(),
    license: z.string().optional(),
  }),
});

/** Folder metadata — index.md files with folder-level frontmatter */
const folders = defineCollection({
  loader: glob({ pattern: "*/index.md", base: "./content" }),
  schema: z.object({
    title: z.string().nullish(),
    description: z.string().nullish(),
    type: z.string().nullish(),
    tags: z.array(z.string()).nullish(),
    banner: z.string().nullish(),
    publish: z.boolean().nullish(),
  }).passthrough(),
});

export const collections = { docs, folders };
