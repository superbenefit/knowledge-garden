# API Reference

All API endpoints are SSR-only (`prerender = false`) and return JSON responses. Located in `src/pages/api/`.

## GET /api/search

Full-text search across all documents via the knowledge-server.

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `q` | string | Yes (min 2 chars) | — | Search query |
| `type` | string | No | — | Filter by content type |
| `tags` | string | No | — | Comma-separated tag filter |
| `limit` | number | No | 20 | Max results |

**Response:** `SearchResult[]`

```json
[
  {
    "slug": "patterns/governance-primitives",
    "title": "Governance Primitives",
    "description": "A framework for...",
    "type": "pattern",
    "score": 0.95,
    "highlights": ["matching text"]
  }
]
```

**Errors:** Returns `400` if `q` is missing or less than 2 characters.

## GET /api/graph

**Currently a stub.** Returns empty graph data. Graph visualization is not yet supported by the knowledge-server.

**Response:** `{ nodes: [], links: [] }`

## GET /api/backlinks

**Currently a stub.** Returns empty array. Backlink data is not yet supported by the knowledge-server.

**Response:** `[]`

## GET /api/docs-tree

Returns the hierarchical tree structure for docs navigation. Used by the DocsTreeNav sidebar component.

**Currently broken:** Uses `getCollection("docs")` from `astro:content`, which reads from the empty `content/docs/` directory. Always returns an empty tree.

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
| `slug` | string | Yes | Document slug |

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

## RPC Client Interface

The garden accesses the knowledge-server via `KnowledgeClient` (defined in `src/lib/rpc.ts`):

```typescript
interface KnowledgeClient {
  getDocument(contentType: string, id: string): Promise<Document | null>
  listEntries(params?: ListParams): Promise<ListResponse>
  search(query: string, opts?: SearchParams): Promise<{ items: SearchResult[]; total: number }>
  listGroups(): Promise<Array<{ id: string; title: string; description?: string }>>
  listReleases(): Promise<Array<{ id: string; title: string; description?: string }>>
}

interface ListParams {
  contentType?: string   // filter by content type
  group?: string         // filter by group
  release?: string       // filter by release
  limit?: number         // pagination
  offset?: number        // pagination
}

interface ListResponse {
  data: Document[]
  total: number
}

interface SearchParams {
  contentType?: string
  group?: string
  release?: string
  limit?: number
}
```

Factory: `getKnowledgeClient()` returns a cached client. Falls back to `createStubClient()` if the `KNOWLEDGE_SERVER` service binding is unavailable.

Helper: `safeCall(fn, fallback)` wraps async calls with error handling.
