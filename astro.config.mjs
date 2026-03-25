import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import remarkGfm from "remark-gfm";
import remarkObsidian from "remark-obsidian";
import rehypeRaw from "rehype-raw";
import rehypeCallouts from "rehype-callouts";
import rehypeSlug from "rehype-slug";
import pagefind from "astro-pagefind";

export default defineConfig({
  site: "https://knowledge.superbenefit.org",
  output: "static",
  integrations: [react(), sitemap(), pagefind()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    remarkPlugins: [remarkGfm, remarkObsidian],
    rehypePlugins: [rehypeRaw, rehypeCallouts, rehypeSlug],
  },
});
