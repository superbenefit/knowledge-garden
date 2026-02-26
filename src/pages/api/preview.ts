import type { APIRoute } from "astro";
import { getLiveEntry } from "astro:content";
import { fromCollectionEntry } from "@/lib/types";

export const GET: APIRoute = async ({ url }) => {
  const contentType = url.searchParams.get("type") || "";
  const id = url.searchParams.get("id") || "";

  if (!contentType || !id) {
    return new Response(JSON.stringify(null), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const result = await getLiveEntry(
      "knowledge",
      `content/${contentType}/${id}.json`,
    );
    if (!result.entry) {
      return new Response(JSON.stringify(null), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const doc = fromCollectionEntry(result.entry.id, result.entry.data);
    return new Response(
      JSON.stringify({
        title: doc.title,
        description: doc.description || "",
        type: doc.type,
        tags: doc.tags.slice(0, 5),
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch {
    return new Response(JSON.stringify(null), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
