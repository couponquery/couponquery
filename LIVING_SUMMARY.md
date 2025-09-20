# COUPON MACHINE — Living Summary
*(CouponCanon / LuxeCodes)*

## Repo / Infra
- GitHub org/repo: couponquery/couponquery
- Structure:
  - netlify/functions/ → engine API (brand.js live, health.js planned)
  - sites/luxecodes/ → LuxeCodes frontend
  - sites/luxecodes/assets/js/codes.js → fetch + render codes
  - sites/luxecodes/_headers → CSP/security headers
  - sites/luxecodes/netlify.toml → redirects (/brand/:slug)
- Branch workflow: feature branch → PR → merge to main → Netlify deploy
- Deploys:
  - couponcanon.com → engine
  - luxecodes.com → frontend (Base+Publish = sites/luxecodes)
- Supabase: brands, codes, validations (demo seeded)
- Cloudflare: DNS for both
- Cursor: active dev environment

## Live now
- API: couponcanon.com/api/brand?brand=demo → JSON with WELCOME10
- Frontend: luxecodes.com/brand/demo → white/navy/gold design, Copy button works
- Infra: DNS/SSL valid, CSP/CORS configured, secrets in place

## Known gaps
- Validations not wired (last_verified = null)
- No rate limit/origin allowlist on API
- SEO files exist but need double-check
- If frontend looks unchanged, confirm Base/Publish = sites/luxecodes

## Ops runbook
- API broken → redeploy Netlify function
- Fetch blocked → update connect-src in _headers
- Brand URL fails → check redirects in netlify.toml
- Frontend stale → confirm Netlify dirs + redeploy with cache clear

## Next actions
1. Add /api/health endpoint + logging
2. Build n8n scraper → Supabase upserts → validations stamp
3. Show "Verified {date}" in LuxeCodes UI
4. Lock schema (brand_slug) + finalize API contract
5. SEO polish: sitemap, robots, meta, OG tags
6. Add safeguards: rate limiting + origin allowlist

## Differentiator
- Exact verified timestamps
- Public JSON API AIs can trust
- Luxury-only, premium presentation

## API contract

Base
- GET /api/brand?brand={slug}

Query
- brand: string, required, matches brands.slug

Response
{
  "brand": "demo",
  "count": 1,
  "codes": [
    {
      "id": "uuid",
      "code": "WELCOME10",
      "discount_text": "10% off your first order",
      "terms": "Valid until 2025-12-31",
      "added_at": "2025-09-16T05:54:40.944Z",
      "last_verified": "2025-09-20T12:34:56.000Z" | null
    }
  ]
}

Ordering
- Codes ordered by last_verified desc nulls last, then added_at desc
- Most recently verified codes appear first

Errors
- 400 invalid brand param
- 404 brand not found
- 500 internal

Health
- GET /api/health
- Response: { "ok": true, "uptime_ms": 1234, "time": "2025-01-01T00:00:00.000Z", "env": "production" }

## Health and logging

Health endpoint
- GET /api/health → { "ok": true, "uptime_ms": 1234, "time": "ISO-8601", "env": "production|preview" }
- Returns function uptime since cold start
- Includes environment context

Structured logging
- brand.js logs:
  - brand_request_start: { req_id, brand, user_agent, ip }
  - brand_request_result: { req_id, brand, count }
  - brand_request_error: { req_id, brand, message }
- health.js: logs uptime and cold start
- All logs use JSON.stringify for structured output

## Security and CORS

Env (Netlify Project configuration)
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY
- CORS_ORIGINS = https://luxecodes.com,https://www.luxecodes.com,http://localhost:8888

Headers
- sites/luxecodes/_headers → connect-src must include https://couponcanon.com and https://www.couponcanon.com
- CORS headers set based on CORS_ORIGINS environment variable

Safeguards backlog
- Per IP rate limit in brand.js
- Origin allowlist check for Origin or Referer
- 60s function timeout alerts

## Data model

Tables
- brands { id uuid pk, slug text unique, name text, active bool default true }
- codes { id uuid pk, brand_id uuid fk, code text, discount_text text, terms text, added_at timestamptz default now() }
- validations { id uuid pk, code_id uuid fk, verified_at timestamptz, source text, status text }

