import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import remarkGfm from "remark-gfm";
import remarkWikiLinkPlus from "remark-wiki-link-plus";
import remarkObsidian from "remark-obsidian";
import rehypeRaw from "rehype-raw";
import rehypeCallouts from "rehype-callouts";
import rehypeSlug from "rehype-slug";

export default defineConfig({
  site: "https://knowledge.superbenefit.org",
  adapter: cloudflare(),
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    remarkPlugins: [remarkGfm, remarkWikiLinkPlus, remarkObsidian],
    rehypePlugins: [rehypeRaw, rehypeCallouts, rehypeSlug],
  },
});
