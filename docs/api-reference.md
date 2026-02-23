# API Reference

All API endpoints are SSR-only (`prerender = false`) and return JSON responses. Located in `src/pages/api/`.

## GET /api/search

Full-text search across all documents.

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

Returns graph data (nodes and links) for visualization.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `slug` | string | No | Center the graph on this document |

**Response:** `GraphData`

```json
{
  "nodes": [
    { "slug": "patterns/governance-primitives", "title": "Governance Primitives", "type": "pattern", "tags": ["governance"] }
  ],
  "links": [
    { "source": "patterns/governance-primitives", "target": "lexicon/dao" }
  ]
}
```

## GET /api/backlinks

Returns documents that link to the specified slug.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `slug` | string | Yes | Document to find backlinks for |

**Response:** `Array<{ slug: string, title: string }>`

```json
[
  { "slug": "playbooks/dao-governance", "title": "DAO Governance Playbook" }
]
```

## GET /api/docs-tree

Returns the hierarchical tree structure of the docs collection. Used by the DocsTreeNav sidebar component.

**Query Parameters:** None

**Response:** `TreeNode[]`

```json
[
  {
    "slug": "getting-started",
    "title": "getting started",
    "isFolder": true,
    "children": [
      {
        "slug": "getting-started/introduction",
        "title": "Introduction",
        "isFolder": false
      }
    ]
  }
]
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

## RPC Interface

The underlying `KnowledgeServerRPC` interface used by all endpoints:

```typescript
interface KnowledgeServerRPC {
  getDocument(slug: string): Promise<Document | null>;
  listDocuments(options?: ListOptions): Promise<Document[]>;
  getDocumentsByType(type: string, options?: ListOptions): Promise<Document[]>;
  searchKnowledge(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  getLinks(slug: string): Promise<GraphData>;
}

interface ListOptions {
  limit?: number;
  offset?: number;
  sort?: "title" | "created" | "modified";
  order?: "asc" | "desc";
}

interface SearchOptions {
  limit?: number;
  type?: string;
  tags?: string[];
}
```
