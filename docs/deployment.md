# Deployment

## Infrastructure

The site runs on Cloudflare Workers with the following setup:

- **Worker**: `knowledge-garden` — serves the Astro site
- **R2 bucket**: `KNOWLEDGE_BUCKET` — stores content as JSON documents (`superbenefit-knowledge`)
- **AI binding**: `AI` — Cloudflare Workers AI (for future search)
- **Static assets**: Served from `dist/client/` via Workers Assets
- **Compatibility**: `nodejs_compat` flag enabled, date `2025-01-01`

## Configuration Files

| File | Purpose |
|------|---------|
| `wrangler.jsonc` | Production Cloudflare config |
| `wrangler.staging.jsonc` | Staging environment config |
| `.dev.vars` | Local dev environment variables (gitignored) |

## CI/CD

### `.github/workflows/ci.yml`

Runs on push/PR to `astro-v6` and `main`:

1. Install dependencies (`npm ci`)
2. TypeScript check (`astro check`)
3. Run tests (`vitest run`)
4. Production build (`astro build`)

### `.github/workflows/deploy.yml`

Runs on push to `main`:

1. Install dependencies
2. Build
3. Deploy to Cloudflare Workers (`wrangler deploy`)

## Manual Deployment

```bash
# Build
npm run build

# Deploy to production
npx wrangler deploy

# Deploy to staging
npx wrangler deploy --config wrangler.staging.jsonc
```

## Worker Bindings

Content is accessed via R2 bucket binding, configured in `wrangler.jsonc`:

```jsonc
{
  "r2_buckets": [
    {
      "binding": "KNOWLEDGE_BUCKET",
      "bucket_name": "superbenefit-knowledge"
    }
  ],
  "ai": {
    "binding": "AI"
  }
}
```

In local development, `wrangler dev` provides local R2 emulation via miniflare. Seed it with `npm run seed`.

## Build Output

After `npm run build`:

```
dist/
  client/           Static assets (HTML, CSS, JS, images)
    _astro/         Hashed Astro bundles (immutable cache)
    index.html      Pre-rendered pages
    sitemap-index.xml
  server/           Cloudflare Worker entry point + chunks
```

Static assets under `/_astro/` are served with `Cache-Control: public, max-age=31536000, immutable` via the middleware.

## Requirements

- Node.js >= 22
- npm
- Wrangler CLI (`npm install -g wrangler` or use `npx`)
- Cloudflare account with Workers enabled
