#!/usr/bin/env node
/**
 * Seed local miniflare R2 bucket from the remote production bucket.
 *
 * Usage:
 *   node scripts/seed-local-r2.mjs          # sync remote → local
 *   node scripts/seed-local-r2.mjs --clean  # wipe local R2 state first, then sync
 *
 * Requires: npx wrangler (devDependency), authenticated via `wrangler login`
 *
 * How it works:
 *   1. Uses CF REST API to list all content/* objects in the remote bucket
 *   2. Downloads each via `wrangler r2 object get`
 *   3. Uploads to local miniflare R2 via `wrangler r2 object put --local`
 */
import { execSync } from "node:child_process";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

const BUCKET = "superbenefit-knowledge";
const ACCOUNT_ID = "c36c9a59f6251430c514f4fff55c3f4a";
const PREFIX = "content/";
const TMP_DIR = join(import.meta.dirname, "..", ".tmp-seed");
const ROOT = join(import.meta.dirname, "..");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function wrangler(args, opts = {}) {
  return execSync(`npx wrangler ${args}`, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: opts.stdio ?? "pipe",
    ...opts,
  });
}

/** Get an OAuth token from wrangler's stored credentials */
function getApiToken() {
  // wrangler stores OAuth tokens that we can extract via config path
  // Use the CF API with wrangler's auth by calling wrangler directly
  const whoami = wrangler("whoami");
  if (!whoami.includes("logged in")) {
    throw new Error("Not logged in. Run: npx wrangler login");
  }
  return null; // We'll use wrangler CLI for downloads instead
}

/** List all objects in the remote bucket with the given prefix using CF REST API */
async function listRemoteObjects() {
  // Use wrangler's built-in auth by making an API call through it
  // Since there's no `wrangler r2 object list`, use the S3 API via a temp worker
  // Instead, we'll use a pragmatic approach: fetch the API directly

  // Get the OAuth token from wrangler's config
  const configDir =
    process.env.XDG_CONFIG_HOME ||
    (process.platform === "win32"
      ? join(process.env.APPDATA || "", "xdg.config")
      : join(process.env.HOME || "", ".config"));
  const tokenPath = join(configDir, ".wrangler", "config", "default.toml");

  let token = "";
  if (existsSync(tokenPath)) {
    const { readFileSync } = await import("node:fs");
    const content = readFileSync(tokenPath, "utf8");
    const match = content.match(/oauth_token\s*=\s*"([^"]+)"/);
    if (match) token = match[1];
  }

  if (!token) {
    throw new Error(
      "Could not find wrangler OAuth token. Run: npx wrangler login",
    );
  }

  const objects = [];
  let cursor = "";

  while (true) {
    const params = new URLSearchParams({ prefix: PREFIX, per_page: "500" });
    if (cursor) params.set("cursor", cursor);

    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET}/objects?${params}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`CF API ${res.status}: ${body}`);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(`CF API error: ${JSON.stringify(json.errors)}`);
    }

    for (const obj of json.result || []) {
      objects.push(obj.key);
    }

    // Check for pagination
    const info = json.result_info || {};
    if (info.cursor && objects.length < (info.count || Infinity)) {
      cursor = info.cursor;
    } else {
      break;
    }
  }

  return objects;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const clean = process.argv.includes("--clean");

if (clean) {
  console.log("Cleaning local R2 state...");
  rmSync(join(ROOT, ".wrangler", "state"), { recursive: true, force: true });
}

console.log("Listing remote objects...");
const keys = await listRemoteObjects();
console.log(`Found ${keys.length} objects in remote bucket.\n`);

if (keys.length === 0) {
  console.log("No objects to sync.");
  process.exit(0);
}

mkdirSync(TMP_DIR, { recursive: true });

let ok = 0;
let fail = 0;

for (const key of keys) {
  const safeFilename = key.replace(/\//g, "__");
  const tmpFile = join(TMP_DIR, safeFilename);

  try {
    // Download from remote (--remote required, wrangler defaults to local)
    wrangler(`r2 object get "${BUCKET}/${key}" --file="${tmpFile}" --remote`);

    // Upload to local
    wrangler(
      `r2 object put "${BUCKET}/${key}" --file="${tmpFile}" --content-type="application/json" --local`,
    );

    ok++;
    console.log(`  ✓ ${key}`);
  } catch (err) {
    fail++;
    console.error(`  ✗ ${key}: ${err.stderr || err.message}`);
  }
}

// Clean up temp files
rmSync(TMP_DIR, { recursive: true, force: true });

console.log(
  `\nSynced ${ok} documents${fail ? `, ${fail} failed` : ""} from remote to local R2.`,
);
if (fail) process.exit(1);
