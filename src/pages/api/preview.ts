export const prerender = false;

import type { APIRoute } from "astro";
import { getKnowledgeClient, safeCall } from "@/lib/rpc";

export const GET: APIRoute = async ({ url }) => {
  const contentType = url.searchParams.get("type") || "";
  const id = url.searchParams.get("id") || "";

  if (!contentType || !id) {
    return new Response(JSON.stringify(null), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const client = getKnowledgeClient();
  const doc = await safeCall(
    () => client.getDocument(contentType, id),
    null,
  );

  if (!doc) {
    return new Response(JSON.stringify(null), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      title: doc.title,
      description: doc.description || "",
      type: doc.type,
      tags: doc.tags.slice(0, 5),
    }),
    { headers: { "Content-Type": "application/json" } },
  );
};
