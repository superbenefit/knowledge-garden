# Content Authoring

## Overview

Content is authored in [Obsidian](https://obsidian.md/) and stored as markdown files in the `content/` directory. The site supports Obsidian-specific markdown features including wiki-links, callouts, and frontmatter metadata.

## Content Directory

```
content/
  docs/           Build-time docs (processed by Astro at build)
  artifacts/      Knowledge artifacts (served by knowledge-server)
  notes/          Working notes
  tags/           Tag index files
  links/          External link references
  attachments/    Images and files
  index.md        Root folder metadata
```

Only `content/docs/**/*.md` and `content/*/index.md` are processed at build time. All other content is served at runtime by the knowledge-server Worker.

## Frontmatter

Every markdown file can include YAML frontmatter:

```yaml
---
title: Governance Primitives
description: A framework for modular governance design
type: pattern
tags:
  - governance
  - dao
aliases:
  - gov-primitives
banner: "![[attachments/governance-banner.webp]]"
license: CC-BY-SA-4.0
publish: true
date: 2024-06-15
created: 2024-06-15
modified: 2025-01-20
---
```

### Required Fields

None — all fields are optional. Documents without a `title` will use the filename.

### Common Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Display title |
| `description` | string | Short summary |
| `type` | string | Content type (pattern, playbook, article, study, guide, protocol, note, link, tag, index) |
| `tags` | string[] | Tags for categorization |
| `aliases` | string[] | Alternative names (for wiki-link resolution) |
| `banner` | string | Banner image — supports wiki-links (`![[path]]`), direct paths, or URLs |
| `license` | string | Creative Commons license (e.g., CC-BY-SA-4.0, CC-BY-4.0, CC0) |
| `publish` | boolean | Whether to publish this document |
| `date` | date | Publication date |
| `created` | date | Creation date |
| `modified` | date | Last modified date |

## Content Types

Types follow a 3-tier hierarchy:

| Category | Types | Description |
|----------|-------|-------------|
| **artifact** | pattern, playbook, article, study, guide, protocol | Validated, published knowledge |
| **reference** | link, tag, index | Organizational/structural content |
| **note** | note | Working notes, drafts |

Artifacts and references get a TypeBadge displayed on their page. Notes show no badge.

## Supported Markdown Features

### Wiki-Links

```markdown
Link to another page: [[governance-primitives]]
Link with display text: [[governance-primitives|Gov Primitives]]
Embed an image: ![[attachments/diagram.png]]
```

### Callouts (Admonitions)

```markdown
> [!note]
> This is a note callout.

> [!warning]
> Be careful with this approach.

> [!tip]
> Try this instead.
```

### GitHub Flavored Markdown

- Tables
- Strikethrough (`~~text~~`)
- Task lists (`- [ ] item`)
- Autolinks

### Standard Markdown

- Headings, bold, italic, code
- Ordered and unordered lists
- Block quotes
- Fenced code blocks with syntax highlighting
- Horizontal rules
- Images and links

## Images

Images can be referenced in three ways:

1. **Wiki-link** (Obsidian native): `![[attachments/image.webp]]`
2. **Relative path**: `![Alt text](attachments/image.webp)`
3. **External URL**: `![Alt text](https://example.com/image.png)`

Place image files in `content/attachments/` for wiki-link resolution.

## Banner Images

Set a banner image in frontmatter:

```yaml
banner: "![[attachments/hero.webp]]"
```

The BannerImage component parses wiki-link syntax and renders a full-width hero image at the top of the page.
