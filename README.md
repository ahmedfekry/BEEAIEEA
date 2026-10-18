# SLEB Energy Assessment Demo

Demo web app integrating the SLEB Smart Hub BEEA (buildings) & IEEA (industrial facilities) APIs.

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in SLEB_USERNAME / SLEB_PASSWORD
npm run dev                  # http://localhost:3000
```

Check the credentials work: open http://localhost:3000/api/auth/test
(should return `{"ok":true,"message":"Login succeeded",...}`).

Credentials are read only on the server (`src/lib/sleb-client.ts`) and are never sent to the browser.

### Environment variables

| Variable | Purpose |
|---|---|
| `SLEB_BASE_URL` | Defaults to `https://sleb.sg/slebapi/beea` |
| `SLEB_USERNAME`, `SLEB_PASSWORD` | SLEB API credentials (server only) |
| `SLEB_MOCK` | `1` = return placeholder results instead of calling SLEB (demo without API access) |
| `ACCESS_CODE` | If set, visitors must enter this code before using the app (set it on public deploys) |

## Known blocker: Cloudflare challenge on sleb.sg

As of 18 Oct 2026, `https://sleb.sg/slebapi/*` answers every non-browser request with a Cloudflare
managed challenge (`HTTP 403`, `cf-mitigated: challenge`), so server-to-server calls cannot reach the
API regardless of credentials. SLEB needs to allowlist the server's IP (or exempt `/slebapi/*` from the
challenge). Until then, set `SLEB_MOCK=1` to demo the full flow with placeholder results.

## How it works

- **Form engine** (`src/lib/forms/engine.ts`): each field is defined once (payload path, label, unit,
  type, range, options, `visibleWhen`). The same definition drives rendering, validation (via zod +
  react-hook-form), serialization to the SLEB JSON, and sample data.
- **Schemas**: `src/lib/forms/beea.ts` (New Development / Retrofitting / In Operation) and
  `src/lib/forms/ieea.ts` (New Development / Existing Facility, 17 industries' KPIs, 18 system types).
- **API route** `POST /api/assess/[family]/[flow]` re-validates and re-serializes on the server, then
  calls SLEB. BEEA returns the decoded PDF; IEEA returns JSON.
- **IEEA PDF** is generated in the browser with pdf-lib (`src/lib/ieea-pdf.ts`).
- **Proxy** (`src/proxy.ts`): optional access-code gate, and real 404s for unknown assessment URLs.

## Status

- [x] Landing page (BEEA / IEEA) and sub-type selection
- [x] Server-side token client with caching, 401 retry, timeouts and readable errors
- [x] Config-driven multi-step form engine with sample data and draft autosave
- [x] All 5 flows: BEEA PDF viewer + download, IEEA results screen + generated PDF
- [x] Mock mode, access-code gate
- [ ] Verify against the live API once the Cloudflare challenge is lifted (see `CLAUDE.md` spec issues)

## Deploy (Vercel)

Add `SLEB_USERNAME`, `SLEB_PASSWORD`, `SLEB_BASE_URL` and `ACCESS_CODE` in project settings.
