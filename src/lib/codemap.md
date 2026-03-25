# src/lib/

## Responsibility

Shared types, data adapters, and rendering utilities consumed by pages, API routes, and islands. `types.ts` defines the `Document` model and ~22 `ContentType` variants grouped into categories (resource, story, reference, data, question, file). `docs-tree.ts` builds a hierarchical `TreeNode[]` from flat collection entries for sidebar navigation. `markdown.ts` provides a unified remark/rehype pipeline that converts Obsidian-flavored markdown to HTML at request time.

## Design Patterns

The type system mirrors the knowledge-server's canonical content types, with grouped constants (`RESOURCE_TYPES`, `STORY_TYPES`, etc.) and a `getCategory()` function for O(1) category lookup. `fromCollectionEntry()` is the single adapter that normalizes raw R2 collection entry data into the garden's `Document` interface, extracting the document ID from the R2 key path. `buildTree()` uses a folder-map accumulator pattern -- it walks sorted entries, lazily creates ancestor folder nodes, and promotes leaf-to-folder when a deeper entry forces it.

## Data & Control Flow

R2 entries flow in via `fromCollectionEntry(entryId, data)` and come out as typed `Document` objects consumed by SSR pages and API routes. `buildTree()` takes flat `{ id, data }` arrays (already adapted and filtered by path prefix) and produces nested `TreeNode[]` for the docs-tree API. `renderMarkdown()` accepts raw markdown strings and returns HTML via a synchronous-style unified pipeline (remarkParse -> remarkGfm -> remarkObsidian -> remarkRehype -> rehypeRaw -> rehypeCallouts -> rehypeSlug -> rehypeStringify). `extractHeadings()` post-processes rendered HTML to extract h2/h3 slugs for table-of-contents generation.

## Integration Points

Consumed by every SSR page (`[type]/`, `docs/`), all API routes (`docs-tree`, `preview`), and the `SearchPageClient` / `FilterPanel` islands which import `ContentType`, `TYPE_LABELS`, and `ALL_CONTENT_TYPES`. The `Document` interface is the central contract between the loader layer and the rendering layer. `markdown.ts` depends on unified ecosystem plugins (`remark-obsidian`, `rehype-callouts`, `rehype-slug`) installed as npm dependencies.
