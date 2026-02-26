import type { APIRoute } from "astro";

// Graph data is not yet supported by the knowledge-server.
// Returns empty graph so existing GraphView renders gracefully.
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ nodes: [], links: [] }), {
    headers: { "Content-Type": "application/json" },
  });
};
