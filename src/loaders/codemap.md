# src/loaders/

## Responsibility

Provides the Astro v6 live collection loader that reads JSON documents from the Cloudflare R2 `KNOWLEDGE_BUCKET` binding. This is the sole data-access layer -- all content enters the application through this loader. It supports both bulk listing (for index pages) and single-entry fetching (for detail pages).

## Design Patterns

Implements the Astro live collection loader interface with two methods: `loadCollection()` for bulk retrieval and `loadEntry()` for single-document access. Uses the `@superbenefit/knowledge-schemas` `R2Document` type to parse JSON from R2 objects. Body content is intentionally omitted in `loadCollection()` responses (set to empty string) to keep listing payloads lightweight; full body is only loaded via `loadEntry()` on demand.

## Data & Control Flow

`loadCollection()` issues two parallel `bucket.list()` calls against the `content/` and `indexes/` prefixes, then fetches and JSON-parses each object in parallel via `Promise.all`. Results are returned as `{ id: key, data: { ...metadata, contentType, path, body: "" } }` entries. `loadEntry({ filter: { id } })` fetches a single R2 object by its full key (e.g. `content/pattern/some-id.json`), parses it, and returns the entry with `body: doc.content` populated. Both methods access R2 through the `env.KNOWLEDGE_BUCKET` binding imported from `cloudflare:workers`.

## Integration Points

Registered as the loader for the `"knowledge"` live collection in `src/live.config.ts` via `defineLiveCollection({ loader: r2KnowledgeLoader() })`. Pages and API routes access its data indirectly through `getLiveCollection("knowledge")` and `getLiveEntry("knowledge", key)` from `astro:content`. Depends on the `KNOWLEDGE_BUCKET` R2 binding configured in `wrangler.jsonc` and the `@superbenefit/knowledge-schemas` package for the `R2Document` type contract.
