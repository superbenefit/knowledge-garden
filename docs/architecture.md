# Architecture

## Overview

The Knowledge Garden is an Astro v6 hybrid site deployed on Cloudflare Workers. All content is read directly from an R2 bucket via Astro v6 live collections.

## Content Delivery

| Route | Source | Rendering | Status |
|-------|--------|-----------|--------|
| `/[type]/` | R2 live collection (filter by `contentType`) | SSR (`prerender = false`) | Working |
| `/docs/` | R2 live collection (filter by `path.startsWith("docs/")`) | SSR (`prerender = false`) | Working |
| `/api/docs-tree` | R2 live collection (filter by path prefix) | SSR | Working |
| `/api/search` | Stub | SSR | Returns `{ items: [], total: 0 }` (TODO: CF AI Search) |
| `/api/preview` | R2 live entry (`getLiveEntry`) | SSR | Working |
| `/api/backlinks` | Stub | SSR | Returns `[]` (not yet implemented) |
| `/api/graph` | Stub | SSR | Returns `{ nodes: [], links: [] }` (not yet implemented) |

## Rendering Strategy

**SSR pages** (most of the site) opt in with `export const prerender = false` and are rendered on each request by the Cloudflare Worker:
- `src/pages/[type]/index.astro` and `src/pages/[type]/[id].astro` handle all content types
- `src/pages/docs/index.astro` and `src/pages/docs/[...slug].astro` handle the docs section, filtering by `path.startsWith("docs/")`

**Redirect pages** at `src/pages/lexicon/`, `people/`, `groups/`, `projects/` redirect to the corresponding `[type]/` routes (e.g. `/lexicon` → `/tag`, `/people` → `/person`).

**React islands** provide client-side interactivity. Components like SearchBar, GraphView, DarkMode, DocsTreeNav, FilterPanel, and PopoverPreview are hydrated on the client using Astro's `client:load` or `client:only="react"` directives.

## Data Layer

Content is stored as JSON documents in the `KNOWLEDGE_BUCKET` R2 bucket under the `content/` prefix. Each document follows the `R2Document` schema from `@superbenefit/knowledge-schemas`.

### Live Collection Loader (`src/loaders/r2-knowledge-loader.ts`)

The custom Astro v6 loader connects directly to R2:

- `loadCollection()` — lists all `content/*` objects, returns entries with metadata only (body omitted for performance)
- `loadEntry({ filter: { id } })` — fetches a single object, returns full entry including content body

### Collection Configuration (`src/live.config.ts`)

A single "knowledge" collection is registered using `defineLiveCollection()`. Type and path filtering happens at query time in pages.

### Data Access Pattern

Pages import from `astro:content`:

```typescript
import { getLiveCollection, getLiveEntry } from "astro:content";
import { fromCollectionEntry } from "@/lib/types";

// Listing: returns all entries (body omitted)
const result = await getLiveCollection("knowledge");
const docs = (result.entries ?? []).map(e => fromCollectionEntry(e.id, e.data));

// Detail: returns single entry with body
const result = await getLiveEntry("knowledge", `content/${type}/${id}.json`);
const doc = fromCollectionEntry(result.entry.id, result.entry.data);
```

### Adapter: `fromCollectionEntry()`

Converts live collection entry data to the garden `Document` interface. Extracts the document ID from the R2 key (e.g., `content/pattern/governance-primitives.json` becomes `governance-primitives`).

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

The R2 object has a `path` field (e.g. `"docs/dao-primitives/index.md"`). `fromCollectionEntry()` preserves it as an optional `path` field on `Document`. The docs section uses this path to derive URL slugs and determine section membership.

## Middleware

`src/middleware.ts` runs on every SSR request and adds:

- Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- Immutable cache headers for `/_astro/` static assets

## Markdown Processing

Two markdown pipelines exist:

1. **Build-time** (Astro's built-in) — configured in `astro.config.mjs` with remark-gfm, remark-obsidian, rehype-raw, rehype-callouts, rehype-slug
2. **Runtime** (`src/lib/markdown.ts`) — unified pipeline for rendering markdown body content from R2 documents. Uses the same remark/rehype plugins.

## Project Structure

```
src/
  components/
    layout/         BaseLayout, ContentLayout, Header, Footer, Sidebar
    content/        TypeBadge, ReleaseCard, BackLinks, TagList, ToC, etc.
    islands/        SearchBar, GraphView, DarkMode, DocsTreeNav, FilterPanel, PopoverPreview (React)
  pages/
    api/            search, graph, backlinks, docs-tree, preview
    docs/           SSR docs pages (index.astro + [...slug].astro) via R2 live collection, path-filtered
    [type]/         SSR content pages (index.astro + [id].astro)
    lexicon/        Redirect → /tag
    people/         Redirect → /person
    groups/         Redirect → /group
    projects/       Redirect → /project
    tags/           SSR tag pages
  lib/
    types.ts        Document, ContentType, fromCollectionEntry adapter
    docs-tree.ts    TreeNode interface + buildTree() for docs navigation
    markdown.ts     Runtime markdown renderer
  loaders/
    r2-knowledge-loader.ts  Astro live collection loader for R2 bucket
  live.config.ts    Defines "knowledge" collection via defineLiveCollection
  styles/
    global.css      Tailwind v4 @theme tokens
  middleware.ts     Security headers, cache control
tests/
  lib/              Unit tests for types, markdown
  integration/      Build output verification (requires prior build)
```
