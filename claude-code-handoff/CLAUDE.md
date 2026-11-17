# SLEB BEEA & IEEA Demo — project context for Claude Code

Demo web app that integrates the SLEB Smart Hub **BEEA** (Building Energy Efficiency Assessment) and **IEEA** (Industrial Energy Efficiency Assessment) APIs.

**API version in use: v2.0** (2026-11-12). v2.0 changes only the IEEA endpoints; BEEA and login are unchanged from v1.0.

## Where the specification lives (read these first)
| File | What it is |
|---|---|
| `docs/FORMS_SPEC.md` | Master doc: general rules, shared lookups, spec issues/ambiguities, how the docs map to the app |
| `docs/forms/*.md` | One doc per form (5): wizard steps, every field (variable, type, required, range, description), conditional rules |
| `docs/V2_CHANGES.md` | What changed in v2.0 vs v1.0 and what it means for the app |
| `docs/spec/forms.json` | Machine-readable field list for all 5 forms (generated from the v2.0 spec): `step`, `path` (JSON location), `required`, `range` (parsed), `notes`. **Use this to drive the form engine, don't retype fields.** |
| `docs/spec/ieea-lookups.json` | 17 industries, 18 system types, system type → JSON key map |
| `docs/spec/examples/*.json` | Valid-JSON example requests/responses (cleaned from the spec). Use as "Fill sample data" presets and as test fixtures |
| `docs/BEEA_IEEA_API_Document_v2.0_tracked_changes_vs_v1.0.docx` | Source spec v2.0 with tracked changes. Source of truth if docs disagree |
| `docs/BEEA_IEEA_API_Document_v1.0.pdf` | Old v1.0 spec (reference only) |

## Stack
Next.js 16 (App Router, Cache Components enabled), React 19, TypeScript, Tailwind v4, react-hook-form + zod, pdf-lib.
No Google Fonts (system font stack) so the build works offline. Light theme only.
Dynamic routes need `generateStaticParams` because Cache Components is on.

## Security rules
- SLEB credentials live ONLY in `.env.local` (git-ignored): `SLEB_BASE_URL`, `SLEB_USERNAME`, `SLEB_PASSWORD`. See `.env.example`.
- All SLEB calls go through server code (`src/lib/sleb-client.ts`, marked `server-only`). Never expose credentials or the token to the browser. Never commit secrets.

## API essentials
- Base URL: `https://sleb.sg/slebapi/beea`
- `POST /login` with `{username, password}` -> `data.token`. Then send `Authorization: Bearer <token>` on every request. Input is JSON; field names are case sensitive.
- Every response is `{ result: { errcode (0 ok, 1 error), errmsg }, data: {...} }`.
- Endpoints (all POST, under `/project/report/`):

| Flow (`src/lib/catalog.ts`) | Path | ProjectStatus (fixed) | Output |
|---|---|---|---|
| BEEA New Development | `newdev` | "New Development" | `data.report` = Base64 PDF |
| BEEA Retrofitting | `retrofit` | "Retrofitting Project" | Base64 PDF |
| BEEA In Operation | `inoperation` | "In Operation" | Base64 PDF |
| IEEA New Development | `newdevind` | "New Development" | JSON results |
| IEEA Existing Facility | `existingind` | "Existing Building" | JSON results |

- All values are sent as **strings**, except `Storey` (int) and `SystemTypes` (array of strings).
- IEEA accepts only `ProjectCountry` = "Egypt" and `BuildingType` = "Industrial Facility".
- Wizard steps = the spec's categories. BEEA: Project, Building Information, Facade, A/C, A/D, Lighting, MV, Other. IEEA: Project, Building Info, (Consumption, Facility KPIs for existing), System Types, then one step per selected system (existing only).

