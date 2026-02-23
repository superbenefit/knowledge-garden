# Deployment

## Infrastructure

The site runs on Cloudflare Workers with the following setup:

- **Worker**: `knowledge-garden` — serves the Astro site
- **Service binding**: `KNOWLEDGE_SERVER` — RPC connection to the knowledge-server Worker
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

## Environment Variables

The knowledge-server Worker is connected via service binding, not environment variables. The binding is configured in `wrangler.jsonc`:

```jsonc
{
  "services": [
    {
      "binding": "KNOWLEDGE_SERVER",
      "service": "knowledge-server"
    }
  ]
}
```

In local development, the RPC stub (`src/lib/rpc-stub.ts`) is used automatically — no service binding is needed.

## Build Output

After `npm run build`:

```
dist/
  client/           Static assets (HTML, CSS, JS, images)
    _astro/         Hashed Astro bundles (immutable cache)
    index.html      Pre-rendered pages
    sitemap-index.xml
  _worker.js        Cloudflare Worker entry point
```

Static assets under `/_astro/` are served with `Cache-Control: public, max-age=31536000, immutable` via the middleware.

## Requirements

- Node.js >= 22
- npm
- Wrangler CLI (`npm install -g wrangler` or use `npx`)
- Cloudflare account with Workers enabled
