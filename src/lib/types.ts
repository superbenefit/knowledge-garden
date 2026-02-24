/** Content type identifiers matching the knowledge-server's canonical types */
export type ContentType =
  | "file"
  | "reference"
  | "index"
  | "link"
  | "tag"
  | "resource"
  | "pattern"
  | "practice"
  | "primitive"
  | "protocol"
  | "playbook"
  | "question"
  | "story"
  | "study"
  | "article"
  | "guide"
  | "data"
  | "person"
  | "group"
  | "project"
  | "place"
  | "gathering";

/** Category groupings derived from content type */
export type TypeCategory =
  | "resource"
  | "story"
  | "reference"
  | "data"
  | "question"
  | "file";

/** Category constants matching the knowledge-server */
export const RESOURCE_TYPES: ContentType[] = [
  "pattern",
  "practice",
  "primitive",
  "protocol",
  "playbook",
];
export const STORY_TYPES: ContentType[] = ["study", "article", "guide"];
export const REFERENCE_TYPES: ContentType[] = ["index", "link", "tag"];
export const DATA_TYPES: ContentType[] = [
  "person",
  "group",
  "project",
  "place",
  "gathering",
];

/** All concrete content types that appear in listings/search (excludes parent types) */
export const ALL_CONTENT_TYPES: ContentType[] = [
  ...RESOURCE_TYPES,
  ...STORY_TYPES,
  ...REFERENCE_TYPES,
  ...DATA_TYPES,
  "question",
  "file",
];

/** Derive category from content type */
export function getCategory(type: ContentType | string): TypeCategory {
  if (RESOURCE_TYPES.includes(type as ContentType)) return "resource";
  if (STORY_TYPES.includes(type as ContentType)) return "story";
  if (REFERENCE_TYPES.includes(type as ContentType)) return "reference";
  if (DATA_TYPES.includes(type as ContentType)) return "data";
  if (type === "question") return "question";
  if (type === "resource" || type === "story" || type === "data")
    return type as TypeCategory;
  return "file";
}

/** Check if a string is a valid ContentType */
export function isContentType(value: string): value is ContentType {
  return (
    ALL_CONTENT_TYPES.includes(value as ContentType) ||
    value === "resource" ||
    value === "story" ||
    value === "data"
  );
}

// ---------------------------------------------------------------------------
// Server types — match knowledge-server's actual response shapes
// ---------------------------------------------------------------------------

/** Document as stored in R2 and returned by the knowledge-server */
export interface R2Document {
  id: string;
  contentType: ContentType;
  path: string;
  metadata: Record<string, unknown>;
  content: string;
  syncedAt: string;
  commitSha: string;
}

/** Search result returned by the knowledge-server */
export interface ServerSearchResult {
  id: string;
  contentType: ContentType;
  title: string;
  description?: string;
  score: number;
  rerankScore?: number;
}

// ---------------------------------------------------------------------------
// Garden types — what the garden's pages and components consume
// ---------------------------------------------------------------------------

/** A document adapted for garden display */
export interface Document {
  id: string;
  type: ContentType;
  category: TypeCategory;
  title: string;
  description?: string;
  body: string;
  path?: string;
  tags: string[];
  aliases: string[];
  created?: string;
  modified?: string;
  group?: string;
  banner?: string;
  license?: string;
  frontmatter: Record<string, unknown>;
}

/** A search result adapted for garden display */
export interface SearchResult {
  id: string;
  contentType: ContentType;
  title: string;
  description?: string;
  score: number;
}

/** Options for listing entries */
export interface ListParams {
  contentType?: string;
  group?: string;
  release?: string;
  limit?: number;
  offset?: number;
  sourcePath?: string;
}

/** Paginated list response */
export interface ListResponse {
  data: Document[];
  total: number;
}

/** Search params */
export interface SearchParams {
  contentType?: string;
  group?: string;
  release?: string;
  limit?: number;
}

/** Graph node (kept for future use) */
export interface GraphNode {
  id: string;
  title: string;
  type: ContentType;
  tags: string[];
}

/** Graph link (kept for future use) */
export interface GraphLink {
  source: string;
  target: string;
}

/** Graph data (kept for future use) */
export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// ---------------------------------------------------------------------------
// Adapter: R2Document → garden Document
// ---------------------------------------------------------------------------

/** Convert a knowledge-server R2Document to a garden Document */
export function toDocument(doc: R2Document): Document {
  const m = doc.metadata;
  return {
    id: doc.id,
    type: doc.contentType,
    category: getCategory(doc.contentType),
    title: (m.title as string) || doc.id,
    ...(m.description != null && { description: m.description as string }),
    body: doc.content,
    ...(doc.path != null && { path: doc.path }),
    tags: Array.isArray(m.tags) ? (m.tags as string[]) : [],
    aliases: Array.isArray(m.aliases) ? (m.aliases as string[]) : [],
    ...(m.created != null && { created: String(m.created) }),
    ...(m.modified != null && { modified: String(m.modified) }),
    ...(m.date != null && !m.created && { created: String(m.date) }),
    ...(m.group != null && { group: m.group as string }),
    ...(m.banner != null && { banner: m.banner as string }),
    ...(m.license != null && { license: m.license as string }),
    frontmatter: m,
  };
}

/** Convert a ServerSearchResult to a garden SearchResult */
export function toSearchResult(r: ServerSearchResult): SearchResult {
  return {
    id: r.id,
    contentType: r.contentType,
    title: r.title,
    ...(r.description != null && { description: r.description }),
    score: r.rerankScore ?? r.score,
  };
}

/** Human-readable labels for content types */
export const TYPE_LABELS: Record<ContentType, string> = {
  file: "File",
  reference: "Reference",
  index: "Index",
  link: "Link",
  tag: "Tag",
  resource: "Resource",
  pattern: "Pattern",
  practice: "Practice",
  primitive: "Primitive",
  protocol: "Protocol",
  playbook: "Playbook",
  question: "Question",
  story: "Story",
  study: "Study",
  article: "Article",
  guide: "Guide",
  data: "Data",
  person: "Person",
  group: "Group",
  project: "Project",
  place: "Place",
  gathering: "Gathering",
};
