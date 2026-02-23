import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { resolve } from "path";

const distDir = resolve(__dirname, "../../dist");

/**
 * Integration tests that verify the build output.
 * These are skipped by default since they require a prior `npm run build`.
 * Run them explicitly after building: `vitest run tests/integration`
 */
describe.skip("build output", () => {
  it("dist/ directory exists", () => {
    expect(existsSync(distDir)).toBe(true);
  });

  it("index.html was generated", () => {
    expect(existsSync(resolve(distDir, "index.html"))).toBe(true);
  });

  it("404.html was generated", () => {
    expect(existsSync(resolve(distDir, "404.html"))).toBe(true);
  });

  it("sitemap was generated", () => {
    const hasSitemap =
      existsSync(resolve(distDir, "sitemap.xml")) ||
      existsSync(resolve(distDir, "sitemap-index.xml")) ||
      existsSync(resolve(distDir, "sitemap-0.xml"));
    expect(hasSitemap).toBe(true);
  });
});
