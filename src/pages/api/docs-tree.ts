export const prerender = false;

import type { APIRoute } from "astro";
import { getKnowledgeClient, safeCall } from "@/lib/rpc";
import { buildTree } from "@/lib/docs-tree";

export const GET: APIRoute = async () => {
  const client = getKnowledgeClient();
  const result = await safeCall(
    () => client.listEntries({ sourcePath: "docs/" }),
    { data: [], total: 0 },
  );

  const adapted = result.data
    .filter((d) => d.path)
    .map((d) => ({
      id: d.path!.replace(/^docs\//, "").replace(/\.md$/, ""),
      data: { title: d.title } as Record<string, unknown>,
    }));

  const tree = buildTree(adapted);
  return new Response(JSON.stringify(tree), {
    headers: { "Content-Type": "application/json" },
  });
};