## Key rules to implement (details in docs/forms/*.md)
1. **BEEA fields are marked "required" but many apply only to certain AC / building types.** Only show/send applicable fields (see the applicability table in each BEEA doc); the spec's examples omit non-applicable ones.
2. **"Yes"-only toggles** (`ACOpt`, `DCV`, `PLC`, `EfficientApp`, `EfficientLift`, `EfficientEscalator`, `BEMS`): checkbox; omit the key when unchecked.
3. **Dependent ranges:** `ChillerEffi` depends on `ACType`; `ADFanEffi` depends on `ExistingADType` / `ADType`; `PNVArea` < `PACArea`.
4. **In-Operation** has no `ChillerEffi`, `CHWPEffi`, `CWPEffi`, `CTEffi`, `PACT`, `ADFanEffi`. Retrofit/In-Operation add existing-condition fields (`MonthlyConsumption`, `ExistingACEffi`, `ExistingADEffi`; Retrofit also `ExistingPLED`).
5. **IEEA industry-dependent inputs (v2.0):** `ChemicalProductType`, `SteelProductionRoute`, `GenerationTechnology`, `FabricType`, `PrintingMethod`, `FoodSubSector` (required for their industry only); Existing also `MonthlyClinkerProduction` (Cement, unless `ClinkerRatio` submitted) and `MonthlyAmmoniaProduction` (Fertilizers).
6. **IEEA Existing Facility KPIs are all OPTIONAL in v2.0** (~100 fields went required -> optional). `FacilityKPIs` may be `{}`; the engine derives what it can. System objects may be `{}` too. Keep KPI/system steps skippable and show "leave blank to auto-calculate".
7. **IEEA Existing system steps:** one object per *selected* system under `BuildingData.<SystemKey>`; provide aggregate values for multiple units of one system; units differ (Boilers `EnergyConsumptionMeasured` is GJ/yr, the rest kWh/yr).
8. **Retired / renamed KPIs:** Fertilizers `ElectricityIntensity` (retired, don't show); Iron & Steel route-specific KPIs merged into `SpecificEnergyConsumption`.

## Result handling
- **BEEA:** decode `data.report` (Base64) to a PDF; show inline (iframe/embed) and offer Download.
- **IEEA:** show results on screen, then generate a PDF (pdf-lib) containing: project summary + totals (energy GJ/yr, carbon t CO2e/yr), SEC vs BAT, **CoreIndicators (new in v2.0)**, KPI benchmarking with On Track / Needs Improvement badges, recommendations and **ValueSource badge (Submitted / Derived / Baseline)**, **KPIsNotAssessed list (treat as unknown, never as satisfactory)**, system performance benchmarking, energy analysis per system with **EnergyEstimateBasis (Measured / Calculated / Industry default / Not estimated)** and savings, water and raw-material analysis.
- Handle `null` everywhere: `BenchmarkingResult` can be null (info-only KPIs), `EnergyConsumption`/`EnergySavings` null when "Not estimated", `CoreIndicators` values null, `RawMaterialAnalysisAndRecommendation` null. A KPI's `...Recommendation` is the string "-" when On Track, otherwise an array.
- Renewable Generation `EnergyConsumption` is negative (generation offset); it and Construction Site Energy are excluded from `TotalEnergySavings`.

## Spec problems to be aware of (full list in docs/FORMS_SPEC.md)
- In-Operation example request uses `"Retrofitting Project"` as status; the table says `"In Operation"` (use the table value, confirm with SLEB).
- Retrofit / In-Operation range brackets are partly lost in the spec; `docs/forms` uses New Development's notation. `ExistingACEffi` `(0, 3` and `ExistingADEffi` `(0, 1` are truncated.
- Example JSON in the spec has syntax errors (curly quotes, missing colon after `"OtherSystem"`, trailing comma); the cleaned copies are in `docs/spec/examples/`.
- Not verified against the live API: whether optional/non-applicable fields can be omitted exactly as assumed, and whether range boundaries are inclusive.

## Plan / milestones
1. [x] Scaffold, `.env`, server-side token client (login, cache, retry on 401)
2. [x] Landing page (BEEA / IEEA cards) + sub-type selection (`src/lib/catalog.ts` holds the 5 flows)
3. [ ] **Config-driven multi-step form engine** driven by `docs/spec/forms.json`: one generic renderer + zod validation for all 5 flows (applicability/conditional visibility, dependent ranges, string serialization). First full flow: BEEA New Development. "Fill sample data" buttons use `docs/spec/examples/`.
4. [ ] BEEA: API route `POST /api/beea/[type]` (proxy, returns PDF bytes decoded from Base64), PDF viewer + Download
5. [ ] BEEA Retrofitting + In Operation
6. [ ] IEEA New Development: API route, results screen, JSON -> PDF (pdf-lib) + download
7. [ ] IEEA Existing Facility (largest: 17 industries' KPI sets, 18 system types)
8. [ ] Polish: validation messages, loading/error states, readable errors for `errcode: 1`, access-code gate before a public deploy

## Status / environment notes
- Build passes (`npm run build`); pages render. Landing + selection only; no forms yet.
- The live SLEB login has NOT been verified yet (the cloud sandbox could not reach sleb.sg). First thing to do locally: `npm run dev`, open `/api/auth/test`.
- Known minor issue: invalid URLs like `/assess/beea/bogus` render not-found content but return HTTP 200.
- Deploy target: Vercel (add the three env vars). The URL is public: add an access-code gate or Vercel Deployment Protection before sharing. Rotate the SLEB password after the demo (it was shared in chat).
