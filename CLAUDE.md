# Claude Project Instructions

## Project Overview
This is a Quartz 4 static site generator project for the SuperBenefit Knowledge Garden. Quartz is written in TypeScript and renders its components with Preact.

> **This `v4` branch is the legacy Quartz site and is no longer developed.** The live site, `knowledge.superbenefit.org`, is built from the Astro 6 rewrite on the `astro-v6` branch, which has its own `CLAUDE.md`. Work on the Knowledge Garden goes there; change this branch only to maintain the old Quartz build.

## Key Principles

### 1. Leverage Built-in Quartz Functionality First
**IMPORTANT**: Always look for and use existing Quartz features before creating custom solutions.

- Check for existing Quartz components and utilities before building new ones
- Use built-in conditional rendering (e.g., `Component.MobileOnly`, `Component.DesktopOnly`)
- Leverage existing layout patterns and component composition
- Reference Quartz documentation at https://quartz.jzhao.xyz/ for available features
- Prefer configuration over customization when possible

### 2. File Organization Conventions
All source code must follow Quartz's directory structure:
- **Components**: `quartz/components/`
- **Plugins**: `quartz/plugins/` (with subdirectories for `emitters/`, `transformers/`, `filters/`)
- **Types and utilities**: `quartz/types/`, `quartz/util/`
- **Configuration**: `quartz/cfg/`
- **Styles**: `quartz/styles/` (Sass files)
- **Never place source files in the project root** (except `quartz.config.ts` and `quartz.layout.ts`)

### 3. Type-Aware Layouts System
This project implements a custom type-aware layout system that extends Quartz:
- Type definitions are loaded from `content/tools/types/*.md` (Obsidian Metadata Menu format)
- Types follow an inheritance hierarchy: `note` → `artifact`/`reference` → specific types
- Each type can have custom layouts defined in `quartz/types/typeLayouts.ts`
- The system gracefully falls back: specific type → category layout → default layout

Key files:
- `quartz/types/typeRegistry.ts` - Type management
- `quartz/types/typeLoader.ts` - Dynamic type loading
- `quartz/types/typeLayouts.ts` - Layout definitions
- `quartz/plugins/transformers/typeDetection.ts` - Type detection
- `quartz/plugins/emitters/artifactPage.tsx` - Artifact emitter
- `quartz/plugins/emitters/referencePage.tsx` - Reference emitter

### 4. Plugin Development
When creating or modifying plugins:
- Transformers must be ordered correctly (e.g., `FrontMatter` before `TypeDetection`)
- Emitters process content in order - later emitters can override earlier ones
- Always return proper QuartzPlugin types
- Use the plugin pattern: factory function returning plugin object

### 5. Component Development
When creating components:
- Follow the QuartzComponent and QuartzComponentConstructor patterns
- Components can access `fileData`, `cfg`, `allFiles`, and other props
- Use `displayClass` prop for responsive design classes
- Always export using the satisfies pattern: `export default (() => Component) satisfies QuartzComponentConstructor`

### 6. Testing and Building
- Run `npx quartz build` to test changes
- Use `npx quartz build --serve` for local development with hot reload
- Check console output for type detection and emitter processing logs
- Verify that type detection is working by checking console logs for `[TypeDetection]` messages

### 7. Git and Commit Policy
**🚨 CRITICAL RULE**: NEVER commit changes unless EXPLICITLY instructed by the user.

- **DO NOT commit automatically** after completing tasks
- **ONLY commit when the user explicitly says** "commit", "please commit", or gives direct commit instructions
- **Always ask for permission** if you think something should be committed
- **Stage changes with `git add`** but wait for explicit commit instruction

### 8. Process Management
**CRITICAL**: Always clean up running processes when finished with them, but BE SELECTIVE about which processes to kill.

**⚠️ NEVER USE BLANKET KILL COMMANDS**: Do NOT use `taskkill /F /IM node.exe` or `pkill node` as these will kill ALL Node processes, including Claude's own process if running in a Node environment. This will terminate the Claude session immediately.

