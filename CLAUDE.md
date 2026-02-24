# Claude Project Instructions

## Project Overview

SuperBenefit Knowledge Garden — an Astro v6 hybrid site deployed on Cloudflare Workers.

- **SSR content**: All content types (patterns, articles, people, groups, projects, tags, etc.) served at runtime via RPC to a knowledge-server Worker (falls back to stub client in local dev)
- **Docs section (BROKEN)**: `src/pages/docs/` uses `getCollection("docs")` from `astro:content`, reading from an empty `content/docs/` directory (Quartz leftover). Produces no output. **Fix in progress.**
- **React islands**: Search, graph visualization, dark mode (client-side hydrated)
- **Tailwind v4**: CSS with custom `@theme` tokens in `src/styles/global.css`

## Key Architecture

### Content Delivery

| Route | Source | Rendering | Status |
|-------|--------|-----------|--------|
| `/[type]/` | knowledge-server RPC | SSR (`prerender = false`) | **Working** |
| `/docs/` | `content/docs/**/*.md` via `getCollection` | Build-time (prerendered) | **BROKEN** — empty source dir |
| `/api/docs-tree` | `content/docs/` via `getCollection` | SSR | **BROKEN** — returns empty tree |
| `/api/search`, `/api/preview` | knowledge-server RPC | SSR | Working |
| `/api/backlinks` | Stub | SSR | Returns `[]` (not yet supported) |
| `/api/graph` | Stub | SSR | Returns `{ nodes: [], links: [] }` (not yet supported) |

### File Organization

```
src/
  components/
    layout/       # BaseLayout, ContentLayout, Header, Footer, Sidebar
    content/      # TypeBadge, ReleaseCard, BackLinks, TagList, ToC, etc.
    islands/      # SearchBar, GraphView, DarkMode, DocsTreeNav, FilterPanel, PopoverPreview (React)
  pages/
    api/          # search, graph, backlinks, docs-tree, preview
    docs/         # BROKEN — uses getCollection on empty content/docs/
    [type]/       # SSR content pages — index.astro + [id].astro
    lexicon/      # Redirect → /tag
    people/       # Redirect → /person
    groups/       # Redirect → /group
    projects/     # Redirect → /project
    tags/         # SSR tag pages
  lib/
    types.ts      # Document, R2Document, ContentType, ListParams, SearchResult
    rpc.ts        # getKnowledgeClient(), safeCall() (aliases: getKnowledgeServer, safeRPC)
    rpc-stub.ts   # Mock RPC with sample data (7 documents)
    markdown.ts   # Unified pipeline for runtime markdown (remark/rehype)
  styles/
    global.css    # Tailwind v4 @theme tokens
  content.config.ts   # Legacy — defines docs/folders collections pointing to empty content/docs/
  loaders/            # Dead code — only types.ts, imported nowhere
  middleware.ts       # Security headers, cache control for /_astro/ assets
content/              # Legacy Quartz files (artifacts/, notes/, tags/, links/) — NOT used by Astro site
                      # content/docs/ is empty
```

### RPC Client (`src/lib/rpc.ts`)

```typescript
interface KnowledgeClient {
  getDocument(contentType: string, id: string): Promise<Document | null>
  listEntries(params?: ListParams): Promise<ListResponse>
  search(query: string, opts?: SearchParams): Promise<{ items: SearchResult[]; total: number }>
  listGroups(): Promise<Array<{ id: string; title: string; description?: string }>>
  listReleases(): Promise<Array<{ id: string; title: string; description?: string }>>
}

interface ListParams {
  contentType?: string
  group?: string
  release?: string
  limit?: number
  offset?: number
}

interface ListResponse { data: Document[]; total: number }
```

Factory: `getKnowledgeClient()` returns a cached client. Tries service binding (`env.KNOWLEDGE_SERVER`) first, falls back to stub.

### Key Patterns

- **SSR pages**: Use `export const prerender = false` + `Astro.response.status = 404` (not `return new Response(...)` — esbuild can't parse top-level returns with exports)
- **Optional props**: Use conditional spread `{...(val != null && { prop: val })}` (strict `exactOptionalPropertyTypes` is enabled)
- **RPC calls**: Always wrap with `safeCall(() => client.method(), fallback)` for graceful degradation
- **Type system**: ~22 content types grouped into categories: resource (pattern, practice, primitive, protocol, playbook), story (study, article, guide), reference (index, link, tag), data (person, group, project, place, gathering), plus file and question

## Prerequisites

- Node.js >= 22 (required by Astro v6)
- npm

## Setup

```bash
npm install
```

## Commands

```bash
npm run dev       # Astro dev server (port 4321)
npm run build     # Production build
npm run check     # TypeScript checking (astro check)
npm run test      # Vitest test suite
npm run preview   # Preview production build
```

## Testing

```bash
npm run test                              # Run all tests
npx vitest run tests/lib/rpc-stub.test.ts # Single file
npx vitest                                # Watch mode
```

Tests live in `tests/`. Integration tests (`tests/integration/`) are skipped by default — they require a prior `npm run build`.

## Git and Commit Policy

**CRITICAL**: NEVER commit changes unless EXPLICITLY instructed by the user.

## Process Management

**NEVER USE BLANKET KILL COMMANDS** like `taskkill /F /IM node.exe` or `pkill node` — these kill ALL Node processes including Claude's own. Always kill by specific PID.

## Important Links

- Project Repository: https://github.com/superbenefit/knowledge-garden
- Astro v6 Docs: https://docs.astro.build/
- Cloudflare Workers: https://developers.cloudflare.com/workers/
