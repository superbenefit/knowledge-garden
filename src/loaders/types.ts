/** Options for listing documents via the live loader */
export interface ListOptions {
  limit?: number;
  offset?: number;
  sort?: "title" | "created" | "modified";
  order?: "asc" | "desc";
  type?: string;
}

/** Options for searching documents */
export interface SearchOptions {
  query: string;
  limit?: number;
  type?: string;
  tags?: string[];
}

/** A search result from the knowledge server */
export interface SearchResult {
  slug: string;
  title: string;
  description?: string;
  type: string;
  score: number;
  highlights?: string[];
}
