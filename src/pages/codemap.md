# src/pages/

## Responsibility

SSR route layer for the Knowledge Garden. Every page sets `prerender = false` (implicit in `output: "server"` mode) and fetches content at request time from R2 via `getLiveCollection` / `getLiveEntry`. Top-level pages handle the home view (`index.astro`), full-page search (`search.astro`), graph placeholder (`graph.astro`), and error states (`404.astro`, `500.astro`). Subdirectories implement content type listings, doc navigation, tag browsing, API endpoints, attachment serving, and legacy redirects.

## Design Patterns

- **Dynamic routing via `[type]` and `[...slug]`**: `[type]/index.astro` validates the type param with `isContentType()` and renders type-specific listing UIs (concept grid for tags, link cards for links, generic list for others). `[type]/[id].astro` fetches a single entry with `getLiveEntry` and renders the full document with runtime markdown. `docs/[...slug].astro` uses a catch-all route to handle nested doc paths and folder index pages.
- **No early returns in frontmatter**: Invalid params set `Astro.response.status = 404` then conditionally render error markup in the template, avoiding the esbuild `return` parsing issue.
- **API stubs with graceful degradation**: `api/search.ts`, `api/graph.ts`, and `api/backlinks.ts` return empty-but-valid JSON so client islands never break. `api/docs-tree.ts` and `api/preview.ts` are fully functional, reading from the live collection.
- **301 redirects for renamed routes**: `lexicon/`, `people/`, `groups/`, `projects/` each contain a one-line `index.astro` that calls `Astro.redirect()` to the canonical singular-form route (`/tag`, `/person`, `/group`, `/project`).

## Data & Control Flow

Requests hit Astro's server-side router on Cloudflare Workers. Pages call `getLiveCollection("knowledge")` to list entries (body omitted for performance) or `getLiveEntry("knowledge", key)` to fetch a single entry with its full markdown body. Collection data is adapted via `fromCollectionEntry()` into `Document` objects, then filtered by type, path prefix, or tag. For docs and content detail pages, markdown bodies are rendered at request time through the unified pipeline (`renderMarkdown`), and headings are extracted for the table of contents sidebar. The `attachments/[...path].ts` endpoint reads binary assets directly from the `KNOWLEDGE_BUCKET` R2 binding with appropriate MIME types and caching headers.

## Integration Points

- **`astro:content`** (`getLiveCollection`, `getLiveEntry`) -- the Astro v6 live collections API backed by `src/loaders/r2-knowledge-loader.ts`
- **`src/lib/types.ts`** -- `fromCollectionEntry`, `isContentType`, `TYPE_LABELS`, `Document` interface
- **`src/lib/markdown.ts`** -- `renderMarkdown`, `extractHeadings` for SSR markdown rendering
- **`src/lib/docs-tree.ts`** -- `buildTree` for hierarchical doc navigation
- **`src/components/layout/ContentLayout.astro`** -- wraps every page with header, sidebars, footer
- **`src/components/content/*`** -- TypeBadge, TagList, ContentMeta, Breadcrumbs, TableOfContents, BannerImage, ContentRenderer, ReleaseContents used by detail/listing pages
- **`src/components/islands/SearchPageClient.tsx`** -- hydrated on `/search` via `client:load`
- **`cloudflare:workers`** -- `env.KNOWLEDGE_BUCKET` R2 binding used directly by `attachments/[...path].ts`
