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

## Local Development

```bash
npm run dev
```

The dev server starts at `http://localhost:4321`. It uses the RPC stub (`src/lib/rpc-stub.ts`) for knowledge-server data — no Cloudflare service bindings needed locally.

### Hot Reload

Astro's dev server provides HMR for:
- `.astro` components — instant refresh
- `.tsx` React islands — fast refresh
- `.css` styles — injected without page reload
### Adding Sample Data

Edit `src/lib/rpc-stub.ts` to add more mock documents for local development. The stub implements the full `KnowledgeClient` interface.

## Testing

```bash
# Run all tests
npm run test

# Run specific test file
npx vitest run tests/lib/rpc-stub.test.ts

# Watch mode
npx vitest
```

### Test Structure

```
tests/
  lib/
    rpc-stub.test.ts     RPC mock (12 tests)
    rpc.test.ts           RPC client (5 tests)
    markdown.test.ts      Markdown rendering (6 tests)
    types.test.ts         Type validation (5 tests)
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
import { getKnowledgeClient, safeCall } from "@/lib/rpc";

const client = getKnowledgeClient();
const entry = await safeCall(() => client.getDocument(type, id), null);

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
import { getKnowledgeClient } from "@/lib/rpc";
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
