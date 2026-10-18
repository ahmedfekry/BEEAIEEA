# SLEB BEEA & IEEA Demo — project context for Claude Code

Demo web app that integrates the SLEB Smart Hub **BEEA** (Building Energy Efficiency Assessment) and **IEEA** (Industrial Energy Efficiency Assessment) APIs.
The full API spec is in `docs/BEEA_IEEA_API_Document_v1.0.pdf` (64 pages). Read it with the pages parameter (max 20 pages per request). It is the source of truth for every field name, type and range.

## Stack
Next.js 16 (App Router, Cache Components enabled), React 19, TypeScript, Tailwind v4, react-hook-form + zod, pdf-lib.
No Google Fonts (system font stack) so the build works offline. Light theme only.
Dynamic routes need `generateStaticParams` because Cache Components is on.

## Security rules
- SLEB credentials live ONLY in `.env.local` (git-ignored): `SLEB_BASE_URL`, `SLEB_USERNAME`, `SLEB_PASSWORD`. See `.env.example`.
- All SLEB calls go through server code (`src/lib/sleb-client.ts`, marked `server-only`). Never expose credentials or the token to the browser. Never commit secrets.

## API essentials
- Base URL: `https://sleb.sg/slebapi/beea`
- `POST /login` with `{username, password}` -> `data.token`. Then send `Authorization: Bearer <token>` on every request. Input is JSON and field names are case sensitive.
- Every response is `{ result: { errcode (0 ok, 1 error), errmsg }, data: {...} }`.
- Endpoints (all POST, under `/project/report/`):

| Flow | Path | ProjectStatus | Output |
|---|---|---|---|
| BEEA New Development | `newdev` | "New Development" | `data.report` = Base64 PDF |
| BEEA Retrofitting | `retrofit` | "Retrofitting Project" | Base64 PDF |
| BEEA In Operation | `inoperation` | "In Operation" | Base64 PDF |
| IEEA New Development | `newdevind` | "New Development" | JSON results |
| IEEA Existing Facility | `existingind` | "Existing Building" | JSON results |

- All values are sent as **strings**, except `Storey` (integer). `SystemTypes` (IEEA) is an array of strings.
- Request shape: project-level fields (`ProjectName`, `ProjectAddress`, `ProjectPostalCode`, `ProjectCountry`, `ProjectGFA`, `ProjectStatus`) + `BuildingData`.
  - BEEA `BuildingData` groups: `BuildingInfo`, `Facade`, `ACSystem`, `ADSystem`, `LightingSystem`, `MVSystem`, `OtherSystem`.
  - IEEA `BuildingData`: `BuildingInfo` (new dev) or `BuildingInfo` containing `Consumption` + `FacilityKPIs` (existing), plus `SystemTypes`; for existing, one object per selected system at the same level as `BuildingInfo`, keyed by variable name (e.g. `Motors`, `Furnaces`, `ClinkerHandlingConveyors`).
- IEEA only accepts `ProjectCountry` = "Egypt" and `BuildingType` = "Industrial Facility".

## Known spec issues to verify against the live API
- In-operation example wrongly uses "Retrofitting Project" as status; the table says "In Operation".
- BuildingInfo `Schedule` (total building operation hours/week) has no variable name in the table but appears in the examples as `"Schedule"`.
- Fields typed `{"Yes"}` (ACOpt, PLC, DCV, BEMS, EfficientLift, ...) are toggles; assume omit when off, confirm.
- `ADType == None` appears in ADFanEffi range rules but "None" is not a listed value.
- Range boundary inclusivity is unclear; example JSON in the PDF has a missing colon after `"OtherSystem"` and curly quotes (not valid JSON as printed).
- Some "required" fields only apply for certain AC/AD/building types (hot water fields only for hotel/healthcare/residential, etc.).

