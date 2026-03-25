# src/pages/attachments/

## Responsibility

Serves binary attachments (images, PDFs, videos) stored in the R2 bucket under the `attachments/` prefix. This is the static asset delivery layer for content-embedded media -- markdown documents reference images and files via `/attachments/...` URLs, and this catch-all route resolves them from R2 at request time.

## Design Patterns

Uses Astro's rest parameter route (`[...path].ts`) to capture the full attachment path as a single param. A static `mimeTypes` lookup maps file extensions to MIME types, falling back to `application/octet-stream` for unknown extensions. Responses include aggressive caching headers (`max-age=86400, immutable`) since attachments are content-addressed and rarely change, plus `X-Content-Type-Options: nosniff` for security.

## Data & Control Flow

The incoming request path (e.g. `/attachments/images/diagram.webp`) is extracted from `params.path`, prefixed with `attachments/` to form the R2 key, and fetched via `env.KNOWLEDGE_BUCKET.get()`. If the object exists, its body is streamed directly as the response with the appropriate content type. Missing objects return a 404 with no body. No transformation or processing is applied to the binary data.

## Integration Points

Depends on the `KNOWLEDGE_BUCKET` R2 binding from `cloudflare:workers` (same bucket as the content loader). Referenced by rendered markdown content -- when `markdown.ts` processes Obsidian-style image embeds or links, the resulting HTML points to `/attachments/...` paths. Supports the file types used in the knowledge base: webp, png, jpg, jpeg, gif, svg, pdf, and mp4.
