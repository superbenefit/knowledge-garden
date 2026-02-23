export const prerender = false;

import type { APIRoute } from "astro";
import type { SearchParams } from "@/lib/types";
import { getKnowledgeClient, safeCall } from "@/lib/rpc";

export const GET: APIRoute = async ({ url }) => {
  const query = url.searchParams.get("q") || "";
  const contentType = url.searchParams.get("type") || undefined;
  const group = url.searchParams.get("group") || undefined;
  const limit = parseInt(url.searchParams.get("limit") || "20", 10);

  if (!query || query.length < 2) {
    return new Response(JSON.stringify({ items: [], total: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const opts: SearchParams = { limit };
  if (contentType) opts.contentType = contentType;
  if (group) opts.group = group;

  const client = getKnowledgeClient();
  const result = await safeCall(
    () => client.search(query, opts),
    { items: [], total: 0 },
  );

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
};