- **Before starting new dev servers**: Check for existing Node.js processes on the same port
- **After running dev servers**: Always terminate them properly (Ctrl+C or kill the process)
- **Check for stale processes**: Use `tasklist | findstr node` (Windows) or `ps aux | grep node` (Unix) to find running Node processes
- **Kill stale processes SELECTIVELY**: 
  - Windows: `taskkill /F /PID [specific_process_id]` (ONLY kill by specific PID, never use /IM node.exe)
  - Unix: `kill -9 [specific_process_id]` (ONLY kill by specific PID, never use pkill node)
- **Identify the right process**: Look for processes with "quartz" in the command line or running on port 8080
- **When running build --serve**: Remember this starts a persistent server that must be stopped
- **Best practice**: Always kill processes by specific PID after identifying the correct one to avoid accidentally terminating Claude's session

### 9. Documentation
- Main feature documentation goes in `docs/features/`
- Plugin documentation goes in `docs/plugins/`
- Always update documentation when adding new features
- Include file indexes and clear examples

### 10. Context Research Process
**CRITICAL**: When starting work on this project, always execute the context research process first.

Execute this command to trigger the research process:
> "Execute the context research process to understand this project's customizations and architecture"

**Research Process Steps:**
1. **Project Overview**: Read CLAUDE.md, README.md, package.json, quartz.config.ts, quartz.layout.ts
2. **Git History Analysis**: Check recent commits (last 20), current branch status, and development patterns
3. **Type System Deep Dive**: Examine quartz/types/ directory, content/tools/types/, type hierarchy and inheritance
4. **Custom Components**: List all custom components in quartz/components/, identify type-aware vs standard components
5. **Plugin Architecture**: Check custom transformers and emitters in quartz/plugins/, understand execution order
6. **Documentation Review**: Scan docs/ directory for feature documentation and architectural decisions
7. **Architecture Mapping**: Map data flow from content → transformers → emitters → output, identify integration points

**Key Areas to Understand:**
- **Type-Aware Layout System**: The core innovation extending Quartz with dynamic layouts based on content type detection
- **Three-Tier Architecture**: note → artifact/reference → specific types (pattern, playbook, etc.)
- **Component Ecosystem**: TypeBadge, BannerImage, CitationGenerator, TypeAware* components
- **Plugin Integration**: TypeDetection transformer, ArtifactPage/ReferencePage emitters
- **Content Organization**: Dynamic type loading from content/tools/types/*.md files
- **Recent Development**: Current feature branch work, uncommitted changes, development focus

**Validation Steps:**
- Spot-check key findings against actual files (typeLayouts.ts, TypeBadge.tsx, artifactPage.tsx)
- Verify git history matches documented recent work
- Confirm type definitions exist in content/tools/types/
- Test understanding of component relationships and data flow

## Common Patterns

### Conditional Rendering
```typescript
// Use built-in responsive components
Component.DesktopOnly(Component.Explorer())
Component.MobileOnly(Component.Spacer())

// For custom conditions, create wrapper components
const ConditionalComponent: QuartzComponent = (props) => {
  if (condition) {
    return <ActualComponent {...props} />
  }
  return null
}
```

### Type-Aware Components
```typescript
// Access type information from fileData
const detectedType = fileData.detectedType
const typeCategory = fileData.typeCategory
```

### Layout Customization
```typescript
// Define layouts in quartz/types/typeLayouts.ts
export const customLayout: PageLayout = {
  beforeBody: [...],
  left: [...],
  right: [...]
}
```

## Project-Specific Notes

1. **TypeBadge Component**: Currently the only type-aware visual customization, displays badges like "⚡ Pattern" or "📖 Playbook"

2. **Note Type Bypass**: Files with type "note" or no type completely bypass the type-aware system and use default Quartz behavior

3. **Graceful Fallback**: The system is designed to fail gracefully - unknown types fall back to note layouts

4. **Dynamic Type Loading**: Type definitions are loaded from content files at build time, with hardcoded fallbacks for reliability

## Debugging Tips

- Set `NODE_ENV=development` to see detailed type detection logs
- Check emitter output with messages like `[ArtifactPage] Processed X files`
- Use `console.log` in transformers and emitters to debug processing
- Verify file paths in type definitions match actual content structure

## Important Links

- Quartz Documentation: https://quartz.jzhao.xyz/
- Quartz GitHub: https://github.com/jackyzha0/quartz
- Project Repository: https://github.com/superbenefit/knowledge-garden