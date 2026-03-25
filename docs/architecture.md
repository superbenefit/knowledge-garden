# Architecture

## Overview

The Knowledge Garden is an Astro v6 static site deployed on Cloudflare Workers. Content is loaded from an R2 bucket at build time via Astro content collections.

## Content Delivery

| Route | Source | Rendering | Status |
|-------|--------|-----------|--------|
| `/[type]/` | R2 content collection (filter by `contentType`) | Static (`getStaticPaths`) | Working |
| `/docs/` | R2 content collection (filter by `path.startsWith("docs/")`) | Static | Working |
| `/tags/[tag]/` | R2 content collection (filter by tags) | Static (`getStaticPaths`) | Working |
| `/search` | Pagefind static index | Static | Working |

## Rendering Strategy

**Static pages** (`output: "static"`) are pre-rendered at build time:
- `src/pages/[type]/index.astro` and `src/pages/[type]/[id].astro` handle all content types
- `src/pages/docs/index.astro` and `src/pages/docs/[...slug].astro` handle the docs section
- `src/pages/tags/[tag].astro` generates a page per tag

**Redirect pages** at `src/pages/lexicon/`, `people/`, `groups/`, `projects/` redirect to the corresponding `[type]/` routes (e.g. `/lexicon` → `/tag`, `/people` → `/person`).

**React islands** provide client-side interactivity. Components like DocsTreeNav and DarkMode are hydrated using Astro's `client:load` directive.

## Data Layer

Content is stored as JSON documents in an R2 bucket under the `content/` prefix. Each document follows the `R2Document` schema from `@superbenefit/knowledge-schemas`.

### Content Collection Loader (`src/loaders/r2-knowledge-loader.ts`)

The custom Astro loader connects to R2 via public fetch (no credentials needed):

- `load()` — fetches a manifest from R2, then fetches all content objects in parallel
- Downloads attachments to `public/attachments/` at build time
- No API tokens required — uses public custom domain

### Collection Configuration (`src/content.config.ts`)

A single "knowledge" collection is registered using `defineCollection()`. Type and path filtering happens at query time in pages.

### Data Access Pattern

Pages import from `astro:content`:

```typescript
import { getCollection } from "astro:content";
import { fromCollectionEntry } from "@/lib/types";

// Listing: returns all entries (body included)
const entries = await getCollection("knowledge");
const docs = entries.map(e => fromCollectionEntry(e.id, e.data));

// Detail: entry is passed as prop from getStaticPaths()
const entry = fromCollectionEntry(entryProp.id, entryProp.data);
```

### Adapter: `fromCollectionEntry()`

Converts content collection entry data to the garden `Document` interface. Extracts the document ID from the R2 key (e.g., `content/pattern/governance-primitives.json` becomes `governance-primitives`).

## Type System

The `Document` interface (garden-facing, adapted from R2 data by `fromCollectionEntry()`):

```typescript
interface Document {
  id: string
  type: ContentType
  category: TypeCategory
  title: string
  description?: string
  body: string
  path?: string            // source KB file path, e.g. "docs/dao-primitives/index.md"
  tags: string[]
  aliases: string[]
  created?: string
  modified?: string
  group?: string
  banner?: string
  license?: string
  frontmatter: Record<string, unknown>
}
```

~22 content types grouped into categories:
- **resource**: pattern, practice, primitive, protocol, playbook
- **story**: study, article, guide
- **reference**: index, link, tag
- **data**: person, group, project, place, gathering
- **other**: file, question, resource (base)

Every document has a `type` (specific) and `category` (derived via `getCategory()`). Components like TypeBadge render differently based on category.

## Middleware

`src/middleware.ts` adds security headers and cache control for static assets.

## Markdown Processing

Two markdown pipelines exist:

1. **Build-time** (Astro's built-in) — configured in `astro.config.mjs` with remark-gfm, remark-obsidian, rehype-raw, rehype-callouts, rehype-slug
2. **Runtime** (`src/lib/markdown.ts`) — unified pipeline for rendering markdown body content from R2 documents. Uses the same remark/rehype plugins.

## Search

Search is handled by Pagefind, a static search library:
- Index is built at compile time during `astro build`
- Served as static assets under `/pagefind/`
- No API endpoints required

## Project Structure

```
src/
  components/
    layout/         BaseLayout, ContentLayout, Header, Footer, Sidebar
    content/        TypeBadge, ReleaseCard, BackLinks, TagList, ToC, etc.
    islands/        DocsTreeNav, DarkMode, GraphView, FilterPanel (React)
  pages/
    docs/           Static docs pages ([...slug].astro)
    [type]/         Static content pages (index.astro + [id].astro)
    lexicon/        Redirect → /tag
    people/         Redirect → /person
    groups/         Redirect → /group
    projects/       Redirect → /project
    tags/           Static tag pages
    search.astro    Pagefind search UI
  lib/
    types.ts        Document, ContentType, fromCollectionEntry adapter
    docs-tree.ts    TreeNode interface + buildTree() for docs navigation
    markdown.ts     Runtime markdown renderer
  loaders/
    r2-knowledge-loader.ts  Astro content loader for R2 bucket
  content.config.ts Defines "knowledge" collection
  styles/
    global.css      Tailwind v4 @theme tokens
  middleware.ts     Security headers, cache control
tests/
  lib/              Unit tests for types, markdown
  integration/      Build output verification (skipped by default)
```
