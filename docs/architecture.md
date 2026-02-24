# Architecture

## Overview

The Knowledge Garden is an Astro v6 hybrid site deployed on Cloudflare Workers. All content is served at runtime via RPC to a knowledge-server Worker using service bindings.

## Content Delivery

| Route | Source | Rendering | Status |
|-------|--------|-----------|--------|
| `/[type]/` | knowledge-server RPC | SSR (`prerender = false`) | Working |
| `/docs/` | knowledge-server RPC (`sourcePath: "docs/"`) | SSR (`prerender = false`) | Working |
| `/api/docs-tree` | knowledge-server RPC (`sourcePath: "docs/"`) | SSR | Working |
| `/api/search`, `/api/preview` | knowledge-server RPC | SSR | Working |
| `/api/backlinks` | Stub | SSR | Returns `[]` (not yet implemented) |
| `/api/graph` | Stub | SSR | Returns `{ nodes: [], links: [] }` (not yet implemented) |

## Rendering Strategy

**SSR pages** (most of the site) opt in with `export const prerender = false` and are rendered on each request by the Cloudflare Worker:
- `src/pages/[type]/index.astro` and `src/pages/[type]/[id].astro` handle all content types
- `src/pages/docs/index.astro` and `src/pages/docs/[...slug].astro` handle the docs section via `sourcePath` filter

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
  sourcePath?: string    // filter by R2Document.path prefix, e.g. "docs/"
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

In development without Worker bindings, `src/lib/rpc-stub.ts` provides a mock implementation with 11 sample documents covering pattern, playbook, tag, article, person, group, project, and docs-section types.

The knowledge-server's own REST API is documented in the knowledge-server repository at `src/api/README.md`. The WorkerEntrypoint RPC interface (including `getDocumentByPath`) is documented at `src/README.md` in that repo.

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

The server's `R2Document` has a `path` field (e.g. `"data/resources/patterns/governance-primitives.md"`). `toDocument()` preserves it as an optional `path` field on `Document`. The docs section uses this path to derive URL slugs and determine section membership.

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
    docs/           SSR docs pages (index.astro + [...slug].astro) via RPC sourcePath filter
    [type]/         SSR content pages (index.astro + [id].astro)
    lexicon/        Redirect → /tag
    people/         Redirect → /person
    groups/         Redirect → /group
    projects/       Redirect → /project
    tags/           SSR tag pages
  lib/
    types.ts        Document, R2Document, ContentType, ListParams, SearchResult
    rpc.ts          getKnowledgeClient(), safeCall()
    rpc-stub.ts     Mock RPC with sample data (11 documents incl. 4 docs-section)
    markdown.ts     Runtime markdown renderer
  styles/
    global.css      Tailwind v4 @theme tokens
  middleware.ts     Security headers, cache control
tests/
  lib/              Unit tests for rpc, markdown, types
  integration/      Build output verification (requires prior build)
```
