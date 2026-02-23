import { describe, it, expect } from "vitest";
import { renderMarkdown } from "@/lib/markdown";

describe("renderMarkdown", () => {
  it("renders a heading", async () => {
    const html = await renderMarkdown("# Hello");
    expect(html).toContain("<h1");
    expect(html).toContain("Hello");
  });

  it("renders a paragraph", async () => {
    const html = await renderMarkdown("Some text here.");
    expect(html).toContain("<p>");
    expect(html).toContain("Some text here.");
  });

  it("renders GFM strikethrough", async () => {
    const html = await renderMarkdown("~~deleted~~");
    expect(html).toContain("<del>");
    expect(html).toContain("deleted");
  });

  it("renders GFM tables", async () => {
    const md = `| A | B |\n|---|---|\n| 1 | 2 |`;
    const html = await renderMarkdown(md);
    expect(html).toContain("<table>");
    expect(html).toContain("<td>1</td>");
  });

  it("handles empty string", async () => {
    const html = await renderMarkdown("");
    expect(html).toBe("");
  });

  it("generates heading slugs via rehype-slug", async () => {
    const html = await renderMarkdown("## My Section");
    expect(html).toContain('id="my-section"');
  });
});
