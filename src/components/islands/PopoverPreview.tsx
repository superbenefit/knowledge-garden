import { useEffect, useRef, useCallback } from "react";

interface PreviewData {
  title: string;
  description: string;
  type: string;
  tags: string[];
}

const cache = new Map<string, PreviewData | null>();

export default function PopoverPreview() {
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const showTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const activeTarget = useRef<HTMLElement | null>(null);

  const hidePopover = useCallback(() => {
    clearTimeout(showTimeout.current);
    if (popoverRef.current) {
      popoverRef.current.style.display = "none";
    }
    activeTarget.current = null;
  }, []);

  const positionPopover = useCallback((target: HTMLElement) => {
    const popover = popoverRef.current;
    if (!popover) return;

    const rect = target.getBoundingClientRect();
    const popoverHeight = popover.offsetHeight;
    const spaceAbove = rect.top;
    const showAbove = spaceAbove > popoverHeight + 8;

    popover.style.left = `${rect.left + window.scrollX}px`;
    popover.style.maxWidth = `${Math.min(320, window.innerWidth - 32)}px`;

    if (showAbove) {
      popover.style.top = `${rect.top + window.scrollY - popoverHeight - 8}px`;
    } else {
      popover.style.top = `${rect.bottom + window.scrollY + 8}px`;
    }
  }, []);

  const showPopover = useCallback(
    async (target: HTMLElement, slug: string) => {
      const popover = popoverRef.current;
      if (!popover) return;

      let data: PreviewData | null;
      const cached = cache.get(slug);
      if (cached !== undefined) {
        data = cached;
      } else {
        try {
          const res = await fetch(`/api/preview?slug=${encodeURIComponent(slug)}`);
          if (res.ok) {
            data = await res.json();
          } else {
            data = null;
          }
        } catch {
          data = null;
        }
        cache.set(slug, data);
      }

      // Target may have changed while fetching
      if (activeTarget.current !== target) return;

      if (!data) {
        hidePopover();
        return;
      }

      popover.innerHTML = `
        <div style="font-family: var(--font-header); font-weight: 600; font-size: 0.9rem; margin-bottom: 0.25rem; color: var(--color-dark);">
          ${escapeHtml(data.title)}
        </div>
        ${
          data.description
            ? `<div style="font-size: 0.8rem; color: var(--color-darkgray); line-height: 1.4;">
                ${escapeHtml(data.description.slice(0, 150))}${data.description.length > 150 ? "..." : ""}
              </div>`
            : ""
        }
        ${
          data.tags.length > 0
            ? `<div style="display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: 0.35rem;">
                ${data.tags
                  .map(
                    (tag) =>
                      `<span style="font-size: 0.65rem; padding: 0.1rem 0.3rem; border-radius: 0.2rem; background: var(--color-highlight); color: var(--color-secondary); font-family: var(--font-header); font-weight: 600;">${escapeHtml(tag)}</span>`,
                  )
                  .join("")}
              </div>`
            : ""
        }
      `;

      popover.style.display = "block";
      positionPopover(target);
    },
    [hidePopover, positionPopover],
  );

  useEffect(() => {
    // Create popover element
    const popover = document.createElement("div");
    popover.style.cssText = `
      display: none;
      position: absolute;
      z-index: 300;
      background: var(--color-light);
      border: 1px solid var(--color-lightgray);
      border-radius: 0.5rem;
      padding: 0.75rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      pointer-events: none;
      max-width: 320px;
    `;
    document.body.appendChild(popover);
    popoverRef.current = popover;

    function handleMouseEnter(e: Event) {
      const target = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-preview-slug]",
      );
      if (!target) return;

      const slug = target.dataset.previewSlug;
      if (!slug) return;

      activeTarget.current = target;
      clearTimeout(showTimeout.current);
      showTimeout.current = setTimeout(() => {
        showPopover(target, slug);
      }, 300);
    }

    function handleMouseLeave(e: Event) {
      const target = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-preview-slug]",
      );
      if (!target) return;
      hidePopover();
    }

    document.addEventListener("mouseover", handleMouseEnter);
    document.addEventListener("mouseout", handleMouseLeave);

    return () => {
      document.removeEventListener("mouseover", handleMouseEnter);
      document.removeEventListener("mouseout", handleMouseLeave);
      clearTimeout(showTimeout.current);
      popover.remove();
    };
  }, [showPopover, hidePopover]);

  // This component renders nothing visible — it just attaches behavior
  return null;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
