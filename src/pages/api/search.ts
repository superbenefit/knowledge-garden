export const prerender = false;

import type { APIRoute } from "astro";

// TODO: implement with env.AI once CF AI Search API is confirmed
export const GET: APIRoute = async ({ url }) => {
  const query = url.searchParams.get("q") || "";

  if (!query || query.length < 2) {
    return new Response(JSON.stringify({ items: [], total: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Stubbed — AI binding is wired but search implementation pending
  return new Response(JSON.stringify({ items: [], total: 0 }), {
    headers: { "Content-Type": "application/json" },
  });
};
