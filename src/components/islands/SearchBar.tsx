import { useState, useEffect, useRef, useCallback } from "react";
import type { SearchResult, ContentType } from "@/lib/types";
import { TYPE_LABELS } from "@/lib/types";

interface SearchBarProps {
  /** Pre-fill the search input (e.g. from URL params) */
  initialQuery?: string;
  /** Content type filter */
  typeFilter?: ContentType;
  /** Tag filters */
  tagFilters?: string[];
  /** Show results inline in a dropdown (true) or just emit results (false) */
  showDropdown?: boolean;
  /** Callback when results arrive (for full-page search) */
  onResults?: (results: SearchResult[], query: string) => void;
}

export default function SearchBar({
  initialQuery = "",
  typeFilter,
  tagFilters,
  showDropdown = true,
  onResults,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchResults = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setResults([]);
        onResults?.([], searchQuery);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams({ q: searchQuery });
        if (typeFilter) params.set("type", typeFilter);
        if (tagFilters?.length) params.set("tags", tagFilters.join(","));

        const res = await fetch(`/api/search?${params}`);
        if (res.ok) {
          const data = await res.json();
          // API now returns { items, total }
          const items: SearchResult[] = data.items || data || [];
          setResults(items);
          onResults?.(items, searchQuery);
        }
      } catch {
        // Network error — silently ignore
      } finally {
        setLoading(false);
      }
    },
    [typeFilter, tagFilters, onResults],
  );

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchResults(query);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, fetchResults]);

  // Re-fetch when filters change
  useEffect(() => {
    if (query.length >= 2) {
      fetchResults(query);
    }
  }, [typeFilter, tagFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cmd/Ctrl+K shortcut
  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleGlobalKey);
    return () => document.removeEventListener("keydown", handleGlobalKey);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (!showDropdown || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && selectedIndex >= 0 && results[selectedIndex]) {
      e.preventDefault();
      navigateTo(results[selectedIndex]);
    }
  }

  function navigateTo(result: SearchResult) {
    setIsOpen(false);
    window.location.href = `/${result.contentType}/${result.id}`;
  }

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          border: "1px solid var(--color-lightgray)",
          borderRadius: "0.5rem",
          backgroundColor: "var(--color-light)",
          padding: "0.5rem 0.75rem",
          gap: "0.5rem",
        }}
      >
        {/* Search icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-gray)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search... (Ctrl+K)"
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            backgroundColor: "transparent",
            color: "var(--color-dark)",
            fontFamily: "var(--font-body)",
            fontSize: "0.95rem",
          }}
        />

        {loading && (
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--color-gray)",
            }}
          >
            ...
          </span>
        )}

        {/* Keyboard shortcut hint */}
        <kbd
          style={{
            fontSize: "0.7rem",
            padding: "0.15rem 0.4rem",
            borderRadius: "0.25rem",
            border: "1px solid var(--color-lightgray)",
            color: "var(--color-gray)",
            fontFamily: "var(--font-mono)",
            lineHeight: 1,
          }}
        >
          Ctrl+K
        </kbd>
      </div>

      {/* Dropdown results */}
      {showDropdown && isOpen && results.length > 0 && (
        <ul
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 200,
            backgroundColor: "var(--color-light)",
            border: "1px solid var(--color-lightgray)",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            listStyle: "none",
            margin: 0,
            padding: "0.25rem 0",
            maxHeight: "24rem",
            overflowY: "auto",
          }}
        >
          {results.map((result, i) => (
            <li key={`${result.contentType}/${result.id}`}>
              <button
                onClick={() => navigateTo(result)}
                onMouseEnter={() => setSelectedIndex(i)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.15rem",
                  width: "100%",
                  textAlign: "left",
                  padding: "0.5rem 0.75rem",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  backgroundColor:
                    i === selectedIndex
                      ? "var(--color-highlight)"
                      : "transparent",
                  color: "var(--color-dark)",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-header)",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                    }}
                  >
                    {result.title}
                  </span>
                  <TypeBadge type={result.contentType} />
                </span>
                {result.description && (
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--color-darkgray)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {result.description}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* No results message */}
      {showDropdown && isOpen && query.length >= 2 && !loading && results.length === 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 200,
            backgroundColor: "var(--color-light)",
            border: "1px solid var(--color-lightgray)",
            borderRadius: "0.5rem",
            padding: "1rem",
            textAlign: "center",
            color: "var(--color-gray)",
            fontSize: "0.875rem",
          }}
        >
          No results found for "{query}"
        </div>
      )}
    </div>
  );
}

/** Inline type badge for search results */
function TypeBadge({ type }: { type: ContentType }) {
  return (
    <span
      style={{
        fontSize: "0.65rem",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        padding: "0.1rem 0.35rem",
        borderRadius: "0.2rem",
        backgroundColor: "var(--color-highlight)",
        color: "var(--color-secondary)",
        fontFamily: "var(--font-header)",
        whiteSpace: "nowrap",
      }}
    >
      {TYPE_LABELS[type] || type}
    </span>
  );
}
