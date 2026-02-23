import { useState, useEffect, useCallback } from "react";

export interface TreeNode {
  slug: string;
  title: string;
  isFolder: boolean;
  children?: TreeNode[];
}

interface DocsTreeNavProps {
  items: TreeNode[];
  currentSlug?: string;
}

const STORAGE_KEY = "docs-tree-open-state";

function loadOpenState(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return new Set(JSON.parse(stored));
  } catch {
    // ignore
  }
  return new Set<string>();
}

function saveOpenState(open: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...open]));
  } catch {
    // ignore
  }
}

function sortNodes(nodes: TreeNode[]): TreeNode[] {
  return [...nodes].sort((a, b) => {
    // Folders first, then alphabetical
    if (a.isFolder && !b.isFolder) return -1;
    if (!a.isFolder && b.isFolder) return 1;
    return a.title.localeCompare(b.title);
  });
}

function TreeItem({
  node,
  currentSlug,
  openFolders,
  toggleFolder,
  depth,
}: {
  node: TreeNode;
  currentSlug?: string | undefined;
  openFolders: Set<string>;
  toggleFolder: (slug: string) => void;
  depth: number;
}) {
  const isOpen = openFolders.has(node.slug);
  const isCurrent = currentSlug === node.slug;
  const sortedChildren = node.children ? sortNodes(node.children) : [];

  return (
    <li style={{ listStyle: "none" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          paddingLeft: `${depth * 0.75}rem`,
        }}
      >
        {node.isFolder ? (
          <button
            onClick={() => toggleFolder(node.slug)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              width: "100%",
              padding: "0.2rem 0.35rem",
              border: "none",
              borderRadius: "0.25rem",
              background: "transparent",
              color: "var(--color-dark)",
              fontFamily: "var(--font-body)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-highlight)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "1em",
                textAlign: "center",
                fontSize: "0.65rem",
                transition: "transform 150ms ease",
                transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                flexShrink: 0,
              }}
            >
              &#9654;
            </span>
            {node.title}
          </button>
        ) : (
          <a
            href={`/docs/${node.slug}`}
            style={{
              display: "block",
              width: "100%",
              padding: "0.2rem 0.35rem",
              paddingLeft: "calc(0.35rem + 1em + 0.25rem)",
              borderRadius: "0.25rem",
              fontFamily: "var(--font-body)",
              fontSize: "0.8125rem",
              color: isCurrent
                ? "var(--color-secondary)"
                : "var(--color-darkgray)",
              fontWeight: isCurrent ? 600 : 400,
              backgroundColor: isCurrent
                ? "var(--color-highlight)"
                : "transparent",
              textDecoration: "none",
            }}
            onMouseOver={(e) => {
              if (!isCurrent) {
                e.currentTarget.style.backgroundColor =
                  "var(--color-highlight)";
              }
            }}
            onMouseOut={(e) => {
              if (!isCurrent) {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            {node.title}
          </a>
        )}
      </div>

      {node.isFolder && isOpen && sortedChildren.length > 0 && (
        <ul style={{ padding: 0, margin: 0 }}>
          {sortedChildren.map((child) => (
            <TreeItem
              key={child.slug}
              node={child}
              currentSlug={currentSlug}
              openFolders={openFolders}
              toggleFolder={toggleFolder}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function DocsTreeNav({ items, currentSlug }: DocsTreeNavProps) {
  const [openFolders, setOpenFolders] = useState<Set<string>>(() => {
    // Auto-expand ancestors of the current page
    const initial = loadOpenState();
    if (currentSlug) {
      const parts = currentSlug.split("/");
      for (let i = 1; i < parts.length; i++) {
        initial.add(parts.slice(0, i).join("/"));
      }
    }
    return initial;
  });

  const toggleFolder = useCallback((slug: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    saveOpenState(openFolders);
  }, [openFolders]);

  const sorted = sortNodes(items);

  return (
    <nav style={{ fontSize: "0.8125rem" }}>
      <h3
        style={{
          fontSize: "0.875rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--color-darkgray)",
          margin: "0 0 0.5rem 0",
          fontFamily: "var(--font-header)",
        }}
      >
        Docs
      </h3>
      <ul style={{ padding: 0, margin: 0 }}>
        {sorted.map((node) => (
          <TreeItem
            key={node.slug}
            node={node}
            currentSlug={currentSlug}
            openFolders={openFolders}
            toggleFolder={toggleFolder}
            depth={0}
          />
        ))}
      </ul>
    </nav>
  );
}
