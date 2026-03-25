# Knowledge Garden Loader — Implementation Plan

## Context

### Problem
The Knowledge Garden docs folder index pages are returning 404 because:
- Content files exist at `content/docs/...` (e.g., `content/docs/dao-primitives/articles/building-daos.md`)
- Folder index metadata exists at `indexes/docs/...` (e.g., `indexes/docs/dao-primitives/index.json`)
- The current loader only fetches from `manifest.metadata.keys[]` which contains content entries
- Folder index entries in `indexes/` are never loaded into the content store

### Knowledge Server Changes (Already Deployed)
The knowledge-server manifest at `https://knowledge-bucket.superbenefit.dev/indexes/all-content.json` now has:

```json
{
  "metadata": {
    "keys": ["content/..."],           // 247 entries — articles, guides, patterns, etc.
    "indexKeys": ["indexes/..."],      // folder index metadata
    "attachmentKeys": ["attachments/..."] // 15 binary files
  }
}
```

The server is already deployed with these changes.

---

## Current Loader Code

**File:** `src/loaders/r2-knowledge-loader.ts`

The loader currently:
1. Fetches only `manifest.metadata.keys` (content entries)
2. Downloads attachments to `public/attachments/`
3. Stores entries with ID = R2 key

---

## Required Changes

### Step 1: Update Loader to Fetch indexKeys

**File:** `src/loaders/r2-knowledge-loader.ts`

#### Change 1.1: Update Manifest Interface

Add `indexKeys` to the Manifest interface:

```typescript
interface Manifest {
  metadata: {
    keys: string[];
    indexKeys: string[];      // NEW: folder index metadata
    attachmentKeys: string[];
  };
}
```

#### Change 1.2: Fetch Both content AND indexes

After fetching the manifest, destructure all three arrays:

```typescript
const keys = manifest.metadata.keys as string[];
const indexKeys = (manifest.metadata.indexKeys as string[]) ?? [];
const attachmentKeys = (manifest.metadata.attachmentKeys as string[]) ?? [];
```

#### Change 1.3: Merge keys + indexKeys for Document Fetching

Combine both arrays to fetch all document types:

```typescript
const allDocKeys = [...keys, ...indexKeys];

await Promise.all(
  allDocKeys.map(async (key) => {
    const res = await fetch(`${BUCKET_URL}/${key}`);
    if (!res.ok) {
      logger.warn(`Skipping ${key}: ${res.status}`);
      return;
    }
    const doc = await res.json();
    store.set({
      id: key,
      data: {
        ...doc.metadata,
        contentType: doc.contentType,
        path: doc.path,
        body: doc.content,
      },
    });
  }),
);
```

#### Change 1.4: Remove Attachment Downloading

The attachment downloading loop should be removed or made conditional. Attachments are binary files (images/PDFs) served via the `/attachments/[...path]` route, not loaded into the content store.

**Option A (Remove entirely):** Delete the attachment downloading code since attachments are served via R2 direct fetch at `/attachments/`.

**Option B (Keep for build-time optimization):** Keep the attachment downloading but move it outside the main document loading, or make it optional based on a flag.

**Recommended: Option A** — Simplifies the loader since attachments are already served via the existing `/attachments/[...path]` route.

---

### Step 2: Verify Content Store IDs

The `id` stored in the content store should be the full R2 key (e.g., `content/docs/dao-primitives/article.md` or `indexes/docs/dao-primitives/index.json`).

This is important for:
- `fromCollectionEntry()` function to correctly parse document IDs
- Child discovery logic in `[...slug].astro` which uses `path.startsWith(prefix)`

---

### Step 3: Update Page Slug Logic

**File:** `src/pages/docs/[...slug].astro`

The slug transformation needs to handle both content paths and index paths:

