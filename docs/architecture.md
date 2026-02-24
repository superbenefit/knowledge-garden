# Architecture

## Overview

The Knowledge Garden is an Astro v6 hybrid site deployed on Cloudflare Workers. All content is served at runtime via RPC to a knowledge-server Worker using service bindings.

**Known issue:** The docs section (`/docs/*`) is currently broken — it uses Astro build-time content collections pointing at an empty local directory. Fix in progress.

## Content Delivery

| Route | Source | Rendering | Status |
|-------|--------|-----------|--------|
| `/[type]/` | knowledge-server RPC | SSR (`prerender = false`) | Working |
| `/docs/` | `content/docs/**/*.md` via `getCollection` | Build-time (prerendered) | **BROKEN** — empty source dir |
| `/api/docs-tree` | `content/docs/` via `getCollection` | SSR | **BROKEN** — returns empty tree |
| `/api/search`, `/api/preview` | knowledge-server RPC | SSR | Working |
| `/api/backlinks` | Stub | SSR | Returns `[]` (not yet implemented) |
| `/api/graph` | Stub | SSR | Returns `{ nodes: [], links: [] }` (not yet implemented) |

### Legacy artefacts (exist but not active)

- `src/content.config.ts` — defines `docs` and `folders` collections using `glob()` loader, pointing at the empty `content/docs/` directory
- `content/` directory — contains legacy Quartz files (`artifacts/`, `notes/`, `tags/`, `links/`); these are NOT used by the Astro site. `content/docs/` is empty
- `src/loaders/types.ts` — dead code, imported nowhere

## Rendering Strategy

**SSR pages** (most of the site) opt in with `export const prerender = false` and are rendered on each request by the Cloudflare Worker. The dynamic route `src/pages/[type]/index.astro` and `src/pages/[type]/[id].astro` handle all working content types.

**Redirect pages** at `src/pages/lexicon/`, `people/`, `groups/`, `projects/` redirect to the corresponding `[type]/` routes (e.g. `/lexicon` → `/tag`, `/people` → `/person`).

**React islands** provide client-side interactivity. Components like SearchBar, GraphView, DarkMode, DocsTreeNav, FilterPanel, and PopoverPreview are hydrated on the client using Astro's `client:load` or `client:only="react"` directives.

## RPC Layer

The knowledge-server is a separate Cloudflare Worker accessed via the `KNOWLEDGE_SERVER` service binding (defined in `wrangler.jsonc`).

### Client interface (`KnowledgeClient` in `src/lib/rpc.ts`)

```typescript
interface KnowledgeClient {
  getDocument(contentType: string, id: string): Promise<Document | null>
  listEntries(params?: ListParams): Promise<ListResponse>
  search(query: string, opts?: SearchParams): Promise<{ items: SearchResult[]; total: number }>
  listGroups(): Promise<Array<{ id: string; title: string; description?: string }>>
  listReleases(): Promise<Array<{ id: string; title: string; description?: string }>>
}
```

### Parameters

```typescript
interface ListParams {
  contentType?: string   // filter by content type
  group?: string         // filter by group
  release?: string       // filter by release
  limit?: number         // pagination
  offset?: number        // pagination
}

interface SearchParams {
  contentType?: string
  group?: string
  release?: string
  limit?: number
}
```

### Factory and helpers

- `getKnowledgeClient()` — returns a cached client instance. Tries service binding first (`env.KNOWLEDGE_SERVER`), falls back to stub client
- `safeCall(fn, fallback)` — wraps any async call with error handling, returns fallback on failure
- Aliases for backward compatibility: `getKnowledgeServer` → `getKnowledgeClient`, `safeRPC` → `safeCall`

In development without Worker bindings, `src/lib/rpc-stub.ts` provides a mock implementation with 7 sample documents covering pattern, playbook, tag, article, person, group, and project types.

## Type System

The `Document` interface (garden-facing, adapted from `R2Document` by `toDocument()`):

```typescript
interface Document {
  id: string
  type: ContentType
  category: TypeCategory
  title: string
  description?: string
  body: string
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

Note: The server's `R2Document` has a `path` field (e.g. `"data/resources/patterns/governance-primitives.md"`), but `toDocument()` currently drops it — the garden `Document` interface has no `path` field.

## Middleware

`src/middleware.ts` runs on every SSR request and adds:

- Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- Immutable cache headers for `/_astro/` static assets

## Markdown Processing

Two markdown pipelines exist:

1. **Build-time** (Astro's built-in) — configured in `astro.config.mjs` with remark-gfm, remark-wiki-link-plus, remark-obsidian, rehype-raw, rehype-callouts, rehype-slug
2. **Runtime** (`src/lib/markdown.ts`) — unified pipeline for rendering markdown body content from RPC responses. Uses the same remark/rehype plugins.

## Project Structure

```
src/
  components/
    layout/         BaseLayout, ContentLayout, Header, Footer, Sidebar
    content/        TypeBadge, ReleaseCard, BackLinks, TagList, ToC, etc.
    islands/        SearchBar, GraphView, DarkMode, DocsTreeNav, FilterPanel, PopoverPreview (React)
  pages/
    api/            search, graph, backlinks, docs-tree, preview
    docs/           BROKEN — uses getCollection on empty content/docs/
    [type]/         SSR content pages (index.astro + [id].astro)
    lexicon/        Redirect → /tag
    people/         Redirect → /person
    groups/         Redirect → /group
    projects/       Redirect → /project
    tags/           SSR tag pages
  lib/
    types.ts        Document, R2Document, ContentType, ListParams, SearchResult
    rpc.ts          getKnowledgeClient(), safeCall()
    rpc-stub.ts     Mock RPC with sample data
    markdown.ts     Runtime markdown renderer
  styles/
    global.css      Tailwind v4 @theme tokens
  content.config.ts Legacy — points to empty content/docs/
  loaders/          Dead code — only types.ts, imported nowhere
  middleware.ts     Security headers, cache control
content/            Legacy Quartz files — NOT used by Astro site
tests/
  lib/              Unit tests for rpc, markdown, types
  integration/      Build output verification (requires prior build)
```
