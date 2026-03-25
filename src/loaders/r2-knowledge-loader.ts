import type { Loader } from "astro/loaders";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";

interface Manifest {
  metadata: {
    keys: string[];
    indexKeys: string[];
    attachmentKeys: string[];
  };
}

export function r2KnowledgeLoader({ bucketUrl }: { bucketUrl: string }): Loader {
  return {
    name: "r2-knowledge-loader",
    async load({ store, logger }) {
      if (!bucketUrl) {
        throw new Error("R2_BUCKET_URL environment variable is not set");
      }

      store.clear();

      const manifestRes = await fetch(`${bucketUrl}/indexes/all-content.json`);
      if (!manifestRes.ok) throw new Error(`Manifest fetch failed: ${manifestRes.status}`);
      const manifest = (await manifestRes.json()) as Manifest;
      const keys = manifest.metadata.keys as string[];
      const indexKeys = (manifest.metadata.indexKeys as string[]) ?? [];
      const attachmentKeys = (manifest.metadata.attachmentKeys as string[]) ?? [];
      logger.info(`Manifest: ${keys.length} content keys, ${indexKeys.length} index keys, ${attachmentKeys.length} attachment keys`);

      const allDocKeys = [...keys, ...indexKeys];
      await Promise.all(
        allDocKeys.map(async (key) => {
          const res = await fetch(`${bucketUrl}/${key}`);
          if (!res.ok) {
            logger.warn(`Skipping ${key}: ${res.status}`);
            return;
          }
          const doc = await res.json();
          store.set({
            id: key,
            data: {
              ...doc.metadata,
              contentType: doc.contentType,
              path: doc.path,
              body: doc.content,
            },
          });
        }),
      );

      const attachmentsDir = join(process.cwd(), "public", "attachments");
      mkdirSync(attachmentsDir, { recursive: true });

      for (const key of attachmentKeys) {
        const res = await fetch(`${bucketUrl}/${key}`);
        if (!res.ok) {
          logger.warn(`Skipping attachment ${key}: ${res.status}`);
          continue;
        }
        const buffer = await res.arrayBuffer();
        const relativePath = key.replace(/^attachments\//, "");
        const filePath = join(attachmentsDir, relativePath);
        mkdirSync(dirname(filePath), { recursive: true });
        writeFileSync(filePath, Buffer.from(buffer));
      }

      logger.info(`Loaded entries from R2`);
    },
  };
}
