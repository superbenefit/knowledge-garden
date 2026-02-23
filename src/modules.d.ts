// Ambient type declarations for untyped npm packages

declare module "remark-wiki-link-plus" {
  import type { Plugin } from "unified";
  const plugin: Plugin;
  export default plugin;
}

declare module "remark-obsidian" {
  import type { Plugin } from "unified";
  const plugin: Plugin;
  export default plugin;
}
