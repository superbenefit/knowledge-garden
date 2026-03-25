# src/

## Responsibility

Application root for the Astro v6 Knowledge Garden. Contains the foundational configuration files that wire together the content pipeline, runtime environment, and global styling. `live.config.ts` defines the single `knowledge` live collection backed by the R2 loader. `middleware.ts` adds security headers and immutable caching for hashed assets. `env.d.ts` declares the Cloudflare Workers bindings (`KNOWLEDGE_BUCKET: R2Bucket`, `AI: Ai`). `modules.d.ts` provides ambient type declarations for untyped packages (`cloudflare:workers`, `remark-obsidian`, `remark-wiki-link-plus`). `styles/global.css` defines the full design system: Tailwind v4 `@theme` tokens, three-column CSS grid layout, dark mode color overrides, component base styles (header, sidebar, footer, cards, callouts, mobile drawer), and responsive breakpoints.

## Design Patterns

- **Single collection, query-time filtering**: Rather than defining separate collections per content type, `live.config.ts` configures one `knowledge` collection. Pages filter by `contentType`, `path` prefix, or `tags` at query time. This keeps the loader simple and avoids R2 key structure coupling.
- **Loader abstraction**: `defineLiveCollection` from `astro:content` accepts the custom `r2KnowledgeLoader()` which implements `loadCollection()` (listing without body) and `loadEntry()` (single document with body). The loader lives in `src/loaders/` and reads from the `KNOWLEDGE_BUCKET` R2 binding.
- **Middleware-as-security-layer**: `middleware.ts` uses `defineMiddleware` to set `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy` on all responses, plus year-long immutable caching for `/_astro/` hashed assets.
- **CSS-native design tokens**: `global.css` uses Tailwind v4's `@theme` block for custom properties (`--font-header`, `--color-secondary`, `--sidebar-width`, etc.) instead of a JS config. Dark mode overrides reassign the same custom properties under `html.dark`, enabling automatic theme switching without class toggling on individual elements.

## Data & Control Flow

At build/dev time, Astro discovers `live.config.ts` and registers the `knowledge` collection. At request time, pages import `getLiveCollection` / `getLiveEntry` from `astro:content`, which delegates to the R2 loader. The loader reads JSON documents from R2 (prefixes `content/` and `indexes/`), parses them as `R2Document` (from `@superbenefit/knowledge-schemas`), and returns entry objects with metadata. `middleware.ts` intercepts every response to append headers. `global.css` is imported by `BaseLayout.astro` and applies globally.

## Integration Points

- **`src/loaders/r2-knowledge-loader.ts`** -- the R2 loader factory consumed by `live.config.ts`
- **`@superbenefit/knowledge-schemas`** -- provides the `R2Document` type for R2 JSON document structure
- **`cloudflare:workers`** -- `env.KNOWLEDGE_BUCKET` R2 binding used by the loader and attachment route
- **`astro:content`** -- `defineLiveCollection` registers the collection; `getLiveCollection`/`getLiveEntry` are the query APIs used by pages and components
- **`astro:middleware`** -- `defineMiddleware` used by `middleware.ts`
- **`src/components/layout/BaseLayout.astro`** -- imports `styles/global.css`, making all design tokens available application-wide
- **Tailwind v4** -- integrated via `@tailwindcss/vite` plugin in `astro.config.mjs`; utility classes available alongside custom properties
