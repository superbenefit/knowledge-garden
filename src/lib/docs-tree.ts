export interface TreeNode {
  slug: string;
  title: string;
  isFolder: boolean;
  children?: TreeNode[];
}

export function buildTree(
  docs: Array<{ id: string; data: Record<string, unknown> }>,
): TreeNode[] {
  const root: TreeNode[] = [];
  const folderMap = new Map<string, TreeNode>();
  const sorted = [...docs].sort((a, b) => a.id.localeCompare(b.id));

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

        if (i === 1) {
          root.push(folderNode);
        } else {
          const parentPath = parts.slice(0, i - 1).join("/");
          const parent = folderMap.get(parentPath);
          parent?.children?.push(folderNode);
        }
      }
    }

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
