import { describe, it, expect } from "vitest";
import {
  getCategory,
  isContentType,
  toDocument,
  toSearchResult,
  RESOURCE_TYPES,
  STORY_TYPES,
  REFERENCE_TYPES,
  DATA_TYPES,
  ALL_CONTENT_TYPES,
  TYPE_LABELS,
  type R2Document,
  type ServerSearchResult,
} from "@/lib/types";

describe("types", () => {
  describe("getCategory", () => {
    it("returns 'resource' for resource types", () => {
      for (const t of RESOURCE_TYPES) {
        expect(getCategory(t)).toBe("resource");
      }
    });

    it("returns 'story' for story types", () => {
      for (const t of STORY_TYPES) {
        expect(getCategory(t)).toBe("story");
      }
    });

    it("returns 'reference' for reference types", () => {
      for (const t of REFERENCE_TYPES) {
        expect(getCategory(t)).toBe("reference");
      }
    });

    it("returns 'data' for data types", () => {
      for (const t of DATA_TYPES) {
        expect(getCategory(t)).toBe("data");
      }
    });

    it("returns 'question' for question type", () => {
      expect(getCategory("question")).toBe("question");
    });

    it("returns 'file' for file type", () => {
      expect(getCategory("file")).toBe("file");
    });

    it("returns parent category for parent type strings", () => {
      expect(getCategory("resource")).toBe("resource");
      expect(getCategory("story")).toBe("story");
      expect(getCategory("data")).toBe("data");
    });

    it("returns 'file' for unknown types", () => {
      expect(getCategory("unknown_xyz")).toBe("file");
    });
  });

  describe("isContentType", () => {
    it("returns true for all content types in ALL_CONTENT_TYPES", () => {
      for (const t of ALL_CONTENT_TYPES) {
        expect(isContentType(t)).toBe(true);
      }
    });

    it("returns true for parent types", () => {
      expect(isContentType("resource")).toBe(true);
      expect(isContentType("story")).toBe(true);
      expect(isContentType("data")).toBe(true);
    });

    it("returns false for unknown strings", () => {
      expect(isContentType("")).toBe(false);
      expect(isContentType("unknown")).toBe(false);
      expect(isContentType("note")).toBe(false);
    });
  });

  describe("toDocument", () => {
    const baseDoc: R2Document = {
      id: "test-doc",
      contentType: "pattern",
      path: "data/resources/patterns/test-doc.md",
      metadata: {
        title: "Test Document",
        description: "A test description.",
        tags: ["governance", "test"],
        aliases: ["TestDoc"],
        date: "2024-06-15",
        group: "dao-primitives",
        banner: "images/banner.png",
        license: "CC-BY-SA-4.0",
      },
      content: "# Test\n\nBody content here.",
      syncedAt: "2025-01-10T00:00:00Z",
      commitSha: "abc1234",
    };

    it("maps core fields correctly", () => {
      const doc = toDocument(baseDoc);
      expect(doc.id).toBe("test-doc");
      expect(doc.type).toBe("pattern");
      expect(doc.category).toBe("resource");
      expect(doc.title).toBe("Test Document");
      expect(doc.description).toBe("A test description.");
      expect(doc.body).toBe("# Test\n\nBody content here.");
    });

    it("maps array fields", () => {
      const doc = toDocument(baseDoc);
      expect(doc.tags).toEqual(["governance", "test"]);
      expect(doc.aliases).toEqual(["TestDoc"]);
    });

    it("maps optional metadata fields", () => {
      const doc = toDocument(baseDoc);
      expect(doc.group).toBe("dao-primitives");
      expect(doc.banner).toBe("images/banner.png");
      expect(doc.license).toBe("CC-BY-SA-4.0");
    });

    it("uses date as created when created is absent", () => {
      const doc = toDocument(baseDoc);
      expect(doc.created).toBe("2024-06-15");
    });

    it("prefers created over date when both present", () => {
      const withCreated: R2Document = {
        ...baseDoc,
        metadata: { ...baseDoc.metadata, created: "2024-01-01", date: "2024-06-15" },
      };
      const doc = toDocument(withCreated);
      expect(doc.created).toBe("2024-01-01");
    });

    it("falls back to id for title when metadata.title is missing", () => {
      const noTitle: R2Document = {
        ...baseDoc,
        metadata: {},
      };
      const doc = toDocument(noTitle);
      expect(doc.title).toBe("test-doc");
    });

    it("defaults tags and aliases to empty arrays when missing", () => {
      const noArrays: R2Document = {
        ...baseDoc,
        metadata: { title: "X" },
      };
      const doc = toDocument(noArrays);
      expect(doc.tags).toEqual([]);
      expect(doc.aliases).toEqual([]);
    });

    it("omits optional fields when metadata lacks them", () => {
      const minimal: R2Document = {
        ...baseDoc,
        metadata: { title: "Minimal" },
      };
      const doc = toDocument(minimal);
      expect(doc.description).toBeUndefined();
      expect(doc.group).toBeUndefined();
      expect(doc.banner).toBeUndefined();
      expect(doc.license).toBeUndefined();
      expect(doc.created).toBeUndefined();
      expect(doc.modified).toBeUndefined();
    });

    it("passes through the full metadata as frontmatter", () => {
      const doc = toDocument(baseDoc);
      expect(doc.frontmatter).toBe(baseDoc.metadata);
    });
  });

  describe("toSearchResult", () => {
    it("maps fields correctly", () => {
      const input: ServerSearchResult = {
        id: "test",
        contentType: "pattern",
        title: "Test",
        description: "Desc",
        score: 0.8,
      };
      const result = toSearchResult(input);
      expect(result.id).toBe("test");
      expect(result.contentType).toBe("pattern");
      expect(result.title).toBe("Test");
      expect(result.description).toBe("Desc");
      expect(result.score).toBe(0.8);
    });

    it("prefers rerankScore over score", () => {
      const input: ServerSearchResult = {
        id: "test",
        contentType: "article",
        title: "Test",
        score: 0.5,
        rerankScore: 0.9,
      };
      const result = toSearchResult(input);
      expect(result.score).toBe(0.9);
    });

    it("omits description when not present", () => {
      const input: ServerSearchResult = {
        id: "test",
        contentType: "tag",
        title: "Test",
        score: 0.7,
      };
      const result = toSearchResult(input);
      expect(result.description).toBeUndefined();
    });
  });

  describe("TYPE_LABELS", () => {
    it("has a label for every type in ALL_CONTENT_TYPES", () => {
      for (const t of ALL_CONTENT_TYPES) {
        expect(TYPE_LABELS[t]).toBeDefined();
        expect(typeof TYPE_LABELS[t]).toBe("string");
      }
    });

    it("has labels for parent types", () => {
      expect(TYPE_LABELS.resource).toBe("Resource");
      expect(TYPE_LABELS.story).toBe("Story");
      expect(TYPE_LABELS.data).toBe("Data");
    });
  });
});
