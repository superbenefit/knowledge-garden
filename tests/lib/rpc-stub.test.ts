import { describe, it, expect } from "vitest";
import { createStubClient } from "@/lib/rpc-stub";

describe("rpc-stub", () => {
  const client = createStubClient();

  describe("getDocument", () => {
    it("returns a document for a known contentType + id", async () => {
      const doc = await client.getDocument("pattern", "governance-primitives");
      expect(doc).not.toBeNull();
      expect(doc!.id).toBe("governance-primitives");
      expect(doc!.type).toBe("pattern");
      expect(doc!.category).toBe("resource");
      expect(doc!.title).toBe("Governance Primitives");
      expect(doc!.tags).toContain("governance");
    });

    it("returns null for an unknown id", async () => {
      const doc = await client.getDocument("pattern", "nonexistent");
      expect(doc).toBeNull();
    });

    it("returns null when contentType doesn't match", async () => {
      const doc = await client.getDocument("article", "governance-primitives");
      expect(doc).toBeNull();
    });
  });

  describe("listEntries", () => {
    it("returns all documents with no params", async () => {
      const result = await client.listEntries();
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.total).toBe(result.data.length);
    });

    it("filters by contentType", async () => {
      const result = await client.listEntries({ contentType: "person" });
      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((doc) => {
        expect(doc.type).toBe("person");
      });
    });

    it("returns empty for a contentType with no docs", async () => {
      const result = await client.listEntries({ contentType: "gathering" });
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it("respects limit", async () => {
      const result = await client.listEntries({ limit: 2 });
      expect(result.data.length).toBeLessThanOrEqual(2);
    });

    it("respects offset", async () => {
      const all = await client.listEntries();
      const offset = await client.listEntries({ offset: 2 });
      expect(offset.data[0].id).toBe(all.data[2].id);
    });

    it("filters by group", async () => {
      const result = await client.listEntries({ group: "dao-primitives" });
      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((doc) => {
        expect(doc.group).toBe("dao-primitives");
      });
    });
  });

  describe("search", () => {
    it("returns results matching the query", async () => {
      const result = await client.search("governance");
      expect(result.items.length).toBeGreaterThan(0);
      result.items.forEach((r) => {
        expect(r.id).toBeDefined();
        expect(r.contentType).toBeDefined();
        expect(r.title).toBeDefined();
        expect(r.score).toBeDefined();
      });
    });

    it("returns empty for non-matching query", async () => {
      const result = await client.search("zzz_nonexistent_zzz");
      expect(result.items).toHaveLength(0);
    });

    it("respects limit", async () => {
      const result = await client.search("governance", { limit: 1 });
      expect(result.items.length).toBeLessThanOrEqual(1);
    });

    it("filters by contentType", async () => {
      const result = await client.search("governance", { contentType: "pattern" });
      result.items.forEach((r) => {
        expect(r.contentType).toBe("pattern");
      });
    });
  });

  describe("listGroups", () => {
    it("returns an array of groups", async () => {
      const groups = await client.listGroups();
      expect(Array.isArray(groups)).toBe(true);
      expect(groups.length).toBeGreaterThan(0);
      groups.forEach((g) => {
        expect(g.id).toBeDefined();
        expect(g.title).toBeDefined();
      });
    });
  });

  describe("listReleases", () => {
    it("returns an array of releases", async () => {
      const releases = await client.listReleases();
      expect(Array.isArray(releases)).toBe(true);
      expect(releases.length).toBeGreaterThan(0);
      releases.forEach((r) => {
        expect(r.id).toBeDefined();
        expect(r.title).toBeDefined();
      });
    });
  });
});
