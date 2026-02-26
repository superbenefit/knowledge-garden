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
// Adapter: live collection entry → garden Document
// ---------------------------------------------------------------------------

/** Convert a live collection entry's data to a garden Document.
 *  The entry data shape comes from the R2 knowledge loader:
 *  { ...metadata, contentType, path, body } */
export function fromCollectionEntry(
  entryId: string,
  data: Record<string, unknown>,
): Document {
  // Extract document id from R2 key:
  //   content/{type}/{id}.json → {id}
  //   indexes/{id}.json        → {id}
  let docId: string;
  if (entryId.startsWith("indexes/")) {
    docId = entryId.replace(/^indexes\//, "").replace(/\.json$/, "");
  } else {
    docId = entryId.replace(/^content\/[^/]+\//, "").replace(/\.json$/, "");
  }
  const ct = (data.contentType as string) || "file";
  return {
    id: docId,
    type: ct as ContentType,
    category: getCategory(ct),
    title: (data.title as string) || docId,
    ...(data.description != null && { description: data.description as string }),
    body: (data.body as string) || "",
    ...(data.path != null && { path: data.path as string }),
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    aliases: Array.isArray(data.aliases) ? (data.aliases as string[]) : [],
    ...(data.created != null && { created: String(data.created) }),
    ...(data.modified != null && { modified: String(data.modified) }),
    ...(data.date != null && !data.created && { created: String(data.date) }),
    ...(data.group != null && { group: data.group as string }),
    ...(data.banner != null && { banner: data.banner as string }),
    ...(data.license != null && { license: data.license as string }),
    frontmatter: data,
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
