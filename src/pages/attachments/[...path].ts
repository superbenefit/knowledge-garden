export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

const mimeTypes: Record<string, string> = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  mp4: "video/mp4",
};

export const GET: APIRoute = async ({ params }) => {
  const path = params.path;
  if (!path) {
    return new Response(null, { status: 404 });
  }

  const object = await env.KNOWLEDGE_BUCKET.get("attachments/" + path);
  if (!object) {
    return new Response(null, { status: 404 });
  }

  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const contentType = mimeTypes[ext] ?? "application/octet-stream";

  return new Response(object.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
};
