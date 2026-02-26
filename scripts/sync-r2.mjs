#!/usr/bin/env node
/**
 * Sync remote R2 bucket → local miniflare R2 for dev.
 *
 * Usage:
 *   node scripts/sync-r2.mjs          # sync remote → local
 *   node scripts/sync-r2.mjs --clean  # wipe local R2 state first
 *
 * Requires: wrangler (devDependency), authenticated via `wrangler login`
 */
import { execSync } from "node:child_process";
import { mkdirSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const BUCKET = "superbenefit-knowledge";
const ACCOUNT_ID = "c36c9a59f6251430c514f4fff55c3f4a";
const PREFIXES = ["content/", "indexes/"];
const TMP_DIR = join(import.meta.dirname, "..", ".tmp-seed");
const ROOT = join(import.meta.dirname, "..");

function wrangler(args, opts = {}) {
  return execSync(`npx wrangler ${args}`, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: opts.stdio ?? "pipe",
    ...opts,
  });
}

function getOAuthToken() {
  const configDir =
    process.env.XDG_CONFIG_HOME ||
    (process.platform === "win32"
      ? join(process.env.APPDATA || "", "xdg.config")
      : join(process.env.HOME || "", ".config"));
  const tokenPath = join(configDir, ".wrangler", "config", "default.toml");

  if (!existsSync(tokenPath)) {
    throw new Error("Could not find wrangler config. Run: npx wrangler login");
  }

  const content = readFileSync(tokenPath, "utf8");
  const match = content.match(/oauth_token\s*=\s*"([^"]+)"/);
  if (!match) {
    throw new Error("Could not find OAuth token. Run: npx wrangler login");
  }
  return match[1];
}

async function listRemoteObjects(token) {
  const objects = [];

  for (const prefix of PREFIXES) {
    let cursor = "";
    while (true) {
      const params = new URLSearchParams({ prefix, per_page: "500" });
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

      const info = json.result_info || {};
      if (info.cursor && objects.length < (info.count || Infinity)) {
        cursor = info.cursor;
      } else {
        break;
      }
    }
  }

  return objects;
}

// Main
const clean = process.argv.includes("--clean");

if (clean) {
  console.log("Cleaning local R2 state...");
  rmSync(join(ROOT, ".wrangler", "state"), { recursive: true, force: true });
}

console.log("Authenticating...");
const token = getOAuthToken();

console.log("Listing remote objects...");
const keys = await listRemoteObjects(token);
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
    wrangler(`r2 object get "${BUCKET}/${key}" --file="${tmpFile}" --remote`);
    wrangler(
      `r2 object put "${BUCKET}/${key}" --file="${tmpFile}" --content-type="application/json" --local`,
    );
    ok++;
    process.stdout.write(`  ✓ ${key}\n`);
  } catch (err) {
    fail++;
    process.stderr.write(`  ✗ ${key}: ${err.stderr || err.message}\n`);
  }
}

rmSync(TMP_DIR, { recursive: true, force: true });

console.log(
  `\nSynced ${ok} documents${fail ? `, ${fail} failed` : ""} from remote → local R2.`,
);
if (fail) process.exit(1);