Views
- latest_validations: latest verification timestamp per code_id
- RPC function: get_brand_codes_with_validations(brand_slug, limit_count)
- RPC function: upsert_validation(code_id uuid, verified_at timestamptz, source text, status text)

Indexes
- brands.slug btree
- codes.brand_id btree
- validations.code_id btree
- validations.verified_at btree

## Validation RPC

upsert_validation Function
- Purpose: Single insert for validations by n8n or external workers
- Parameters: code_id (uuid), verified_at (timestamptz), source (text), status (text)
- Effect: latest_validations view updates automatically, brand API includes last_verified on next call
- Defaults: source='n8n', status='verified' if not provided
- Security: Uses security definer for controlled access

Usage
- Call via Supabase REST API: POST /rest/v1/rpc/upsert_validation
- Body: { "p_code_id": "uuid", "p_verified_at": "2025-01-01T00:00:00Z", "p_source": "n8n", "p_status": "verified" }

## Frontend integration

Routes
- /?brand=slug and /brand/slug redirect to query param
- Netlify redirects live in sites/luxecodes/netlify.toml

Rendering
- sites/luxecodes/assets/js/codes.js fetches /api/brand and renders cards
- Show "Verified {date}" when last_verified not null (formatted as "Sep 20, 2025")
- Copy button writes code to clipboard with brief state change
- Codes ordered by verification status (verified first, then by added date)
- Q&A block at top: "What are the best verified {brand} codes today?"
- Dynamic FAQ schema (JSON-LD) with live codes and verification timestamps

## SEO

AI-First Design
- Each brand page framed as Q&A: "What are the best verified {brand} codes today?"
- FAQPage schema (JSON-LD) with live codes and verification timestamps
- Dynamic answer text includes first 3 codes with discount text and verification dates
- Schema validates as FAQPage for Google/Gemini citation
- Rich Results test: https://search.google.com/test/rich-results

## Monetization

AdSense Integration
- Environment-gated ads (disabled by default)
- Single responsive ad unit below Q&A block
- Minimal CSP changes for AdSense domains only

Netlify Project Configuration
- LUXE_ENABLE_ADS = true|false (default: false)
- ADSENSE_PUB_ID = ca-pub-XXXXXXXXXXXXXXX
- ADSENSE_SLOT_ID = 0000000000

Files
- sites/luxecodes/ads.txt - Update with actual publisher ID
- sites/luxecodes/assets/js/ads.js - AdSense loader with env checks
- sites/luxecodes/_headers - CSP allows AdSense domains

CSP Domains Whitelisted
- script-src: pagead2.googlesyndication.com, googletagmanager.com
- img-src: pagead2.googlesyndication.com, googleads.g.doubleclick.net
- connect-src: pagead2.googlesyndication.com, googleads.g.doubleclick.net, googletagmanager.com
- frame-src: googleads.g.doubleclick.net, tpc.googlesyndication.com

## Ops runbook quick commands

Engine redeploy
- Netlify UI → Deploys → Trigger deploy for functions

Frontend cache bust
- Netlify UI → Deploys → Clear cache and deploy site

CSP update
- Edit sites/luxecodes/_headers connect-src
- Commit to main, wait for deploy

Pretty URLs check
- Confirm sites/luxecodes/netlify.toml has /brand/:slug → /.netlify/functions/brand?brand=:slug 200

## Live status

- API ok at https://couponcanon.com/api/brand?brand=demo
- LuxeCodes live with white, navy, gold
- DNS and SSL valid
- CSP, CORS, secrets configured

## Known gaps

- Validations not wired, last_verified is null
- No rate limit or origin allowlist
- SEO files exist, need final review
- If LuxeCodes looks unchanged, confirm Base and Publish = sites/luxecodes

## Next steps

1) Add /api/health and add request logging to brand.js
2) Build n8n pipeline to ingest, upsert, and stamp validations
3) Surface Verified {date} in cards
4) Lock schema on brands.slug and publish the API contract above
5) SEO polish per brand meta and OG, verify sitemap and robots
6) Add rate limit and origin allowlist

## Status line
LuxeCodes is live and pulling from CouponCanon. Demo code WELCOME10 flows end-to-end. Next: health endpoint, n8n validations, schema lock, SEO polish, safeguards.