| Source | Path | Slug | URL |
|--------|------|------|-----|
| Content | `content/docs/dao-primitives/articles/building.md` | `dao-primitives/articles/building` | `/docs/dao-primitives/articles/building` |
| Index | `indexes/docs/dao-primitives/index.json` | `dao-primitives` | `/docs/dao-primitives/` |

Currently the slug is derived from `entry.data.path`:
```javascript
const slug = (e.data.path as string).replace(/^docs\//, "").replace(/\.md$/, "");
```

This should work correctly since:
- Content entries have `path: "docs/dao-primitives/articles/building.md"`
- Index entries have `path: "docs/dao-primitives"` (no `.md` extension)

**Verify:** The index entries have `path` without the `.md` extension since they reference folders, not files.

---

### Step 4: Update getStaticPaths for Folder Routes

**File:** `src/pages/docs/[...slug].astro`

The `getStaticPaths()` function currently generates routes only from content entries. It needs to ALSO generate routes from index entries (which represent folder pages).

Current behavior:
- Only generates routes for entries in `keys[]` (content files)

Required behavior:
- Generate routes for content entries (from `keys[]`)
- Generate routes for folder index entries (from `indexKeys[]`)

```javascript
export async function getStaticPaths() {
  const entries = await getCollection("knowledge");
  const docs = entries
    .filter((e) => e.data.path?.startsWith("docs/"))
    .map((e) => ({ id: e.id, data: e.data }));

  // Build tree for navigation (same as before)
  const tree = buildTree(
    docs.map((d) => ({
      id: d.id,
      data: { title: (d.data.title as string) || d.id },
    })),
  );

  // Generate routes from ALL entries (content + indexes)
  return docs.map((e) => {
    const slug = (e.data.path as string).replace(/^docs\//, "");
    return {
      params: { slug },
      props: { entry: e, tree },
    };
  });
}
```

**Note:** If `docs` array contains both `content/docs/X/article.md` AND `indexes/docs/X/index.json`:
- They have different paths: `docs/X/article.md` vs `docs/X`
- Different slugs: `X/article` vs `X`
- No conflict

---

## Detailed File Changes

### File: src/loaders/r2-knowledge-loader.ts

**Before:**
```typescript
import type { Loader } from "astro/loaders";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";

interface Manifest {
  metadata: {
    keys: string[];
    attachmentKeys: string[];
  };
}

export function r2KnowledgeLoader({ bucketUrl }: { bucketUrl: string }): Loader {
  return {
    name: "r2-knowledge-loader",
    async load({ store, logger }) {
      if (!bucketUrl) {
        throw new Error("R2_BUCKET_URL environment variable is not set");
      }

      store.clear();

      const manifestRes = await fetch(`${bucketUrl}/indexes/all-content.json`);
      if (!manifestRes.ok) throw new Error(`Manifest fetch failed: ${manifestRes.status}`);
      const manifest = (await manifestRes.json()) as Manifest;
      const { keys, attachmentKeys } = manifest.metadata;
      logger.info(`Manifest: ${keys.length} content keys, ${attachmentKeys.length} attachment keys`);

      await Promise.all(
        keys.map(async (key) => {
          const res = await fetch(`${bucketUrl}/${key}`);
          if (!res.ok) {
            logger.warn(`Skipping ${key}: ${res.status}`);
            return;
          }
          const doc = await res.json();
          store.set({
            id: key,
            data: {
              ...doc.metadata,
              contentType: doc.contentType,
              path: doc.path,
              body: doc.content,
            },
          });
        }),
      );

      // Download attachments to public/attachments/
      const attachmentsDir = join(process.cwd(), "public", "attachments");
      mkdirSync(attachmentsDir, { recursive: true });

      for (const key of attachmentKeys) {
        const res = await fetch(`${bucketUrl}/${key}`);
        if (!res.ok) {
          logger.warn(`Skipping attachment ${key}: ${res.status}`);
          continue;
        }
        const buffer = await res.arrayBuffer();
        const relativePath = key.replace(/^attachments\//, "");
        const filePath = join(attachmentsDir, relativePath);
        mkdirSync(dirname(filePath), { recursive: true });
        writeFileSync(filePath, Buffer.from(buffer));
      }

      logger.info(`Loaded entries from R2`);
    },
  };
}
```

