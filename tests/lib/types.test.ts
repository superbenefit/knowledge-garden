import { describe, it, expect } from "vitest";
import {
  getCategory,
  isContentType,
  fromCollectionEntry,
  RESOURCE_TYPES,
  STORY_TYPES,
  REFERENCE_TYPES,
  DATA_TYPES,
  ALL_CONTENT_TYPES,
  TYPE_LABELS,
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

  describe("fromCollectionEntry", () => {
    const entryId = "content/pattern/test-doc.json";
    const baseData: Record<string, unknown> = {
      contentType: "pattern",
      path: "data/resources/patterns/test-doc.md",
      body: "# Test\n\nBody content here.",
      title: "Test Document",
      description: "A test description.",
      tags: ["governance", "test"],
      aliases: ["TestDoc"],
      date: "2024-06-15",
      group: "dao-primitives",
      banner: "images/banner.png",
      license: "CC-BY-SA-4.0",
    };

    it("maps core fields correctly", () => {
      const doc = fromCollectionEntry(entryId, baseData);
      expect(doc.id).toBe("test-doc");
      expect(doc.type).toBe("pattern");
      expect(doc.category).toBe("resource");
      expect(doc.title).toBe("Test Document");
      expect(doc.description).toBe("A test description.");
      expect(doc.body).toBe("# Test\n\nBody content here.");
    });

    it("extracts document id from R2 key", () => {
      const doc = fromCollectionEntry("content/article/my-article.json", { contentType: "article" });
      expect(doc.id).toBe("my-article");
    });

    it("maps array fields", () => {
      const doc = fromCollectionEntry(entryId, baseData);
      expect(doc.tags).toEqual(["governance", "test"]);
      expect(doc.aliases).toEqual(["TestDoc"]);
    });

    it("maps optional metadata fields", () => {
      const doc = fromCollectionEntry(entryId, baseData);
      expect(doc.group).toBe("dao-primitives");
      expect(doc.banner).toBe("images/banner.png");
      expect(doc.license).toBe("CC-BY-SA-4.0");
    });

    it("uses date as created when created is absent", () => {
      const doc = fromCollectionEntry(entryId, baseData);
      expect(doc.created).toBe("2024-06-15");
    });

    it("prefers created over date when both present", () => {
      const doc = fromCollectionEntry(entryId, {
        ...baseData,
        created: "2024-01-01",
        date: "2024-06-15",
      });
      expect(doc.created).toBe("2024-01-01");
    });

    it("falls back to id for title when title is missing", () => {
      const doc = fromCollectionEntry(entryId, { contentType: "pattern" });
      expect(doc.title).toBe("test-doc");
    });

    it("defaults tags and aliases to empty arrays when missing", () => {
      const doc = fromCollectionEntry(entryId, { contentType: "pattern", title: "X" });
      expect(doc.tags).toEqual([]);
      expect(doc.aliases).toEqual([]);
    });

    it("omits optional fields when data lacks them", () => {
      const doc = fromCollectionEntry(entryId, { contentType: "pattern", title: "Minimal" });
      expect(doc.description).toBeUndefined();
      expect(doc.group).toBeUndefined();
      expect(doc.banner).toBeUndefined();
      expect(doc.license).toBeUndefined();
      expect(doc.created).toBeUndefined();
      expect(doc.modified).toBeUndefined();
    });

    it("passes through the full data as frontmatter", () => {
      const doc = fromCollectionEntry(entryId, baseData);
      expect(doc.frontmatter).toBe(baseData);
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
