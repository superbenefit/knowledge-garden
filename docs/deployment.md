# Deployment

## Infrastructure

The site runs on Cloudflare Workers with static assets served via Workers Assets:

- **Worker**: `knowledge-garden` — serves the Astro static site
- **Static assets**: Served from `dist/` via Workers Assets (configured in `wrangler.jsonc`)
- **Compatibility**: `nodejs_compat` flag enabled, date `2026-02-01`

## Configuration Files

| File | Purpose |
|------|---------|
| `wrangler.jsonc` | Production Cloudflare Workers config |
| `.dev.vars` | Local dev environment variables (gitignored) |

## CI/CD

### `.github/workflows/ci.yml`

Runs on push/PR to `main`:

1. Install dependencies (`npm ci`)
2. TypeScript check (`astro check`)
3. Run tests (`vitest run`)
4. Production build (`astro build`)

### `.github/workflows/deploy.yml`

Runs on push to `main`:

1. Install dependencies
2. Build (`npm run build`)
3. Deploy to Cloudflare Workers (`wrangler deploy`)

## Manual Deployment

```bash
# Build
npm run build

# Deploy to production
npx wrangler deploy
```

## Environment Variables

Required environment variables (set in Cloudflare dashboard or `.dev.vars`):

| Variable | Description |
|----------|-------------|
| `R2_BUCKET_URL` | URL to the R2 bucket (e.g., `https://knowledge-bucket.superbenefit.dev`) |

The site fetches content from this R2 bucket at build time. No API tokens are needed since the bucket is configured with a public custom domain.

## Build Output

After `npm run build`:

```
dist/
  index.html          Pre-rendered pages
  _astro/             Hashed Astro bundles (immutable cache)
  pagefind/           Static search index
  attachments/        Downloaded binary assets
  sitemap-index.xml
```

Static assets under `/_astro/` are served with `Cache-Control: public, max-age=31536000, immutable` via the middleware.

## Requirements

- Node.js >= 22
- npm
- Wrangler CLI (`npx wrangler` or globally installed)
- Cloudflare account with Workers enabled
