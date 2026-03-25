# src/components/islands/

## Responsibility

Client-side React islands hydrated via Astro's `client:*` directives, providing all interactive UI in the otherwise SSR-rendered site. Seven components: `SearchBar` (debounced typeahead with dropdown), `SearchPageClient` (full-page search with filters and URL sync), `FilterPanel` (content-type dropdown + tag chip toggles), `DocsTreeNav` (collapsible sidebar tree with localStorage persistence), `GraphView` (D3 force-directed graph visualization), `PopoverPreview` (hover-triggered document preview popover), and `DarkMode` (theme toggle with system preference detection).

## Design Patterns

Each island is a self-contained default-export React component with no shared state between islands -- they communicate only through the DOM or API calls. `SearchPageClient` composes `SearchBar` and `FilterPanel` via props/callbacks (lifted state pattern). `PopoverPreview` uses a global event delegation pattern -- it attaches `mouseover`/`mouseout` listeners to `document` and targets any element with a `data-preview-slug` attribute, rendering into a dynamically created DOM element. `DocsTreeNav` can self-fetch from `/api/docs-tree` when no `items` prop is provided, making it usable with or without server-side data. `GraphView` wraps D3 imperatively inside `useEffect`, managing the simulation lifecycle with cleanup on unmount.

## Data & Control Flow

Islands fetch data from internal API routes: `SearchBar` calls `/api/search?q=...&type=...&tags=...`, `DocsTreeNav` calls `/api/docs-tree`, `PopoverPreview` calls `/api/preview?type=...&id=...`. Results are cached in component state (or a module-level `Map` for `PopoverPreview`). `SearchPageClient` syncs filter state bidirectionally with URL search params via `window.history.replaceState`. `GraphView` receives `GraphData` (nodes + links) as props and renders via D3 force simulation with zoom/pan/drag. `DarkMode` reads/writes `localStorage("theme")` and toggles the `dark` class on `document.documentElement`.

## Integration Points

All islands import types from `@/lib/types` (`ContentType`, `SearchResult`, `GraphData`, `TYPE_LABELS`, `ALL_CONTENT_TYPES`). They depend on the `/api/*` endpoints for data. `GraphView` depends on the `d3` npm package. Astro pages embed these components with `client:load` or `client:idle` directives. `PopoverPreview` integrates with any server-rendered HTML that includes `data-preview-slug` attributes on links. Navigation uses direct `window.location.href` assignments to `/{type}/{id}` or `/docs/{slug}` routes.
