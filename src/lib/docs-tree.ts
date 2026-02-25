export interface TreeNode {
  slug: string;
  title: string;
  isFolder: boolean;
  children?: TreeNode[];
}

export function buildTree(
  docs: Array<{ id: string; data: Record<string, unknown> }>,
): TreeNode[] {
  // Deduplicate entries by id (multiple R2 entries can share the same path)
  const deduped = new Map<string, (typeof docs)[number]>();
  for (const doc of docs) {
    if (!deduped.has(doc.id)) deduped.set(doc.id, doc);
  }

  const root: TreeNode[] = [];
  const folderMap = new Map<string, TreeNode>();
  const leafSlugs = new Set<string>();
  const sorted = [...deduped.values()].sort((a, b) =>
    a.id.localeCompare(b.id),
  );

  for (const doc of sorted) {
    const parts = doc.id.split("/");
    const title =
      (doc.data.title as string) ||
      (parts[parts.length - 1] ?? "").replace(/-/g, " ");

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

        // A leaf with this slug may already exist — promote it to a folder
        if (i === 1) {
          const idx = root.findIndex(
            (n) => !n.isFolder && n.slug === folderPath,
          );
          if (idx !== -1) {
            folderNode.title = root[idx]!.title;
            root[idx] = folderNode;
          } else {
            root.push(folderNode);
          }
        } else {
          const parentPath = parts.slice(0, i - 1).join("/");
          const parent = folderMap.get(parentPath);
          if (parent?.children) {
            const idx = parent.children.findIndex(
              (n) => !n.isFolder && n.slug === folderPath,
            );
            if (idx !== -1) {
              folderNode.title = parent.children[idx]!.title;
              parent.children[idx] = folderNode;
            } else {
              parent.children.push(folderNode);
            }
          }
        }
      }
    }

    // index entries provide the folder title instead of appearing as leaves
    if (parts[parts.length - 1] === "index") {
      const folderPath = parts.slice(0, -1).join("/");
      const folder = folderMap.get(folderPath);
      if (folder) folder.title = title;
      continue;
    }

    // Skip if a folder already exists at this slug (promoted from leaf earlier)
    if (folderMap.has(doc.id)) continue;

    // Skip duplicate leaves
    if (leafSlugs.has(doc.id)) continue;
    leafSlugs.add(doc.id);

    const leafNode: TreeNode = { slug: doc.id, title, isFolder: false };

    if (parts.length === 1) {
      root.push(leafNode);
    } else {
      const parentPath = parts.slice(0, -1).join("/");
      const parent = folderMap.get(parentPath);
      parent?.children?.push(leafNode);
    }
  }

  return root;
}
