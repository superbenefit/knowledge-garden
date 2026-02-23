# Components

## Layout Components

Located in `src/components/layout/`. These define the page shell.

### BaseLayout.astro

Root HTML layout. Sets up the `<html>`, `<head>`, and 3-column CSS grid.

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Page `<title>` |
| `description` | `string?` | Meta description |

### ContentLayout.astro

Standard wrapper for content pages. Composes BaseLayout with Header, Sidebar, and Footer.

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Page title |
| `description` | `string?` | Meta description |
| `showLeftSidebar` | `boolean?` | Show left sidebar (default: true) |
| `showRightSidebar` | `boolean?` | Show right sidebar (default: true) |

### Header.astro

Sticky top header with logo, navigation links, search trigger, and dark mode toggle. Includes a hamburger menu for mobile.

### Footer.astro

Site footer with links to Twitter, Discord, and Mirror.

### Sidebar.astro

Sticky sidebar container. Used for left (docs nav) and right (ToC, backlinks) sidebars.

| Prop | Type | Description |
|------|------|-------------|
| `side` | `"left" \| "right"` | Which sidebar position |

## Content Components

Located in `src/components/content/`. Server-rendered Astro components for displaying content.

### TypeBadge.astro

Visual badge for content types (e.g., "Pattern", "Playbook"). Only rendered for artifact and reference categories — notes show no badge.

| Prop | Type | Description |
|------|------|-------------|
| `type` | `string` | Content type |
| `category` | `string` | Type category |

### BannerImage.astro

Renders hero/banner images. Supports Obsidian wiki-link format (`![[attachments/image.webp]]`), direct paths, and external URLs.

| Prop | Type | Description |
|------|------|-------------|
| `banner` | `string?` | Image path or wiki-link |
| `title` | `string?` | Alt text |

### ContentMeta.astro

Displays document metadata: created date, modified date, content type, and estimated reading time.

| Prop | Type | Description |
|------|------|-------------|
| `document` | `Document` | Full document object |

### BackLinks.astro

Lists documents that link to the current page. Collapses into a disclosure if more than 5 items.

| Prop | Type | Description |
|------|------|-------------|
| `backlinks` | `Array<{slug, title}>` | Incoming link data |

### TableOfContents.astro

Sticky table of contents generated from h2/h3 headings. Highlights the currently visible section.

| Prop | Type | Description |
|------|------|-------------|
| `headings` | `Array<{depth, slug, text}>` | Heading data |

### TagList.astro

Renders a list of tags as linked chips.

| Prop | Type | Description |
|------|------|-------------|
| `tags` | `string[]` | Tag names |

### ReleaseCard.astro

Card component for content listings. Shows banner image, type badge, title, description, and tags.

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Card title |
| `description` | `string?` | Card description |
| `slug` | `string` | Link target |
| `type` | `string?` | Content type |
| `tags` | `string[]?` | Tag list |
| `banner` | `string?` | Banner image |

### ReleaseContents.astro

Groups and displays documents by content type. Filters to publishable types only (pattern, playbook, article, study, guide, protocol).

| Prop | Type | Description |
|------|------|-------------|
| `documents` | `Document[]` | Documents to display |
| `title` | `string?` | Section heading |

### LicenseInfo.astro

Displays Creative Commons license information with badge icons.

| Prop | Type | Description |
|------|------|-------------|
| `license` | `string?` | License identifier (e.g., "CC-BY-SA-4.0") |
| `author` | `string?` | Author name |
| `authorUrl` | `string?` | Author link |
| `title` | `string` | Work title |
| `date` | `string?` | Publication date |

### CitationGenerator.astro

Generates academic citations in multiple formats (APA, MLA, Chicago, IEEE, Harvard).

### SEOHead.astro

Outputs Open Graph and Twitter meta tags for social sharing.

### Breadcrumbs.astro

Renders breadcrumb navigation from slug path segments.

### ContentRenderer.astro

Renders markdown body content using the runtime unified pipeline.

### GraphSidebar.astro

Sidebar widget showing a mini graph visualization for the current page.

## React Islands

Located in `src/components/islands/`. Client-side interactive components hydrated via Astro directives.

### SearchBar.tsx

Search input with dropdown results. Fetches from `/api/search` with 300ms debounce. Supports Ctrl+K keyboard shortcut.

| Prop | Type | Description |
|------|------|-------------|
| `initialQuery` | `string?` | Pre-filled search query |
| `typeFilter` | `ContentType?` | Filter by content type |
| `tagFilters` | `string[]?` | Filter by tags |
| `showDropdown` | `boolean?` | Show results dropdown |
| `onResults` | `(results, query) => void` | Callback for search results |

**Hydration**: `client:load`

### SearchPageClient.tsx

Full-page search UI combining SearchBar + FilterPanel + results list. Used on `/search`.

**Hydration**: `client:load`

### FilterPanel.tsx

Type selector and tag filter chips. Manages active filter state.

| Prop | Type | Description |
|------|------|-------------|
| `availableTags` | `string[]?` | Tags to show as filter options |
| `filters` | `FilterState` | Current filter state |
| `onFilterChange` | `(filters) => void` | Filter change callback |

### GraphView.tsx

D3.js force-directed graph visualization. Supports zoom, pan, drag, and hover highlighting. Renders as SVG (no Pixi.js dependency).

| Prop | Type | Description |
|------|------|-------------|
| `data` | `GraphData` | Nodes and links |
| `currentSlug` | `string?` | Highlighted current page |
| `width` | `number?` | Canvas width |
| `height` | `number?` | Canvas height |

**Hydration**: `client:only="react"`

### DocsTreeNav.tsx

Collapsible folder tree for docs navigation. Persists open/closed state to localStorage.

| Prop | Type | Description |
|------|------|-------------|
| `items` | `TreeNode[]` | Tree data from `/api/docs-tree` |
| `currentSlug` | `string?` | Currently active doc |

**Hydration**: `client:load`

### DarkMode.tsx

Toggle button for light/dark theme. Persists preference to localStorage. Adds/removes `dark` class on `<html>`.

**Hydration**: `client:load`

### PopoverPreview.tsx

Link hover preview popover. Fetches preview data from `/api/preview` on hover.

**Hydration**: `client:load`
