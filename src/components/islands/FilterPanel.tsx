import type { ContentType } from "@/lib/types";
import { ALL_CONTENT_TYPES, TYPE_LABELS } from "@/lib/types";

export interface FilterState {
  type: ContentType | undefined;
  tags: string[];
}

interface FilterPanelProps {
  /** Available tags to display as chips */
  availableTags?: string[];
  /** Current filter state */
  filters: FilterState;
  /** Called when any filter changes */
  onFilterChange: (filters: FilterState) => void;
}

export default function FilterPanel({
  availableTags = [],
  filters,
  onFilterChange,
}: FilterPanelProps) {
  function handleTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    onFilterChange({
      ...filters,
      type: value ? (value as ContentType) : undefined,
    });
  }

  function toggleTag(tag: string) {
    const currentTags = filters.tags;
    const next = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    onFilterChange({ ...filters, tags: next });
  }

  function clearFilters() {
    onFilterChange({ type: undefined, tags: [] });
  }

  const hasActiveFilters = filters.type || filters.tags.length > 0;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 0",
      }}
    >
      {/* Type dropdown */}
      <select
        value={filters.type || ""}
        onChange={handleTypeChange}
        style={{
          padding: "0.35rem 0.5rem",
          borderRadius: "0.375rem",
          border: "1px solid var(--color-lightgray)",
          backgroundColor: "var(--color-light)",
          color: "var(--color-dark)",
          fontFamily: "var(--font-body)",
          fontSize: "0.85rem",
          cursor: "pointer",
        }}
      >
        <option value="">All types</option>
        {ALL_CONTENT_TYPES.map((t) => (
          <option key={t} value={t}>
            {TYPE_LABELS[t]}
          </option>
        ))}
      </select>

      {/* Tag chips */}
      {availableTags.map((tag) => {
        const isActive = filters.tags.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            style={{
              padding: "0.2rem 0.6rem",
              borderRadius: "1rem",
              border: "1px solid",
              borderColor: isActive
                ? "var(--color-secondary)"
                : "var(--color-lightgray)",
              backgroundColor: isActive
                ? "var(--color-highlight)"
                : "transparent",
              color: isActive
                ? "var(--color-secondary)"
                : "var(--color-darkgray)",
              fontFamily: "var(--font-body)",
              fontSize: "0.8rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 150ms ease",
            }}
          >
            {tag}
          </button>
        );
      })}

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          style={{
            padding: "0.2rem 0.5rem",
            borderRadius: "0.25rem",
            border: "none",
            backgroundColor: "transparent",
            color: "var(--color-gray)",
            fontFamily: "var(--font-body)",
            fontSize: "0.8rem",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
