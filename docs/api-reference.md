# API Reference

All API endpoints are SSR-only (`prerender = false`) and return JSON responses. Located in `src/pages/api/`.

## GET /api/search

**Currently stubbed.** Returns empty results. Full-text search via Cloudflare AI is planned but not yet implemented.

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `q` | string | Yes (min 2 chars) | — | Search query |
| `type` | string | No | — | Filter by content type |
| `limit` | number | No | 20 | Max results |

**Current Response:** `{ items: [], total: 0 }`

**Errors:** Returns `400` if `q` is missing or less than 2 characters.

## GET /api/graph

**Currently a stub.** Returns empty graph data. Not yet implemented.

**Response:** `{ nodes: [], links: [] }`

## GET /api/backlinks

**Currently a stub.** Returns empty array. Not yet implemented.

**Response:** `[]`

## GET /api/docs-tree

Returns the hierarchical tree structure for docs navigation. Used by the DocsTreeNav sidebar component. Fetches all documents via the `knowledge` live collection, filters by `path.startsWith("docs/")`, then builds a tree from file paths.

**Query Parameters:** None

**Response:** `TreeNode[]`

```typescript
interface TreeNode {
  slug: string
  title: string
  isFolder: boolean
  children?: TreeNode[]
}
```

## GET /api/preview

Returns minimal document data for link preview popovers.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Content type |
| `id` | string | Yes | Document ID |

**Response:**

```json
{
  "title": "Governance Primitives",
  "description": "A framework for...",
  "type": "pattern",
  "tags": ["governance", "dao"]
}
```

**Errors:** Returns `404` if the document is not found.

## Data Layer

API endpoints access content through Astro v6 live collections (`getLiveCollection` / `getLiveEntry` from `astro:content`). The underlying data is stored in the `KNOWLEDGE_BUCKET` R2 bucket. See [architecture.md](architecture.md) for details.
