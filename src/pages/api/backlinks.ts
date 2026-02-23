export const prerender = false;

import type { APIRoute } from "astro";

// Backlink data is not yet supported by the knowledge-server.
// Returns empty array so existing components render gracefully.
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify([]), {
    headers: { "Content-Type": "application/json" },
  });
};
