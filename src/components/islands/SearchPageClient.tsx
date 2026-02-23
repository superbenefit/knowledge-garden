import { useState, useEffect, useMemo } from "react";
import SearchBar from "./SearchBar";
import FilterPanel, { type FilterState } from "./FilterPanel";
import type { SearchResult, ContentType } from "@/lib/types";
import { TYPE_LABELS } from "@/lib/types";

/** Common tags for the filter panel */
const COMMON_TAGS = [
  "governance",
  "dao",
  "web3",
  "primitives",
  "playbook",
  "knowledge",
];

export default function SearchPageClient() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    type: undefined as ContentType | undefined,
    tags: [] as string[],
  });

  // Read initial query/type from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") || "";
    const type = params.get("type") as ContentType | undefined;
    if (q) setQuery(q);
    if (type) setFilters((prev) => ({ ...prev, type }));
  }, []);

  // Update URL when query/filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (filters.type) params.set("type", filters.type);
    const qs = params.toString();
    const newUrl = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, [query, filters.type]);

  // Collect tags from results for dynamic tag chips
  const availableTags = useMemo(() => {
    const tagSet = new Set(COMMON_TAGS);
    return Array.from(tagSet).sort();
  }, []);

  function handleResults(newResults: SearchResult[], q: string) {
    setResults(newResults);
    setQuery(q);
  }

  return (
    <div>
      <SearchBar
        initialQuery={query}
        {...(filters.type ? { typeFilter: filters.type } : {})}
        {...(filters.tags.length > 0 ? { tagFilters: filters.tags } : {})}
        showDropdown={false}
        onResults={handleResults}
      />

      <FilterPanel
        availableTags={availableTags}
        filters={filters}
        onFilterChange={setFilters}
      />

      {/* Results list */}
      <div style={{ marginTop: "1rem" }}>
        {query.length >= 2 && results.length === 0 && (
          <p style={{ color: "var(--color-gray)", fontSize: "0.95rem" }}>
            No results found for "{query}"
          </p>
        )}

        {results.map((result) => (
          <a
            key={`${result.contentType}/${result.id}`}
            href={`/${result.contentType}/${result.id}`}
            style={{
              display: "block",
              padding: "0.75rem 0",
              borderBottom: "1px solid var(--color-lightgray)",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.25rem",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-header)",
                  fontWeight: 600,
                  fontSize: "1.05rem",
                  color: "var(--color-secondary)",
                }}
              >
                {result.title}
              </span>
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
                }}
              >
                {TYPE_LABELS[result.contentType] || result.contentType}
              </span>
            </div>
            {result.description && (
              <p
                style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  color: "var(--color-darkgray)",
                  lineHeight: 1.4,
                }}
              >
                {result.description}
              </p>
            )}
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--color-gray)",
              }}
            >
              /{result.contentType}/{result.id}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
