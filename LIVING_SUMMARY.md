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

## Status line
LuxeCodes is live and pulling from CouponCanon. Demo code WELCOME10 flows end-to-end. Next: health endpoint, n8n validations, schema lock, SEO polish, safeguards.
