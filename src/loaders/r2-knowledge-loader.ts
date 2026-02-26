import type { R2Document } from "@superbenefit/knowledge-schemas";
import { env } from "cloudflare:workers";

export function r2KnowledgeLoader() {
  return {
    name: "r2-knowledge-loader",

    async loadCollection() {
      const bucket = env.KNOWLEDGE_BUCKET;
      const [contentListed, indexListed] = await Promise.all([
        bucket.list({ prefix: "content/" }),
        bucket.list({ prefix: "indexes/" }),
      ]);
      const allObjects = [...contentListed.objects, ...indexListed.objects];
      const entries = await Promise.all(
        allObjects.map(async (obj: { key: string }) => {
          const item = await bucket.get(obj.key);
          if (!item) return null;
          const doc: R2Document = await item.json();
          return {
            id: obj.key,
            data: {
              ...doc.metadata,
              contentType: doc.contentType,
              path: doc.path,
              // Omit body in collection listing for performance.
              // Use getLiveEntry() when the full body is needed.
              body: "",
            },
          };
        }),
      );
      return {
        entries: entries.filter(
          (e): e is NonNullable<typeof e> => e !== null,
        ),
      };
    },

    async loadEntry({ filter }: { filter: { id: string } }) {
      const item = await env.KNOWLEDGE_BUCKET.get(filter.id);
      if (!item) return undefined;
      const doc: R2Document = await item.json();
      return {
        id: filter.id,
        data: {
          ...doc.metadata,
          contentType: doc.contentType,
          path: doc.path,
          body: doc.content,
        },
      };
    },
  };
}
