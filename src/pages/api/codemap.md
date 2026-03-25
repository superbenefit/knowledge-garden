# src/pages/api/

## Responsibility

Server-side JSON API endpoints that power the React islands. Five routes: `docs-tree` (returns hierarchical tree of docs-prefixed entries), `preview` (returns lightweight document metadata for hover popovers), `search` (stubbed -- will use CF AI Search), `graph` (stubbed -- returns empty graph), and `backlinks` (stubbed -- returns empty array). Only `docs-tree` and `preview` are fully implemented; the other three are placeholder endpoints that return valid empty responses so client components degrade gracefully.

## Design Patterns

All endpoints export a `GET: APIRoute` handler following Astro's API route convention. Responses are always JSON with explicit `Content-Type` headers. Implemented endpoints use `getLiveCollection` / `getLiveEntry` from `astro:content` to access R2 data through the live collection, then adapt results using `fromCollectionEntry()`. Stubbed endpoints return structurally valid empty payloads (`{ items: [], total: 0 }`, `[]`, `{ nodes: [], links: [] }`) so consumers never need to handle missing endpoints.

## Data & Control Flow

`docs-tree`: calls `getLiveCollection("knowledge")`, adapts all entries via `fromCollectionEntry()`, filters to `path.startsWith("docs/")`, derives slug from path, then passes through `buildTree()` to produce nested `TreeNode[]`. `preview`: reads `type` and `id` query params, calls `getLiveEntry("knowledge", "content/{type}/{id}.json")`, adapts the entry, and returns a trimmed payload (title, description, type, first 5 tags). `search`: reads `q` param but currently returns empty results. All responses are wrapped in try/catch with fallback empty payloads.

## Integration Points

Consumed by React islands: `DocsTreeNav` fetches `/api/docs-tree`, `PopoverPreview` fetches `/api/preview`, `SearchBar` fetches `/api/search`, `GraphView` would fetch `/api/graph`. Depends on `astro:content` (`getLiveCollection`, `getLiveEntry`), `@/lib/types` (`fromCollectionEntry`), and `@/lib/docs-tree` (`buildTree`). Runs as SSR on Cloudflare Workers -- each request hits R2 through the live collection loader.
