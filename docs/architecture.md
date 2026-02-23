# Architecture

## Overview

The Knowledge Garden is an Astro v6 hybrid site deployed on Cloudflare Workers. It combines build-time static generation for markdown docs with server-side rendering for live content served by a knowledge-server Worker.

## Content Split

| Collection | Source | Rendering | When |
|-----------|--------|-----------|------|
| `docs` | `content/docs/**/*.md` | Pre-rendered (static) | Build time |
| `folders` | `content/*/index.md` | Pre-rendered (static) | Build time |
| lexicon | knowledge-server RPC | SSR | Request time |
| people | knowledge-server RPC | SSR | Request time |
| groups | knowledge-server RPC | SSR | Request time |
| projects | knowledge-server RPC | SSR | Request time |

Build-time collections are defined in `src/content.config.ts` using Astro's `glob()` loader. Live collections are defined in `src/live.config.ts` using a custom `knowledgeServerLoader`.

## Rendering Strategy

**Static pages** (default) are pre-rendered at build time and served as HTML from Cloudflare's edge cache. This includes the homepage, docs pages, graph page, and error pages.

**SSR pages** opt in with `export const prerender = false` and are rendered on each request by the Cloudflare Worker. All live content pages (lexicon, people, groups, projects, tags, search) use SSR.

**React islands** provide client-side interactivity within otherwise static pages. Components like SearchBar, GraphView, and DarkMode are hydrated on the client using Astro's `client:load` or `client:only="react"` directives.

## RPC Layer

The knowledge-server is a separate Cloudflare Worker accessed via service bindings. The RPC interface (`KnowledgeServerRPC`) provides:

- `getDocument(slug)` — fetch a single document
- `listDocuments(options?)` — list all documents with pagination/sorting
- `getDocumentsByType(type, options?)` — filter by content type
- `searchKnowledge(query, options?)` — full-text search
- `getLinks(slug)` — graph data (nodes + links)

In development, `src/lib/rpc-stub.ts` provides a mock implementation with sample data. The `safeRPC(fn, fallback)` helper wraps all RPC calls with error handling.

## Type System

Content follows a 3-tier hierarchy:

```
note (base)
├── artifact
│   ├── pattern
│   ├── playbook
│   ├── article
│   ├── study
│   ├── guide
│   └── protocol
└── reference
    ├── link
    ├── tag
    └── index
```

Every document has a `type` (specific) and `category` (one of note, artifact, reference). Components like TypeBadge render differently based on category.

## Middleware

`src/middleware.ts` runs on every SSR request and adds:

- Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- Immutable cache headers for `/_astro/` static assets

## Markdown Processing

Two markdown pipelines exist:

1. **Build-time** (Astro's built-in) — configured in `astro.config.mjs` with remark-gfm, remark-wiki-link-plus, remark-obsidian, rehype-raw, rehype-callouts, rehype-slug
2. **Runtime** (`src/lib/markdown.ts`) — a simplified unified pipeline for rendering markdown body content from RPC responses

## Project Structure

```
src/
  components/
    layout/         BaseLayout, ContentLayout, Header, Footer, Sidebar
    content/        TypeBadge, ReleaseCard, BackLinks, TagList, ToC, etc.
    islands/        SearchBar, GraphView, DarkMode, DocsTreeNav (React)
  pages/
    api/            search, graph, backlinks, docs-tree, preview
    docs/           Build-time doc pages
    lexicon/        SSR lexicon pages
    people/         SSR people pages
    groups/         SSR group pages
    projects/       SSR project pages
    tags/           SSR tag pages
  lib/
    types.ts        Document, ContentType, SearchResult, GraphData
    rpc.ts          getKnowledgeServer(), safeRPC()
    rpc-stub.ts     Mock RPC with sample data
    markdown.ts     Runtime markdown renderer
  styles/
    global.css      Tailwind v4 @theme tokens
  content.config.ts Build-time collections
  live.config.ts    Live collections
  loaders/          LiveLoader for knowledge-server
  middleware.ts     Security headers, cache control
content/
  docs/             Markdown docs (build-time)
  artifacts/        Knowledge artifacts (served by knowledge-server)
  notes/            Working notes (served by knowledge-server)
  tags/             Tag index files
  links/            External links
  attachments/      Images and files
tests/
  lib/              Unit tests for rpc, markdown, types
  integration/      Build output verification
```
