import type {
  Document,
  SearchResult,
  ListParams,
  ListResponse,
  SearchParams,
  R2Document,
  ServerSearchResult,
} from "./types";
import { toDocument, toSearchResult } from "./types";
import { createStubClient } from "./rpc-stub";

// ---------------------------------------------------------------------------
// KnowledgeClient — unified interface for the garden
// ---------------------------------------------------------------------------

export interface KnowledgeClient {
  getDocument(
    contentType: string,
    id: string,
  ): Promise<Document | null>;

  listEntries(params?: ListParams): Promise<ListResponse>;

  search(
    query: string,
    opts?: SearchParams,
  ): Promise<{ items: SearchResult[]; total: number }>;

  listGroups(): Promise<
    Array<{ id: string; title: string; description?: string }>
  >;

  listReleases(): Promise<
    Array<{ id: string; title: string; description?: string }>
  >;
}

// ---------------------------------------------------------------------------
// Client factory
// ---------------------------------------------------------------------------

let _cached: KnowledgeClient | undefined;

export function getKnowledgeClient(): KnowledgeClient {
  if (_cached) return _cached;

  // Try service binding first (works in production AND wrangler dev)
  try {
    const client = createServiceBindingClient();
    _cached = client;
    return _cached;
  } catch {
    // Service binding not available — fall back to stub for offline dev
    _cached = createStubClient();
    return _cached;
  }
}

/** Safe wrapper — catches errors and returns a fallback value */
export async function safeCall<T>(
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error("[KnowledgeClient Error]", err);
    return fallback;
  }
}

// Aliases so existing call-sites compile during incremental migration
export { getKnowledgeClient as getKnowledgeServer };
export { safeCall as safeRPC };

// ---------------------------------------------------------------------------
// Service binding client (Cloudflare Workers — production & wrangler dev)
// ---------------------------------------------------------------------------

function createServiceBindingClient(): KnowledgeClient {
  // Resolve the Cloudflare env eagerly so we fail fast if not available
  let _env: any;

  function getEnv() {
    if (_env) return _env;

    // @astrojs/cloudflare v13 exposes env on globalThis at runtime
    _env = (globalThis as any).__cloudflare_env__;
    if (_env?.KNOWLEDGE_SERVER) return _env;

    // Cloudflare Workers module scope
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      _env = require("cloudflare:workers").env;
      if (_env?.KNOWLEDGE_SERVER) return _env;
    } catch {
      // not in Workers runtime
    }

    throw new Error("KNOWLEDGE_SERVER binding not available");
  }

  return {
    async getDocument(contentType, id) {
      const env = getEnv();
      const raw: R2Document | null = await env.KNOWLEDGE_SERVER.getDocument({
        contentType,
        id,
      });
      return raw ? toDocument(raw) : null;
    },

    async listEntries(params) {
      const env = getEnv();
      const qs = new URLSearchParams();
      if (params?.contentType) qs.set("contentType", params.contentType);
      if (params?.group) qs.set("group", params.group);
      if (params?.release) qs.set("release", params.release);
      if (params?.limit) qs.set("limit", String(params.limit));
      if (params?.offset) qs.set("offset", String(params.offset));

      // listEntries is REST-only on the server; use .fetch() on the binding
      const res = await env.KNOWLEDGE_SERVER.fetch(
        new Request(`https://fake-host/api/v1/entries?${qs}`),
      );
      const json = (await res.json()) as {
        data: R2Document[];
        total: number;
      };
      return { data: json.data.map(toDocument), total: json.total };
    },

    async search(query, opts) {
      const env = getEnv();
      const result = (await env.KNOWLEDGE_SERVER.searchKnowledge({
        query,
        ...(opts?.contentType != null && { contentType: opts.contentType }),
        ...(opts?.group != null && { group: opts.group }),
        ...(opts?.release != null && { release: opts.release }),
        ...(opts?.limit != null && { limit: opts.limit }),
      })) as { items: ServerSearchResult[]; total: number };
      return {
        items: result.items.map(toSearchResult),
        total: result.total,
      };
    },

    async listGroups() {
      const env = getEnv();
      const result = (await env.KNOWLEDGE_SERVER.listGroups()) as {
        groups: Array<{ id: string; title: string; description?: string }>;
      };
      return result.groups;
    },

    async listReleases() {
      const env = getEnv();
      const result = (await env.KNOWLEDGE_SERVER.listReleases()) as {
        releases: Array<{ id: string; title: string; description?: string }>;
      };
      return result.releases;
    },
  };
}
