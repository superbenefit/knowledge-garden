import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4.0 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "SuperBenefit",
    pageTitleSuffix: " | Knowledge Garden",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "plausible",
    },
    locale: "en-US",
    baseUrl: "knowledge.superbenefit.org",
    ignorePatterns: [
      "private",
      "templates",
      ".obsidian",
      ".github",
      "drafts",           // Don't publish draft content from knowledge-base
      "tools/templates",  // Don't publish templates (but tools/types will still be scanned)
      "tools/schemas",    // Don't publish schemas
      "tools/workflows",  // Don't publish workflows
      ".claude",          // Config folders
      ".export",
      "README.md",        // Inner-facing documentation
      "CONTRIBUTING.md",
      "agents.md",
      "**/AIFS Meeting \\(*.md",  // Malformed frontmatter in AIFS meeting files
      "**/rpp-archive/**",  // Archived content with data quality issues
      "**/rpp-tasks/**",  // Tasks with data quality issues
      "**/rpp-experiments/**",  // Experiments with data quality issues
      "**/rp-playbook.md"  // Processing error
    ],
    defaultDateType: "created",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Schibsted Grotesk",
        body: "Source Sans Pro",
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
          light: "#faf8f8",
          lightgray: "#e5e5e5",
          gray: "#b8b8b8",
          darkgray: "#4e4e4e",
          dark: "#2b2b2b",
          secondary: "#2a521e",
          tertiary: "#448424",
          highlight: "rgba(135, 169, 164, 0.15)",
          textHighlight: "rgba(135, 169, 164, 0.15)",
        },
        darkMode: {
          light: "#161618",
          lightgray: "#393639",
          gray: "#646464",
          darkgray: "#d4d4d4",
          dark: "#ebebec",
          secondary: "rgb(177, 132, 55)",
          tertiary: "rgb(233, 173, 68)",
          highlight: "rgba(135, 169, 164, 0.15)",
          textHighlight: "rgba(135, 169, 164, 0.15)",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.TypeDetection(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: true }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents({
        minEntries: 0,
      }),
      Plugin.CrawlLinks({ markdownLinkResolution: "absolute" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [
      Plugin.RemoveDrafts(),
      Plugin.ExplicitPublish()
    ],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      
      // Default content emitter (runs first, provides fallback for 'note' category)
      Plugin.ContentPage(),
      
      // Category-level emitters (hybrid approach - run after, override for categories)
      Plugin.ReferencePage(),
      Plugin.ArtifactPage(),
      
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.NotFoundPage(),
    ],
  },
}

export default config
