# Forms specification (API v2.0)

This folder describes **every input, rule and conditional** of the five forms the demo app must provide. It is generated from the v2.0 spec (`BEEA_IEEA_API_Document_v2.0_tracked_changes_vs_v1.0.docx`, tracked changes accepted); nothing was retyped by hand except the rule summaries, which are written from the spec’s own descriptions.

## Forms
| # | Form | Endpoint | Output | Doc | Fields |
|---|---|---|---|---|---|
| 1 | BEEA New Development | `POST /project/report/newdev` | PDF | [forms/beea-new-development.md](forms/beea-new-development.md) | 59 |
| 2 | BEEA Retrofitting | `POST /project/report/retrofit` | PDF | [forms/beea-retrofitting.md](forms/beea-retrofitting.md) | 63 |
| 3 | BEEA In Operation | `POST /project/report/inoperation` | PDF | [forms/beea-in-operation.md](forms/beea-in-operation.md) | 56 |
| 4 | IEEA New Development | `POST /project/report/newdevind` | JSON | [forms/ieea-new-development.md](forms/ieea-new-development.md) | 19 |
| 5 | IEEA Existing Facility | `POST /project/report/existingind` | JSON | [forms/ieea-existing-facility.md](forms/ieea-existing-facility.md) | 255 |

Machine-readable versions: `spec/forms.json`, `spec/ieea-lookups.json`, `spec/examples/*.json`. What changed in v2.0: [V2_CHANGES.md](V2_CHANGES.md).

## General rules (all forms)
1. **Base URL** `https://sleb.sg/slebapi/beea`. HTTPS + JSON. Field names are case sensitive.
2. **Authentication:** `POST /login` with `{"username","password"}` → `data.token`; send `Authorization: Bearer <token>` on every other call. The proxy in `src/lib/sleb-client.ts` handles this server-side.
3. **Response envelope:** `{ "result": { "errcode": 0|1, "errmsg": "…" }, "data": { … } }`. `errcode` 1 = error: show `errmsg`.
4. **All values are strings**, e.g. `"0.52"`, `"2025"`. Exceptions: `Storey` is an integer; `SystemTypes` is an array of strings.
5. **Range notation:** `(a, b)` exclusive, `[a, b]` inclusive, `{"x","y"}` allowed values, `∞` unbounded. Where the spec prints a bare `a, b` the bracket style is unknown.
6. **Fixed values** (do not make them editable): `ProjectStatus` per flow; IEEA `ProjectCountry` = "Egypt" and `BuildingType` = "Industrial Facility".
7. **Validate on our side** before calling the API (ranges, enums, conditional requirements), then still display the API's `errmsg`.
8. **Free-text fields** (names, address, postal code) have no format rule in the spec.

## Shared lookups
**BEEA `BuildingType`:**
- Office Building
- Retail Building
- Hotel
- Healthcare Facility
- Educational Institution
- Industrial Building
- Residential Building
- Mixed Development
- Others

**BEEA `ACType`:**
- Water-cooled Chilled Water Plant
- Air-cooled Chilled Water Plant
- Unitary Air-conditioning System
- District Cooling System

**BEEA `ExistingADType`:** AHU-CAV, AHU-VAV, FCU-CAV, FCU-VAV — **`ADType`** (VSD upgrade, only for the two CAV types): AHU-VAV, FCU-VAV

**IEEA `IndustryType` (17):**
- Cement
- Iron & Steel
- Fertilizers
- Chemicals
- Textiles
- Food
- Pharmaceuticals
- Engineering
- Automotive
- Furniture
- Printing & Packaging
- Leather
- Handicraft
- Hydrocarbons
- Electricity
- Construction
- Electronics

**IEEA `SystemTypes` (18) → JSON key used in Existing Facility:**
- Motors → `Motors`
- Compressed Air Systems → `CompressedAirSystems`
- Boilers → `Boilers`
- Furnaces → `Furnaces`
- Ovens → `Ovens`
- Air Conditioners (AC Units) → `AirConditioners`
- Air Handling Fans → `AirHandlingFans`
- Lighting Systems → `LightingSystems`
- Water Heaters → `WaterHeaters`
- Chillers → `Chillers`
- Cooling Towers → `CoolingTowers`
- Computers / Data Centers → `ComputersDataCenters`
- Elevators / Mechanical Equipment → `ElevatorsMechanicalEquipment`
- Clinker Handling / Conveyors → `ClinkerHandlingConveyors`
- Pumps → `Pumps`
- Renewable Generation (Solar PV/Thermal/Wind) → `RenewableGeneration`
- Water/Wastewater Treatment → `WaterWastewaterTreatment`
- Construction Site Energy → `ConstructionSiteEnergy`

## How the docs map to the wizard
Each doc lists the wizard steps in order. A step = a category of the request (the spec’s "Category" column) and each field row gives: label, JSON variable, type, required, range or allowed values, and the spec’s description/rules. The **JSON location** line under each step tells where the fields go in the request body. The `forms.json` entries carry the same data with a `path` such as `BuildingData.ACSystem.ChillerEffi`.

## Spec issues and ambiguities (verify against the live API)
**Typos in the spec table text**
- BEEA New Development: `ProjectStatus` range printed as `{"New Development}` (missing closing quote).
- In-Operation: the spec’s example request uses `"ProjectStatus": "Retrofitting Project"`, but the table says `"In Operation"`. We use the table value.
- BEEA Retrofitting and In-Operation tables lost most range brackets (e.g. `0.2, 1.5` instead of `(0.2, 1.5)`; `(0, 168` with no closing bracket). The docs restore the New Development notation where the numbers are identical. `ExistingACEffi` (`(0, 3`) and `ExistingADEffi` (`(0, 1`) are truncated, so their upper bound inclusivity is unknown; `ExistingPLED` is printed `0, 100`.
- In-Operation table: the group labels are shifted down one row at every group boundary and there is an empty trailing "Other System" row. The docs use the grouping of New Development, which matches the spec’s example JSON.
- Example JSON blocks are not valid JSON as printed (curly quotes; missing colon after `"OtherSystem"`; trailing comma in the In-Operation request). Cleaned copies are in `spec/examples/`.
- `MonthlyProduction` unit text says "Food & Beverage", while the `IndustryType` value is "Food".

**Ambiguous behaviour**
- `FBArea` and `SupermarArea` are documented as `(0, ∞)` (0 excluded) but every BEEA example request sends `"0"`. The docs treat the range as `[0, ∞)`.
- All BEEA fields are labelled "required", yet many say they apply only to certain AC/building types. The docs treat them as *required when applicable*; the spec examples support this.
- "Yes"-only fields have no "No" value. The docs assume the key is omitted when off.
- `ADFanEffi` rules mention `ADType == None`; "None" is not a listed value (interpreted as "ADType omitted").
- Range boundary inclusivity for BEEA Retrofit/In-Operation beyond what is printed.
- Relationship between project-level `ProjectGFA` and building-level `GFA` (examples use the same value).
- IEEA New Development: the new industry selectors are described as required for their industry, but the spec’s New Development example contains none (it uses Automotive).
- Token lifetime is not documented; the client refreshes on 401 and every 25 minutes.
