# Claude Project Instructions

## Project Overview

SuperBenefit Knowledge Garden — an Astro v6 hybrid site deployed on Cloudflare Workers.

- **SSR content**: All content types (patterns, articles, people, groups, projects, tags, etc.) served at runtime from R2 via Astro v6 live collections (`getLiveCollection` / `getLiveEntry`)
- **Docs section**: Published KB files under `docs/` filtered by `path.startsWith("docs/")` from the same live collection, rendered as SSR pages
- **React islands**: Search, graph visualization, dark mode (client-side hydrated)
- **Tailwind v4**: CSS with custom `@theme` tokens in `src/styles/global.css`

## Key Architecture

### Content Delivery

| Route | Source | Rendering | Status |
|-------|--------|-----------|--------|
| `/[type]/` | R2 live collection (filter by `contentType`) | SSR (`prerender = false`) | Working |
| `/docs/` | R2 live collection (filter by `path.startsWith("docs/")`) | SSR (`prerender = false`) | Working |
| `/api/docs-tree` | R2 live collection (filter by path prefix) | SSR | Working |
| `/api/search` | Stub | SSR | Returns `{ items: [], total: 0 }` (TODO: CF AI Search) |
| `/api/preview` | R2 live entry (`getLiveEntry`) | SSR | Working |
| `/api/backlinks` | Stub | SSR | Returns `[]` (not yet implemented) |
| `/api/graph` | Stub | SSR | Returns `{ nodes: [], links: [] }` (not yet implemented) |

### File Organization

```
src/
  components/
    layout/       # BaseLayout, ContentLayout, Header, Footer, Sidebar
    content/      # TypeBadge, ReleaseCard, BackLinks, TagList, ToC, etc.
    islands/      # SearchBar, GraphView, DarkMode, DocsTreeNav, FilterPanel, PopoverPreview (React)
  pages/
    api/          # search, graph, backlinks, docs-tree, preview
    attachments/  # Serves binary assets (images, PDFs) from R2 attachments/ prefix
    docs/         # SSR docs pages — index.astro + [...slug].astro (path-filtered from R2)
    [type]/       # SSR content pages — index.astro + [id].astro
    lexicon/      # Redirect → /tag
    people/       # Redirect → /person
    groups/       # Redirect → /group
    projects/     # Redirect → /project
    tags/         # SSR tag pages
  lib/
    types.ts      # Document, ContentType, fromCollectionEntry adapter
    docs-tree.ts  # TreeNode interface + buildTree() for docs navigation
    markdown.ts   # Unified pipeline for runtime markdown (remark/rehype)
  loaders/
    r2-knowledge-loader.ts  # Astro live collection loader reading from R2 bucket
  live.config.ts  # Defines "knowledge" collection via defineLiveCollection
  styles/
    global.css    # Tailwind v4 @theme tokens
  middleware.ts   # Security headers, cache control for /_astro/ assets
```

### Live Collection Loader (`src/loaders/r2-knowledge-loader.ts`)

The loader reads JSON documents from the `KNOWLEDGE_BUCKET` R2 binding (prefixes `content/` and `indexes/`):

- `loadCollection()` — lists all R2 objects from both prefixes, returns entries with metadata (body omitted for performance)
- `loadEntry({ filter: { id } })` — fetches a single R2 object by key, returns full entry including body content

Configured in `src/live.config.ts`:

```typescript
const knowledge = defineLiveCollection({
  loader: r2KnowledgeLoader(),
});
export const collections = { knowledge };
```

Pages access data via:
- `getLiveCollection("knowledge")` — returns all entries (no body content)
- `getLiveEntry("knowledge", "content/{type}/{id}.json")` — returns single entry with body
- `fromCollectionEntry(id, data)` — adapts entry data to garden `Document` interface

### Key Patterns

- **SSR pages**: Use `export const prerender = false` + `Astro.response.status = 404` (not `return new Response(...)` — esbuild can't parse top-level returns with exports)
- **No early returns in Astro frontmatter**: Never use `return;` in `.astro` frontmatter — Astro compiles it to `throw ;` which breaks esbuild dependency scanning. Instead, wrap the template in `{condition && (<markup />)}`
- **Optional props**: Use conditional spread `{...(val != null && { prop: val })}` (strict `exactOptionalPropertyTypes` is enabled)
- **Data loading**: Pages use `getLiveCollection("knowledge")` for listings and `getLiveEntry("knowledge", key)` for detail pages, wrapped in try/catch for graceful degradation
- **Docs pages**: Filter collection entries by `d.path?.startsWith("docs/")`, derive URL slug from `d.path` by stripping prefix/suffix
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
npm run dev       # Astro dev server (port 4321) — reads live R2 data (remote: true)
npm run build     # Production build
npm run check     # TypeScript checking (astro check)
npm run test      # Vitest test suite
npm run preview   # Preview production build
```

## Testing

```bash
npm run test                              # Run all tests
npx vitest run tests/lib/types.test.ts    # Single file
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
