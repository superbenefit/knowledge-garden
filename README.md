# SuperBenefit Knowledge Garden

> "[One] who works with the door open gets all kinds of interruptions, but [they] also occasionally gets clues as to what the world is and what might be important." — Richard Hamming

Knowledge from the SuperBenefit community and its projects. This space is used to learn, record, and share what matters in the journey with SuperBenefit.

## Architecture

Built with **Astro v6** (hybrid rendering) deployed on **Cloudflare Workers**.

- **SSR content** — All content types served at runtime via RPC to a knowledge-server Worker
- **Docs section (broken)** — Currently uses build-time collections on an empty directory; under active repair
- **React islands** — Search, graph visualization, dark mode toggle (client-side hydration)
- **Tailwind v4** — Utility-first CSS with custom theme tokens

See [docs/architecture.md](docs/architecture.md) for full details.

## Development

```bash
npm install     # Install dependencies (Node >= 22)
npm run dev     # Start dev server
npm run build   # Production build
npm run check   # TypeScript checking
npm run test    # Run tests
```

## Project Structure

```
src/
  components/
    layout/       # BaseLayout, ContentLayout, Header, Footer, Sidebar
    content/      # TypeBadge, ReleaseCard, BackLinks, TagList, ToC, etc.
    islands/      # SearchBar, GraphView, DarkMode, DocsTreeNav (React)
  pages/
    api/          # search, graph, backlinks, docs-tree, preview endpoints
    docs/         # BROKEN — uses getCollection on empty content/docs/
    [type]/       # SSR content pages (all working content types)
    lexicon/      # Redirect → /tag
    people/       # Redirect → /person
    groups/       # Redirect → /group
    projects/     # Redirect → /project
  lib/            # types, rpc client, markdown utils
  styles/         # global.css (Tailwind v4 theme)
content/          # Legacy Quartz files — not used by Astro site
```

## Content

Content is maintained using [Obsidian](https://obsidian.md/) in the knowledge-base repository and synced to R2 via the knowledge-server Worker. The garden fetches all content at runtime via RPC service bindings.

The `content/` directory contains legacy Quartz files that are not used by the current Astro site. The docs section (`/docs/*`) is currently broken and under active repair.
