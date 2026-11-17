# API v2.0 — what changed vs v1.0 and what it means for the app

Source: `BEEA_IEEA_API_Document_v2.0_tracked_changes_vs_v1.0.docx` (one author, "IEEA v2.0", dated 2026-11-12). The tracked changes touch **only** the version label and the two industrial sections (2.2.4 IEEA New Development, 2.2.5 IEEA Existing Facility). Login and the three BEEA building endpoints are unchanged. We also checked that "reject all changes" reproduces the v1.0 PDF text, so there are no untracked edits.

## 1. New request fields

### Both IEEA flows — `BuildingData.BuildingInfo`
| Field | Required when IndustryType is | Values |
|---|---|---|
| `SteelProductionRoute` | Iron & Steel | "DRI-EAF", "Scrap-EAF" |
| `GenerationTechnology` | Electricity | "Coal-fired steam turbine", "Combined cycle gas turbine", "Gas-fired steam turbine", "Open cycle gas turbine" |
| `FabricType` | Textiles | "Knitted", "Woven" |
| `PrintingMethod` | Printing & Packaging | 9 methods (see docs/forms/ieea-new-development.md) |
| `FoodSubSector` | Food | 16 sub-sectors incl. "Other" |

`MonthlyProduction`: Furniture moved from *piece* to **ton**; Chemicals/Ethylene is tonnes of high value chemicals (HVC); Construction is m² of GFA built in the month.

### IEEA Existing Facility only
| Field | Where | Rule |
|---|---|---|
| `MonthlyClinkerProduction` | BuildingInfo | Required for Cement unless `ClinkerRatio` is submitted |
| `MonthlyAmmoniaProduction` | BuildingInfo | Required for Fertilizers |
| `MonthlyGasFlared`, `MonthlyMethaneEmissions` | BuildingInfo | Optional, Hydrocarbons; enter 0 for none (blank = not reported) |
| `MonthlyWasteGenerated` | BuildingInfo | Optional; Leather, Construction, Handicraft, Pharmaceuticals, Electronics |
| `MonthlyProductionTonnage` | BuildingInfo | Optional; Pharmaceuticals, Handicraft, Engineering, Electronics |
| `NumberOfMotors` | Motors system | Optional; improves the motor-efficiency benchmark |
| `SiteEnergyIntensity` | Facility KPIs – Construction | Optional (kWh/m² built) — Construction's primary energy KPI |
| Food `SpecificEnergyConsumption` | Facility KPIs – Food | Optional (MWh/t) |

## 2. Facility KPIs: required → optional (largest behavioural change)
About 100 Facility KPI fields changed from required to optional. When omitted, the engine derives the value from Consumption, MonthlyProduction, GFA, the optional quantities above, and submitted systems. A submitted value always takes precedence. Example 1 in the spec sends `"FacilityKPIs": {}` and five systems each as `{}`.

**App impact:** KPI step and system steps become skippable ("leave blank to auto-calculate"); validation must not require them.

## 3. KPI renames, removals, unit and meaning changes
| Change | Detail |
|---|---|
| Merged (Iron & Steel) | `SpecificEnergyConsumptionEAFRoute` and `SpecificEnergyConsumptionDRIEAFRoute` → `SpecificEnergyConsumption` (route from `SteelProductionRoute`) |
| Retired (Fertilizers) | `ElectricityIntensity` — ignored if sent; remove from the form |
| Unit change | Furniture SEC: kWh/m³ → GJ/t product |
| Unit change | Printing & Packaging `VOCEmissions`: g VOC/m² printed → kg VOC/t paper |
| Unit change | Leather `EnergyConsumption`: GJ/t finished leather → GJ/t raw hide |
| Meaning change | Engineering, Printing & Packaging, Handicraft, Electronics SEC / EnergyIntensity is now total energy (electricity + fuels) in kWh, not electricity only |
| Meaning change | Construction `EnergyUseIntensityEUI` is the completed building's operating energy (design model / certificate); no longer calculated from Consumption |
| Info only | `RefineryComplexityIndex`, `CapacityFactorSolarPV`, `CapacityFactorWind` get no benchmark verdict |
| Benchmark detail | Motor `MotorEfficiency` benchmarked vs IE3 minimum for average motor size when `NumberOfMotors` given (else flat 90 %); conveyor `MotorEfficiencyClass` vs IE4 for 75–200 kW, else IE3 |

## 4. New response fields and semantics (both IEEA flows)
| Field | Meaning | App impact |
|---|---|---|
| `CoreIndicators` | 5 per-unit figures (total energy GJ, fuel energy GJ, electricity kWh, water m³, CO₂ kg CO₂e) + fuel/electricity shares; any can be `null`; no verdict | New section on results screen and PDF |
| `<KPI>ValueSource` | "Submitted", "Derived", or "Baseline" (New Development) | Badge per KPI |
| `KPIsNotAssessed` | KPIs neither submitted nor derivable; absent from `KPIBenchmarking`; **treat as unknown, not satisfactory** | Own section ("Not assessed") |
| `EnergyEstimateBasis` (per system) | Existing: "Measured" / "Calculated" / "Industry default" / "Not estimated". New Development: "Industry default" / "Not estimated". "Not estimated" → energy and savings are `null` | Column + null handling |
| `<KPI>BenchmarkingResult` | `null` for information-only KPIs | Render "info only" instead of a verdict |
| `…Recommendation` | String `"-"` when On Track, else array | Handle both types |

Also: estimates are only ever scaled **down** to fit the facility's total (electrical systems are capped at electricity, fuel-fired systems at fuel); energy not accounted for belongs to systems not selected.

## 5. Example data
Example 1 (Cement, mandatory input only) and Example 2 (Cement, every optional input) were added to Existing Facility, and the New Development example values changed (it now returns `CoreIndicators`, `KPIsNotAssessed`, `EnergyEstimateBasis`). Cleaned, valid-JSON copies are in `docs/spec/examples/`.

## 6. Still open / to confirm with SLEB
- IEEA New Development: are the new selector fields mandatory? The table says "Required if IndustryType is …", but the New Development example only shows Automotive (no selector).
- The In-Operation example still uses `"Retrofitting Project"`.
- Whether range boundaries are inclusive (BEEA Retrofit / In-Operation tables lost their brackets).

## 7. Concrete to-do list for the codebase
1. Build the IEEA forms from `docs/spec/forms.json` (v2.0 fields), with KPI/system steps optional.
2. Add the five industry selectors and the Existing-only quantity fields with their conditional rules.
3. Results screen + PDF: add CoreIndicators, ValueSource badges, KPIsNotAssessed, EnergyEstimateBasis; null-safe rendering.
4. Sample-data buttons from `docs/spec/examples/`.
5. Keep BEEA work unchanged.
