// Ambient type declarations for untyped packages and Cloudflare runtime modules

declare module "cloudflare:workers" {
  const env: Record<string, any>;
  export { env };
}

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