## Plan / milestones
1. [x] Scaffold, `.env`, server-side token client (login, cache, retry on 401)
2. [x] Landing page (BEEA / IEEA cards) + sub-type selection (`src/lib/catalog.ts` holds the 5 flows)
3. [x] **Config-driven multi-step form engine.** Define each field once in a schema (`name, label, unit, type, required, range, options, visibleWhen, step`); one generic renderer + zod validation for all 5 flows (cross-field rules, conditional visibility, string serialization). First full schema: BEEA New Development. Add a "Fill sample data" button per flow.
4. [x] BEEA: API route `POST /api/assess/[family]/[flow]` (shared by all flows) (proxy, returns PDF bytes decoded from Base64), PDF viewer (iframe/embed) + Download button
5. [x] BEEA Retrofitting + In Operation schemas (add existing-condition fields)
6. [x] IEEA New Development: API route, results screen, JSON -> PDF generation (pdf-lib) + download
7. [x] IEEA Existing Facility (largest schema: 17 industries' KPIs, 18 system types, one step per selected system)
8. [x] Polish: validation messages, loading/error states, readable errors for `errcode: 1`, optional access-code gate before public deploy

## Form steps per flow
- BEEA (all 3): Project -> Building Info -> Facade -> A/C System -> Air Distribution -> Lighting -> Mechanical Ventilation -> Other Systems -> Review
- IEEA New Dev: Project -> Building Info (industry, monthly production, optional primary fuel) -> System Types -> Review
- IEEA Existing: Project -> Building Info -> Consumption -> Facility KPIs (varies by industry) -> System Types -> one step per selected system -> Review

## Result handling
- BEEA: show the returned PDF inline and allow download.
- IEEA: show results on screen, then generate a PDF containing: project summary + totals (energy GJ/yr, carbon t CO2e/yr), SEC vs BAT, KPI benchmarking with On Track / Needs Improvement badges and recommendations, system performance benchmarking, energy analysis and savings per system, water and raw-material analysis. Treat `RawMaterialAnalysisAndRecommendation: null` as "not applicable".

## Code map
- `src/lib/forms/engine.ts`: field/step types, visibility, validation, serialization, sample data (shared client + server).
- `src/lib/forms/beea.ts`, `src/lib/forms/ieea.ts`: the 5 flow schemas; `registry.ts` looks them up by family/flow.
- `src/app/api/assess/[family]/[flow]/route.ts`: validates + serializes server-side, calls SLEB (or mock).
- `src/lib/sleb-mock.ts`: `SLEB_MOCK=1` placeholder results. `src/lib/ieea-pdf.ts`: IEEA PDF (pdf-lib, browser).
- `src/components/wizard/*`: wizard UI, review step, BEEA PDF viewer, IEEA results.
- `src/proxy.ts`: optional `ACCESS_CODE` gate + 404 status for unknown `/assess/*` URLs.
- Dynamic pages read `params` inside `<Suspense>` (required for instant navigation validation with Cache Components).

## Assumptions made where the spec is unclear
- Toggles (`{"Yes"}` fields) are sent as "Yes" when on and omitted when off.
- BEEA ranges are treated as inclusive (the examples send `"0"` for `(0, ∞)` areas); IEEA uses the explicit `[`/`(` notation.
- `ADType` (VSD upgrade) is optional and only shown for CAV systems; empty = "None". It stays in `ADSystem` for In Operation too.
- In Operation has no ExistingPLED, ChillerEffi/CHWP/CWP/CT, PACT or ADFanEffi (matches its table + example).
- Selected IEEA systems are always sent as an object, even if all of their (optional) fields are blank.

## Status / environment notes
- Build passes (`npm run build`); all 5 flows verified end to end in mock mode.
- **The live API is blocked by a Cloudflare managed challenge** (HTTP 403 with `cf-mitigated: challenge`) for any non-browser client, so login fails regardless of credentials. SLEB must allowlist the server IP or exempt `/slebapi/*`. Use `SLEB_MOCK=1` meanwhile. Once reachable, re-test each flow against the spec issues above.
- Deployment target: Vercel (add the three env vars in project settings). The deployed URL is public, so add an access-code gate or Vercel Deployment Protection before sharing. The SLEB password was shared in chat, so rotate it after the demo.
