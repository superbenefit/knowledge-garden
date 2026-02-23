# Claude Project Instructions

## Project Overview

SuperBenefit Knowledge Garden — an Astro v6 hybrid site deployed on Cloudflare Workers.

- **Build-time content**: Markdown docs in `content/docs/` via Astro content collections
- **Live content**: Lexicon, people, groups, projects via RPC to a knowledge-server Worker (currently using stub)
- **React islands**: Search, graph visualization, dark mode (client-side hydrated)
- **Tailwind v4**: CSS with custom `@theme` tokens in `src/styles/global.css`

## Key Architecture

### Content Split

| Collection | Source | Rendering |
|-----------|--------|-----------|
| `docs` | `content/docs/**/*.md` (glob) | Build-time (prerendered) |
| `folders` | `content/*/index.md` (glob) | Build-time (folder metadata) |
| lexicon, people, groups, projects | knowledge-server RPC | SSR (`prerender = false`) |

### File Organization

```
src/
  components/
    layout/       # BaseLayout, ContentLayout, Header, Footer, Sidebar
    content/      # TypeBadge, ReleaseCard, BackLinks, TagList, ToC, etc.
    islands/      # SearchBar, GraphView, DarkMode, DocsTreeNav (React)
  pages/
    api/          # search, graph, backlinks, docs-tree, preview
    docs/         # [slug].astro — build-time doc pages
    lexicon/      # SSR detail pages
    people/       # SSR detail pages
    groups/       # SSR detail pages
    projects/     # SSR detail pages
    tags/         # SSR tag pages
  lib/
    types.ts      # Document, ContentType, SearchResult
    rpc.ts        # getKnowledgeServer(), safeRPC()
    rpc-stub.ts   # Mock RPC with sample data
    markdown.ts   # Unified pipeline for runtime markdown
  styles/
    global.css    # Tailwind v4 @theme tokens
  content.config.ts   # Build-time collections (docs, folders)
  live.config.ts      # Live collections (lexicon, people, groups, projects)
  loaders/            # LiveLoader for knowledge-server
```

### Key Patterns

- **SSR pages**: Use `export const prerender = false` + `Astro.response.status = 404` (not `return new Response(...)` — esbuild can't parse top-level returns with exports)
- **Optional props**: Use conditional spread `{...(val != null && { prop: val })}` (strict `exactOptionalPropertyTypes` is enabled)
- **RPC calls**: Always wrap with `safeRPC(() => server.method(), fallback)` for graceful degradation
- **Type system**: 13 content types in a 3-tier hierarchy: note → artifact/reference → specific types

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
