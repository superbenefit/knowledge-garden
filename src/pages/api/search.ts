import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import type { ContentType, SearchResult } from "@/lib/types";
import { isContentType } from "@/lib/types";

export const GET: APIRoute = async ({ url }) => {
  const query = url.searchParams.get("q") || "";
  const typeFilter = url.searchParams.get("type") || "";

  if (!query || query.length < 2) {
    return new Response(JSON.stringify({ items: [], total: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const searchResult = await env.AI.autorag("knowledge-search").search({
      query,
    });

    const sources: Array<{
      filename: string;
      score: number;
      content: string[];
    }> = searchResult?.data?.sources ?? [];

    const items: SearchResult[] = [];

    for (const source of sources) {
      // R2 key format: content/{type}/{id}.json
      const match = source.filename.match(
        /^content\/([^/]+)\/([^/]+)\.json$/,
      );
      if (!match) continue;

      const [, rawType, id] = match;
      if (!isContentType(rawType)) continue;
      const contentType = rawType as ContentType;

      // Apply type filter if provided
      if (typeFilter && contentType !== typeFilter) continue;

      // Extract title from content if available, otherwise use id
      const text = source.content?.[0] ?? "";
      const firstLine = text.split("\n")[0]?.trim() ?? "";
      const title = firstLine || id;

      // Use remaining text as description snippet
      const rest = text.slice(firstLine.length).trim();
      const description = rest ? rest.slice(0, 200) : undefined;

      items.push({
        id,
        contentType,
        title,
        score: source.score,
        ...(description != null && { description }),
      });
    }

    return new Response(
      JSON.stringify({ items, total: items.length }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch {
    return new Response(JSON.stringify({ items: [], total: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }
};
