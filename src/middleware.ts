import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Immutable cache for Astro-hashed static assets
  const url = new URL(context.request.url);
  if (url.pathname.startsWith("/_astro/")) {
    response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  }

  return response;
});
