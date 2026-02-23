export const prerender = false;

import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

interface TreeNode {
  slug: string;
  title: string;
  isFolder: boolean;
  children?: TreeNode[];
}

function buildTree(
  docs: Array<{ id: string; data: Record<string, unknown> }>,
): TreeNode[] {
  const root: TreeNode[] = [];

  // Track folders we've created so we can attach children
  const folderMap = new Map<string, TreeNode>();

  // Sort docs by id for consistent ordering
  const sorted = [...docs].sort((a, b) => a.id.localeCompare(b.id));

  for (const doc of sorted) {
    const parts = doc.id.split("/");
    const title =
      (doc.data.title as string) || (parts[parts.length - 1] ?? "").replace(/-/g, " ");

    // Ensure all ancestor folders exist
    for (let i = 1; i < parts.length; i++) {
      const folderPath = parts.slice(0, i).join("/");
      if (!folderMap.has(folderPath)) {
        const folderNode: TreeNode = {
          slug: folderPath,
          title: (parts[i - 1] ?? "").replace(/-/g, " "),
          isFolder: true,
          children: [],
        };
        folderMap.set(folderPath, folderNode);

        // Attach to parent folder or root
        if (i === 1) {
          root.push(folderNode);
        } else {
          const parentPath = parts.slice(0, i - 1).join("/");
          const parent = folderMap.get(parentPath);
          parent?.children?.push(folderNode);
        }
      }
    }

    // Create the leaf node for this doc
    const leafNode: TreeNode = {
      slug: doc.id,
      title,
      isFolder: false,
    };

    if (parts.length === 1) {
      // Top-level file
      root.push(leafNode);
    } else {
      // Nested under a folder
      const parentPath = parts.slice(0, -1).join("/");
      const parent = folderMap.get(parentPath);
      parent?.children?.push(leafNode);
    }
  }

  return root;
}

export const GET: APIRoute = async () => {
  const docs = await getCollection("docs");
  const tree = buildTree(docs);

  return new Response(JSON.stringify(tree), {
    headers: { "Content-Type": "application/json" },
  });
};
