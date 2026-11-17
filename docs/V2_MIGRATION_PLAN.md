# Plan: migrate the app to SLEB API v2.0 (IEEA changes)

Source: `claude-code-handoff/` (V2_CHANGES.md, FORMS_SPEC.md, forms/*.md, spec/forms.json, spec/examples/*).
Method: the v2.0 field list in `spec/forms.json` was diffed against `src/lib/forms/ieea.ts`, and the example
responses against `src/lib/ieea-result.ts` / `IeeaResults.tsx` / `ieea-pdf.ts`.

**Scope: IEEA only.** v2.0 does not touch login or the three BEEA endpoints. Do not rewrite BEEA.

Note: `claude-code-handoff/CLAUDE.md` is an older snapshot (milestones 3-8 unchecked, "no forms yet").
The repo is further ahead. Merge only the v2.0 facts into the repo `CLAUDE.md`; do not copy the file over.

## What already matches (no work)
- Numeric ranges and bracket styles of all KPI and system fields (checked field by field).
- Option lists of all 18 system objects; 17 industries; system-type -> JSON-key map.
- Existing `ChemicalProductType` selector, `ClinkerRatio (0,1]`, `PUE [1,∞)`.
- Systems are already optional and always sent as an object. Selected-system steps are not blocked by validation.

## Gap list (code today -> v2.0)

### A. Facility Info step (`buildingInfoFields` in ieea.ts) — both flows
| # | Change |
|---|---|
| A1 | Add selectors, shown and required only for their industry: `SteelProductionRoute` (Iron & Steel), `GenerationTechnology` (Electricity), `FabricType` (Textiles), `PrintingMethod` (Printing & Packaging), `FoodSubSector` (Food). Option lists in `docs/forms/ieea-new-development.md`. Hidden selector = key omitted (engine already drops hidden fields). |
| A2 | `PRODUCTION_UNIT`: Furniture `piece` -> `ton`. Unit text for Chemicals+Ethylene = "t HVC"; Construction = "m² GFA built in the month" (dynamic unit already supported). |

### B. Existing Facility only — extra Facility Info fields
| # | Field | Rule |
|---|---|---|
| B1 | `MonthlyClinkerProduction` | Cement; required unless `FacilityKPIs.ClinkerRatio` is filled (cross-field rule; new engine capability or a `requiredWhen`) |
| B2 | `MonthlyAmmoniaProduction` | Fertilizers; required; >0 |
| B3 | `MonthlyGasFlared`, `MonthlyMethaneEmissions` | Hydrocarbons; optional, `[0,∞)`; 0 is meaningful, blank = not reported (do not coerce "" to 0) |
| B4 | `MonthlyWasteGenerated` | Optional, `[0,∞)`; Leather, Construction, Handicraft, Pharmaceuticals, Electronics |
| B5 | `MonthlyProductionTonnage` | Optional, `>0`; Pharmaceuticals, Handicraft, Engineering, Electronics |
| B6 | `MonthlyRawMaterialConsumption` | Help text: Leather = t raw hide; dairy/meat/starch/sugar-beet Food = t raw material |
| B7 | Construction | Help text on Consumption step: it is site energy/water for the month |

### C. Facility KPIs step (`kpiFields`, `INDUSTRY_KPIS`) — largest change
| # | Change |
|---|---|
| C1 | **All KPI fields: `required: true` -> optional** (~100 fields). Step must be skippable; `FacilityKPIs: {}` must serialize. Add helper copy "Leave blank to auto-calculate". Note: `serialize` only writes `FacilityKPIs` leaf keys, so an empty step currently omits the `FacilityKPIs` object. Always emit `FacilityKPIs: {}` for Existing. |
| C2 | Iron & Steel: remove `SpecificEnergyConsumptionEAFRoute` and `...DRIEAFRoute`; add single `SpecificEnergyConsumption` (GJ/t crude steel, `(0,∞)`) |
| C3 | Fertilizers: remove `ElectricityIntensity` (retired; ignored if sent) |
| C4 | Food: add `SpecificEnergyConsumption` (MWh/t, optional) |
| C5 | Construction: add `SiteEnergyIntensity` (kWh/m² built, optional). `BuildingEnergyRating` becomes optional. |
| C6 | Unit changes: Furniture SEC `kWh/m³` -> `GJ/t product`; Printing & Packaging `VOCEmissions` `g VOC/m² printed` -> `kg VOC/t paper`; Leather `EnergyConsumption` `GJ/t finished leather` -> `GJ/t raw hide` |
| C7 | Meaning changes -> help text: Engineering / Printing / Handicraft / Electronics SEC or EI = total energy (electricity + fuels) in kWh; Construction `EUI` = completed building's operating energy from design model/certificate |
| C8 | Info-only KPIs (no verdict): `RefineryComplexityIndex`, `CapacityFactorSolarPV`, `CapacityFactorWind` |
| C9 | Per-KPI note: "derived if blank" vs "not assessed if blank" (from `forms.json` `notes`). Data-drive this rather than hand-typing: generate `INDUSTRY_KPIS` rows from `forms.json` (label, unit, range, optional) |

### D. System steps
| # | Change |
|---|---|
| D1 | Motors: add `NumberOfMotors` (optional, int-like, `[1,∞)`) |
| D2 | Unit wording only (cosmetic): Renewable `InstalledCapacity` / `AnnualGenerationMeasured` labels, Water Heater standby loss. Boilers `EnergyConsumptionMeasured` stays GJ/yr, others kWh/yr (already correct). |

### E. Results (`ieea-result.ts`, `IeeaResults.tsx`, `ieea-pdf.ts`, `sleb-mock.ts`)
| # | Change |
|---|---|
| E1 | **Bug under v2.0:** `kpiRows` strips only `OfBAT`/`BenchmarkingResult`/`Recommendation` suffixes. `<KPI>ValueSource` keys would render as bogus KPI rows. Add `ValueSource` suffix and expose it on `KpiRow`. |
| E2 | Types: add `CoreIndicators`, `KPIsNotAssessed: string[]`, `EnergyEstimateBasis`, nullable `BenchmarkingResult`, nullable energy/savings. |
| E3 | New section **Core indicators** (per-unit total energy, fuel, electricity, water, CO₂ + fuel/electricity shares; any can be `null` -> "–"; show "per `PerUnitOf`" in its unit). Screen + PDF. |
| E4 | KPI table: ValueSource badge (Submitted / Derived / Baseline); `BenchmarkingResult: null` -> "Info only" (not On Track / Needs Improvement); recommendation `"-"` or array (`toList` already handles both). |
| E5 | New section **Not assessed** from `KPIsNotAssessed`; wording "unknown, not satisfactory". Must never be shown as passing. |
| E6 | Energy analysis table: EnergyEstimateBasis column (Measured / Calculated / Industry default / Not estimated); `EnergyConsumption`/`EnergySavings` null when "Not estimated" -> "–". Check `energyRows` null handling and savings % calc. |
| E7 | Renewable Generation consumption is negative (offset). Show sign. Note that it and Construction Site Energy are excluded from `TotalEnergySavings`. |
| E8 | PDF: mirror E3-E7; summary table adds the selector + new optional quantities. Fix summary row `Industry` to include sub-type (selector value). |
| E9 | `sleb-mock.ts`: rebuild mock responses from `spec/examples/*.response.json` so mock mode exercises the v2 shapes (nulls, `KPIsNotAssessed`, "Not estimated"). |

### F. Engine / app plumbing
| # | Change |
|---|---|
| F1 | Cross-field rule support: "required unless X is filled" (B1) — small addition to `FieldDef` (e.g. `requiredWhen(values)`) and `validateField`. |
| F2 | Draft autosave key (`sleb-draft:<flow>`): old drafts hold removed KPIs and miss new fields. Bump key to `…:v2` or filter restored values through the schema. |
| F3 | Fill-sample buttons: use `spec/examples/` (New Dev: Automotive; Existing: Example 1 mandatory-only Cement and Example 2 all-inputs Cement). Offer both existing presets if cheap. |
| F4 | Server route unchanged in shape; `serialize` change in C1. Keep strings-only rule. |
| F5 | `catalog.ts` descriptions: IEEA Existing "KPIs and system data optional" copy. |

### G. Docs housekeeping
- Move `claude-code-handoff/docs/*` (forms, spec, V2_CHANGES, FORMS_SPEC, v2 docx) into repo `docs/`; keep v1 PDF.
- Update repo `CLAUDE.md`: API version v2.0, new key rules (selectors, optional KPIs, ValueSource, KPIsNotAssessed, EnergyEstimateBasis, null handling), updated "Form steps per flow" and result sections.
- Remove `claude-code-handoff/` after merge (untracked now).

## Execution order
1. **Docs + fixtures** (G): copy docs, add `spec/examples` as test fixtures.
2. **Engine** (F1, C1 serialization, F2).
3. **Schema** (A, B, C, D): preferably generate KPI/system rows from `forms.json` to avoid typos; keep labels/samples overridable.
4. **Fixture test**: serialize each `examples/*.request.json`-equivalent form state and compare with the example JSON (all 5 flows; BEEA included, to prove BEEA is untouched). Also `validateAll` on each example returns ok.
5. **Results model + UI + PDF** (E1-E8), then mock (E9).
6. **Manual pass in mock mode** across: Cement (existing, mandatory-only and all-inputs), Iron & Steel, Food, Printing/Digital (KPIsNotAssessed), a "Not estimated" system, and New Dev with each selector industry.
7. `npm run build` + lint; update CLAUDE.md/README.

## Decisions to confirm (affect behaviour)
1. **New Development selectors: required or optional?** The table says "Required if IndustryType is …" but the New Dev example (Automotive) can't confirm it. Proposed default: required (matches the table).
2. **Existing KPI step UX:** keep it as a collapsible/skippable step with "Leave blank to auto-calculate" (proposed), vs. hiding it behind an "Advanced" toggle.
3. **Existing sample data:** one button (mandatory-only) or two presets (mandatory-only + all-inputs)?
4. **Generate schema from `forms.json` at build time** (proposed; single source of truth, less typing) vs. keep hand-written tables and patch them.

## Still unverifiable until the live API is reachable (Cloudflare block)
Inclusive vs exclusive boundaries, whether hidden selectors may be sent/omitted exactly as assumed, whether `FacilityKPIs: {}` must be present, and the In-Operation `ProjectStatus` string.

## Status (implemented)
Done: A (selectors, units), B (existing quantities), C (KPIs optional/renamed/added, unit changes, `FacilityKPIs: {}`), D1 (`NumberOfMotors`), E1-E9 (results types, Core indicators, ValueSource, Not assessed, EnergyEstimateBasis, null handling, PDF, mock), F1/F2 (`requiredWhen`, draft key v2), G (docs moved, CLAUDE.md updated).
Decisions taken: selectors required (1), KPI step skippable with blank = auto-calculate (2), hand-patched tables (4). Not done: two sample presets for Existing (3; the single "Fill sample data" button remains). Verified: all 6 spec example requests round-trip through `serialize` and validate (only diff: the known In-Operation status typo in the spec example); sample data validates for all 5 flows and all 17 industries; build passes; PDFs generate from the real spec example responses.
