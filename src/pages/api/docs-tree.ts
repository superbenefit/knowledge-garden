import type { APIRoute } from "astro";
import { getLiveCollection } from "astro:content";
import { fromCollectionEntry } from "@/lib/types";
import { buildTree } from "@/lib/docs-tree";

export const GET: APIRoute = async () => {
  try {
    const result = await getLiveCollection("knowledge");
    const adapted = (result.entries ?? [])
      .map((e) => fromCollectionEntry(e.id, e.data))
      .filter((d) => d.path?.startsWith("docs/"))
      .map((d) => ({
        id: d.path!.replace(/^docs\//, "").replace(/\.md$/, ""),
        data: { title: d.title } as Record<string, unknown>,
      }));

    const tree = buildTree(adapted);
    return new Response(JSON.stringify(tree), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json" },
    });
  }
};
