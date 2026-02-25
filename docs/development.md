# Development Guide

## Prerequisites

- Node.js >= 22
- npm

## Setup

```bash
git clone https://github.com/superbenefit/knowledge-garden.git
cd knowledge-garden
git checkout astro-v6
npm install
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (http://localhost:4321) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run check` | TypeScript checking via `astro check` |
| `npm run test` | Run test suite via Vitest |
| `npm run seed` | Sync remote R2 bucket to local (for wrangler dev) |
| `npm run seed:clean` | Wipe local R2 state first, then sync |

## Local Development

```bash
npm run dev
```

The dev server starts at `http://localhost:4321`. It uses `wrangler dev` with local R2 emulation (miniflare). Seed the local bucket from the remote production bucket before first use.

### Hot Reload

Astro's dev server provides HMR for:
- `.astro` components — instant refresh
- `.tsx` React islands — fast refresh
- `.css` styles — injected without page reload

### Seeding Local Data

The local R2 bucket must be populated before running the dev server:

```bash
npm run seed          # Sync remote production R2 → local miniflare R2
npm run seed:clean    # Wipe local R2 state first, then sync
```

Requires `wrangler login` authentication. The seed script downloads all `content/*` objects from the remote bucket and uploads them to the local miniflare R2 store.

## Testing

```bash
# Run all tests
npm run test

# Run specific test file
npx vitest run tests/lib/types.test.ts

# Watch mode
npx vitest
```

### Test Structure

```
tests/
  lib/
    types.test.ts         Type validation + fromCollectionEntry (23 tests)
    markdown.test.ts      Markdown rendering (6 tests)
  integration/
    build.test.ts         Build output verification (skipped by default)
```

Integration tests are skipped by default because they require a prior `npm run build`.

## Project Conventions

### SSR Pages

All SSR pages follow this pattern:

```astro
---
export const prerender = false;

import ContentLayout from "@/components/layout/ContentLayout.astro";
import { getLiveEntry } from "astro:content";
import { fromCollectionEntry } from "@/lib/types";

let entry = null;
try {
  const result = await getLiveEntry("knowledge", `content/${type}/${id}.json`);
  if (result.entry) entry = fromCollectionEntry(result.entry.id, result.entry.data);
} catch {}

if (!entry) {
  Astro.response.status = 404;
}
---

<ContentLayout title={entry?.title ?? "Not Found"}>
  {!entry ? (
    <p>Not found.</p>
  ) : (
    <article>...</article>
  )}
</ContentLayout>
```

Do **not** use `return new Response(...)` in `.astro` frontmatter — esbuild's dependency scanner cannot parse top-level returns alongside exports. Use `Astro.response.status` instead.

### Optional Props

TypeScript's `exactOptionalPropertyTypes` is enabled. When passing optional props, use conditional spread:

```astro
<ReleaseCard
  title={doc.title}
  slug={doc.slug}
  {...(doc.description != null && { description: doc.description })}
  {...(doc.banner != null && { banner: doc.banner })}
/>
```

When receiving optional props that may be `undefined`:

```typescript
interface Props {
  currentSlug?: string | undefined;  // Not just `?: string`
}
```

### Path Aliases

The `@/` alias maps to `src/`:

```typescript
import { fromCollectionEntry } from "@/lib/types";
import ContentLayout from "@/components/layout/ContentLayout.astro";
```

### Styles

Use Tailwind utility classes and CSS custom properties from `src/styles/global.css`:

```html
<div style="color: var(--color-secondary)">Themed text</div>
<p class="text-sm font-bold">Tailwind utilities</p>
```

Theme tokens are defined in `@theme` block. Key tokens:

| Token | Light | Dark |
|-------|-------|------|
| `--color-light` | #faf8f8 | #161618 |
| `--color-dark` | #2b2b2b | #ebebec |
| `--color-secondary` | #2a521e | rgb(177, 132, 55) |
| `--color-tertiary` | #448424 | rgb(233, 173, 68) |
| `--font-header` | Schibsted Grotesk | |
| `--font-body` | Source Sans Pro | |
| `--font-mono` | IBM Plex Mono | |

### Responsive Breakpoints

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Mobile | < 800px | Single column, hamburger nav |
| Tablet | 800px+ | 2 columns (left sidebar + content) |
| Desktop | 1200px+ | 3 columns (left sidebar + content + right sidebar) |

## Debugging

- `npm run check` — catches type errors across all `.astro` and `.ts` files
- Dev server console shows request logs for SSR pages
- React islands errors appear in the browser console
- Build errors are surfaced by `npm run build` with file and line references
