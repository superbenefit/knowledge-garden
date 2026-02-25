# SuperBenefit Knowledge Garden

> "[One] who works with the door open gets all kinds of interruptions, but [they] also occasionally gets clues as to what the world is and what might be important." — Richard Hamming

Knowledge from the SuperBenefit community and its projects. This space is used to learn, record, and share what matters in the journey with SuperBenefit.

## Architecture

Built with **Astro v6** (hybrid rendering) deployed on **Cloudflare Workers**.

- **SSR content** — All content types served at runtime from R2 via Astro v6 live collections
- **Docs section** — Published KB files under `docs/` filtered by path prefix from the same collection
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
npm run seed    # Seed local R2 from remote (for dev)
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
    docs/         # SSR docs pages (path-filtered from R2 live collection)
    [type]/       # SSR content pages (all content types)
    lexicon/      # Redirect → /tag
    people/       # Redirect → /person
    groups/       # Redirect → /group
    projects/     # Redirect → /project
  lib/            # types, docs-tree, markdown utils
  loaders/        # R2 knowledge loader (Astro live collection)
  styles/         # global.css (Tailwind v4 theme)
```

## Content

Content is maintained using [Obsidian](https://obsidian.md/) in the knowledge-base repository and synced to R2. The garden reads content directly from the R2 bucket at runtime using Astro v6 live collections.
