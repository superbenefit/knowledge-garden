# SuperBenefit Knowledge Garden

> "[One] who works with the door open gets all kinds of interruptions, but [they] also occasionally gets clues as to what the world is and what might be important." — Richard Hamming

Knowledge from the SuperBenefit community and its projects. This space is used to learn, record, and share what matters in the journey with SuperBenefit.

## Architecture

Built with **Astro v6** (hybrid rendering) deployed on **Cloudflare Workers**.

- **Build-time content** — Markdown docs via Astro content collections (`content/docs/`)
- **Live content** — Lexicon, people, groups, projects served at runtime via RPC to a knowledge-server Worker
- **React islands** — Search, graph visualization, dark mode toggle (client-side hydration)
- **Tailwind v4** — Utility-first CSS with custom theme tokens

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
    docs/         # Build-time doc pages
    lexicon/      # SSR lexicon pages
    people/       # SSR people pages
    groups/       # SSR group pages
    projects/     # SSR project pages
    tags/         # SSR tag pages
  lib/            # types, rpc client, markdown utils
  styles/         # global.css (Tailwind v4 theme)
content/
  docs/           # Markdown content (build-time)
```

## Content

Content is maintained using [Obsidian](https://obsidian.md/). Markdown files in `content/docs/` are processed at build time. All other content types (lexicon terms, people, groups, projects) are served at runtime from a knowledge-server Cloudflare Worker via service bindings.