**After:**
```typescript
import type { Loader } from "astro/loaders";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";

interface Manifest {
  metadata: {
    keys: string[];
    indexKeys: string[];
    attachmentKeys: string[];
  };
}

export function r2KnowledgeLoader({ bucketUrl }: { bucketUrl: string }): Loader {
  return {
    name: "r2-knowledge-loader",
    async load({ store, logger }) {
      if (!bucketUrl) {
        throw new Error("R2_BUCKET_URL environment variable is not set");
      }

      store.clear();

      const manifestRes = await fetch(`${bucketUrl}/indexes/all-content.json`);
      if (!manifestRes.ok) throw new Error(`Manifest fetch failed: ${manifestRes.status}`);
      const manifest = (await manifestRes.json()) as Manifest;
      const keys = manifest.metadata.keys as string[];
      const indexKeys = (manifest.metadata.indexKeys as string[]) ?? [];
      const attachmentKeys = (manifest.metadata.attachmentKeys as string[]) ?? [];
      logger.info(`Manifest: ${keys.length} content keys, ${indexKeys.length} index keys, ${attachmentKeys.length} attachment keys`);

      // Fetch content + index entries
      const allDocKeys = [...keys, ...indexKeys];
      await Promise.all(
        allDocKeys.map(async (key) => {
          const res = await fetch(`${bucketUrl}/${key}`);
          if (!res.ok) {
            logger.warn(`Skipping ${key}: ${res.status}`);
            return;
          }
          const doc = await res.json();
          store.set({
            id: key,
            data: {
              ...doc.metadata,
              contentType: doc.contentType,
              path: doc.path,
              body: doc.content,
            },
          });
        }),
      );

      // Download attachments to public/attachments/
      const attachmentsDir = join(process.cwd(), "public", "attachments");
      mkdirSync(attachmentsDir, { recursive: true });

      for (const key of attachmentKeys) {
        const res = await fetch(`${bucketUrl}/${key}`);
        if (!res.ok) {
          logger.warn(`Skipping attachment ${key}: ${res.status}`);
          continue;
        }
        const buffer = await res.arrayBuffer();
        const relativePath = key.replace(/^attachments\//, "");
        const filePath = join(attachmentsDir, relativePath);
        mkdirSync(dirname(filePath), { recursive: true });
        writeFileSync(filePath, Buffer.from(buffer));
      }

      logger.info(`Loaded entries from R2`);
    },
  };
}
```

---

## Testing Checklist

After implementing changes:

1. **Run `npm run build`** — should complete successfully
2. **Check dist/docs/ structure** — should have `index.html` at folder levels:
   - `dist/docs/dao-primitives/index.html` → URL `/docs/dao-primitives/`
   - `dist/docs/ics/index.html` → URL `/docs/ics/`
3. **Verify child links** — folder index pages should show children
4. **Check index content** — if `indexes/docs/X/index.json` has content, it should appear above children

---

## References

- **Loader file:** `src/loaders/r2-knowledge-loader.ts`
- **Docs page:** `src/pages/docs/[...slug].astro`
- **Docs index:** `src/pages/docs/index.astro`
- **Types:** `src/lib/types.ts` — `fromCollectionEntry()` function
- **Manifest:** `https://knowledge-bucket.superbenefit.dev/indexes/all-content.json`

---

## Notes

- Attachments are binary files served via `/attachments/[...path]` route — attachment downloading in loader is for build-time optimization only
- Index entries may not exist for all folders yet — loader handles empty `indexKeys` gracefully
- The manifest structure ensures no slug conflicts: content paths end in `.md`, index paths reference folders directly
