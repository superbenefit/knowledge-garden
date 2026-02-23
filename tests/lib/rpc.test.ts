import { describe, it, expect } from "vitest";
import { getKnowledgeClient, safeCall, getKnowledgeServer, safeRPC } from "@/lib/rpc";
import { createStubClient } from "@/lib/rpc-stub";

describe("rpc", () => {
  describe("getKnowledgeClient", () => {
    it("returns an object with the KnowledgeClient interface", () => {
      const client = getKnowledgeClient();
      expect(client).toBeDefined();
      expect(typeof client.getDocument).toBe("function");
      expect(typeof client.listEntries).toBe("function");
      expect(typeof client.search).toBe("function");
      expect(typeof client.listGroups).toBe("function");
      expect(typeof client.listReleases).toBe("function");
    });

    it("returns the same cached instance on subsequent calls", () => {
      const a = getKnowledgeClient();
      const b = getKnowledgeClient();
      expect(a).toBe(b);
    });
  });

  describe("backward-compatible aliases", () => {
    it("getKnowledgeServer is an alias for getKnowledgeClient", () => {
      expect(getKnowledgeServer).toBe(getKnowledgeClient);
    });

    it("safeRPC is an alias for safeCall", () => {
      expect(safeRPC).toBe(safeCall);
    });
  });

  describe("safeCall", () => {
    it("returns the result on success", async () => {
      const result = await safeCall(() => Promise.resolve(42), 0);
      expect(result).toBe(42);
    });

    it("returns the fallback on error", async () => {
      const result = await safeCall(
        () => Promise.reject(new Error("fail")),
        "fallback",
      );
      expect(result).toBe("fallback");
    });

    it("returns fallback when function throws synchronously", async () => {
      const result = await safeCall(() => {
        throw new Error("sync error");
      }, []);
      expect(result).toEqual([]);
    });
  });

  describe("stub client (offline fallback)", () => {
    const client = createStubClient();

    it("can fetch a document", async () => {
      const doc = await client.getDocument("pattern", "governance-primitives");
      expect(doc).not.toBeNull();
      expect(doc!.title).toBe("Governance Primitives");
    });

    it("can list entries", async () => {
      const result = await client.listEntries({ limit: 3 });
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.length).toBeLessThanOrEqual(3);
    });

    it("can search", async () => {
      const result = await client.search("dao");
      expect(result.items.length).toBeGreaterThan(0);
    });
  });
});
