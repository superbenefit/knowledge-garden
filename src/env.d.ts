/// <reference path="../.astro/types.d.ts" />
/// <reference path="./modules.d.ts" />

/**
 * Cloudflare Workers environment bindings.
 * In Astro v6 + @astrojs/cloudflare v13, access via:
 *   import { env } from "cloudflare:workers"
 */
export interface Env {
  KNOWLEDGE_BUCKET: R2Bucket;
  AI: Ai;
}
