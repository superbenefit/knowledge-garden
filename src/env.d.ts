/// <reference path="../.astro/types.d.ts" />
/// <reference path="./modules.d.ts" />

/**
 * RPC interface for knowledge-server WorkerEntrypoint.
 * Matches the actual methods exposed by the production knowledge-server.
 */
export interface KnowledgeServerRPC {
  getDocument(params: {
    contentType: string;
    id: string;
  }): Promise<import("./lib/types").R2Document | null>;

  searchKnowledge(params: {
    query: string;
    contentType?: string;
    group?: string;
    release?: string;
    limit?: number;
  }): Promise<{
    items: import("./lib/types").ServerSearchResult[];
    total: number;
  }>;

  listGroups(): Promise<{
    groups: Array<{ id: string; title: string; description?: string }>;
  }>;

  listReleases(): Promise<{
    releases: Array<{ id: string; title: string; description?: string }>;
  }>;

  defineTerm(params: { term: string }): Promise<{
    term: string;
    definition: string | null;
  }>;
}

/**
 * Cloudflare Workers environment bindings.
 * In Astro v6 + @astrojs/cloudflare v13, access via:
 *   import { env } from "cloudflare:workers"
 */
export interface Env {
  KNOWLEDGE_SERVER: Service<KnowledgeServerRPC>;
}
