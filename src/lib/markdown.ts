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

export interface Heading {
  depth: number;
  slug: string;
  text: string;
}

/** Extract h2/h3 headings with IDs from rendered HTML (for table of contents) */
export function extractHeadings(html: string): Heading[] {
  const headings: Heading[] = [];
  const regex = /<h([23])\s[^>]*id="([^"]+)"[^>]*>(.*?)<\/h[23]>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    headings.push({
      depth: parseInt(match[1]!, 10),
      slug: match[2]!,
      text: match[3]!.replace(/<[^>]+>/g, "").trim(),
    });
  }
  return headings;
}

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
