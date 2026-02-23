import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkWikiLinkPlus from "remark-wiki-link-plus";
import remarkObsidian from "remark-obsidian";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeCallouts from "rehype-callouts";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";

export async function renderMarkdown(content: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkWikiLinkPlus)
    .use(remarkObsidian)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeCallouts)
    .use(rehypeSlug)
    .use(rehypeStringify)
    .process(content);
  return String(result);
}
