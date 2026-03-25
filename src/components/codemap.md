# src/components/

## Responsibility

Reusable UI layer organized into three subdirectories. `layout/` provides the page shell: `BaseLayout` (HTML document, CSS grid, dark mode init script, SEO head), `ContentLayout` (three-column layout with optional sidebars, header, footer), `Header` (sticky nav bar with mobile hamburger menu, search link, dark mode toggle), `Footer` (external links, credits), `Sidebar` (sticky scrollable panel with mobile drawer variant), `SidebarNav` (left sidebar content: Lexicon/Links quick links + docs tree), `DocsTree` (SSR-rendered collapsible file tree with localStorage persistence), and `DarkModeToggle` (light/dark theme toggle with `localStorage`). `content/` provides document display components: `TypeBadge` (category-colored badge with Lucide icons per content type), `ContentMeta` (dates, type, reading time), `ContentRenderer` (markdown-to-HTML via unified pipeline with full prose styling), `TagList` (linked tag chips), `TableOfContents` (sticky h2/h3 ToC with IntersectionObserver scroll tracking), `Breadcrumbs` (URL-derived breadcrumb nav), `BackLinks` (collapsible backlink list), `BannerImage` (Obsidian wiki-link-aware banner rendering), `ReleaseCard` (content card with optional banner, tags, type emoji), `ReleaseContents` (grouped card grid by type category), `CitationGenerator` (multi-format citation with clipboard copy), `LicenseInfo` (Creative Commons license display with SVG icons), `GraphSidebar` (graph preview placeholder), and `SEOHead` (meta/OG/Twitter/JSON-LD tags). `islands/` holds React components hydrated client-side: `SearchBar` (debounced search with dropdown, Ctrl+K shortcut, keyboard nav), `SearchPageClient` (full search page composing SearchBar + FilterPanel), `FilterPanel` (type dropdown + tag chips), `GraphView` (D3 force-directed graph with zoom/pan/drag/hover), `DarkMode` (React dark mode toggle, alternative to the Astro version), `DocsTreeNav` (React docs tree, self-fetches from `/api/docs-tree`), and `PopoverPreview` (hover preview popover via `/api/preview`).

## Design Patterns

- **Astro components for SSR, React islands for interactivity**: Layout and content components are `.astro` files rendered server-side. Interactive features (search, graph, filtering, hover previews) are React `.tsx` islands hydrated with `client:load` or `client:visible` directives.
- **CSS grid page shell**: `BaseLayout` uses a named CSS grid (`page-grid`) with five grid areas (sidebar-left, header, center, sidebar-right, footer). Responsive breakpoints at 800px (2-col) and 1200px (3-col). Sidebars are sticky-positioned with overflow scrolling.
- **Component composition via slots**: `ContentLayout` composes `BaseLayout`, `Header`, `Footer`, `Sidebar`, and `SidebarNav` via named slots (`sidebar-left`, `sidebar-right`, `before-content`, `after-content`). Pages inject `TableOfContents` into `slot="sidebar-right"`.
- **Dark mode dual-path**: An inline script in `BaseLayout` applies `.dark` class before paint to prevent flash. `DarkModeToggle.astro` handles toggling via vanilla JS. `DarkMode.tsx` is an equivalent React island (used where hydration is needed). Both persist to `localStorage`.
- **Category-based styling**: `TypeBadge` maps 17 content types to Lucide SVG icons and 6 category color tints (resource=green, story=blue, reference=purple, data=amber, question=cyan, file=gray) with dark mode variants.

## Data & Control Flow

Layout components receive props from pages (title, description, sidebar visibility flags). `ContentLayout` renders `SidebarNav` in the left sidebar, which SSR-fetches the docs tree via `getLiveCollection` and renders it as a collapsible `<details>` tree. `DocsTree` computes open/closed folder state from `currentSlug` and persists user toggle state to `localStorage`. Content components receive `Document` objects or primitive props from pages and render display-only markup. Islands hydrate client-side and fetch data from API routes: `SearchBar` hits `/api/search`, `DocsTreeNav` hits `/api/docs-tree`, `PopoverPreview` hits `/api/preview`, and `GraphView` receives graph data as props. `FilterPanel` manages filter state (type + tags) and passes it up to `SearchPageClient` which passes it down to `SearchBar`.

## Integration Points

- **Pages** (`src/pages/`) -- every page wraps in `ContentLayout`; detail pages use `TypeBadge`, `TagList`, `ContentMeta`, `Breadcrumbs`, `TableOfContents`, `BannerImage`, `ContentRenderer`
- **`src/lib/types.ts`** -- `ContentType`, `TYPE_LABELS`, `ALL_CONTENT_TYPES`, `Document`, `SearchResult`, `GraphData` interfaces consumed by islands and content components
- **`src/lib/markdown.ts`** -- `renderMarkdown` called by `ContentRenderer`
- **`src/lib/docs-tree.ts`** -- `buildTree`, `TreeNode` used by `DocsTree.astro`
- **`astro:content`** -- `getLiveCollection` called by `DocsTree.astro` and `SidebarNav.astro` at SSR time
- **API routes** -- `/api/search`, `/api/docs-tree`, `/api/preview` consumed by React islands
- **`src/styles/global.css`** -- CSS custom properties (`--color-*`, `--font-*`) used throughout all components via `var()`
- **D3** -- `GraphView.tsx` imports `d3` for force simulation, zoom, drag
