# IEEA — New Development

- **Endpoint:** `POST {BASE}/project/report/newdevind`  (BASE = `https://sleb.sg/slebapi/beea`)
- **Fixed values:** `ProjectCountry` = `"Egypt"` (only value accepted), `ProjectStatus` = `"New Development"`, `BuildingType` = `"Industrial Facility"`
- **Response:** JSON results (no PDF). The app renders them and generates its own PDF.
- **Example payloads:** `docs/spec/examples/ieea-new-development.request.json`

Range notation (as in the API spec): `(a, b)` exclusive, `[a, b]` inclusive, `{"x", "y"}` allowed values, `∞` unbounded. All values are sent as **strings** except where Type says `int` or `array`.

## Request structure

```
ProjectName, ProjectAddress, ProjectPostalCode, ProjectCountry, ProjectGFA, ProjectStatus
BuildingData:
  BuildingInfo { BuildingName, GFA, BuildingType, IndustryType, <selector>, MonthlyProduction, PrimaryFuelType? }
  SystemTypes  ["Motors", …]   (one or more)
```

## Wizard steps and fields

### Step 1: Project

JSON location: `root level`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Project Name | `ProjectName` | string | **Yes** |  | Project name |
| Project Address | `ProjectAddress` | string | **Yes** |  | Project address |
| Project Postal Code | `ProjectPostalCode` | string | **Yes** |  | Project postal code |
| Project Country | `ProjectCountry` | string | **Yes** | {“Egypt”} | Project country |
| Project Gross Floor Area | `ProjectGFA` | string | **Yes** | (0, ∞) | Project gross floor area (excluding car park area) in m2 |
| Project Status | `ProjectStatus` | string | **Yes** | {“New Development”} | Project status |

### Step 2: Building Information

JSON location: `BuildingData.BuildingInfo`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Building Name | `BuildingName` | string | **Yes** | free text | Building Name |
| Building Gross Floor Area | `GFA` | string | **Yes** | (0, ∞) | Building Gross Floor Area (excluding car park area) in m2 |
| Building Type | `BuildingType` | string | **Yes** | {“Industrial Facility”} | Building Type |
| Industry Type | `IndustryType` | string | **Yes** | {“Cement”, “Iron & Steel”, “Fertilizers”, “Chemicals”, “Textiles”, “Food”, “Pharmaceuticals”, “Engineering”, “Automotive”, “Furniture”, “Printing & Packaging”, “Leather”, “Handicraft”, “Hydrocarbons”, “Electricity”, “Construction”, “Electronics”} | Industry Type |
| Chemical Product Type | `ChemicalProductType` | string | **Conditional** | {“Ethylene”, “Methanol”} | Required if IndustryType is “Chemicals”; not applicable for other industries. |
| Steel Production Route | `SteelProductionRoute` | string | **Conditional** | {“DRI-EAF”, “Scrap-EAF”} | **[new in v2.0]** / Required if IndustryType is “Iron & Steel”; not applicable for other industries. Selects the benchmark for SpecificEnergyConsumption. Blast furnace routes are not covered. |
| Generation Technology | `GenerationTechnology` | string | **Conditional** | {“Coal-fired steam turbine”, “Combined cycle gas turbine”, “Gas-fired steam turbine”, “Open cycle gas turbine”} | **[new in v2.0]** / Required if IndustryType is “Electricity”; not applicable for other industries. Selects the heat-rate benchmark (NetHeatRateThermal). Thermal technologies only. |
| Fabric Type | `FabricType` | string | **Conditional** | {“Knitted”, “Woven”} | **[new in v2.0]** / Required if IndustryType is “Textiles”; not applicable for other industries. Selects the steam, electricity and water benchmarks. |
| Printing Method | `PrintingMethod` | string | **Conditional** | {“Coldset web offset - forms”, “Coldset web offset - newspaper”, “Coldset web offset - other”, “Digital”, “Flexography”, “Heatset web offset”, “Rotogravure”, “Screen printing”, “Sheet-fed offset”} | **[new in v2.0]** / Required if IndustryType is “Printing & Packaging”; not applicable for other industries. Selects the paper waste and VOC limits. |
| Food Sub-Sector | `FoodSubSector` | string | **Conditional** | {“Compound animal feed”, “Dairy - cheese”, “Dairy - fermented milk”, “Dairy - market milk”, “Dairy - milk powder”, “Grain milling”, “Meat processing”, “Oilseed crushing and refining - rapeseed or sunflower”, “Oilseed crushing and refining - soybean”, “Potato processing”, “Starch - maize or wheat”, “Starch - potato”, “Sugar beet processing”, “Tomato processing”, “Vegetable oil refining (stand-alone)”, “Other”} | **[new in v2.0]** / Required if IndustryType is “Food”; not applicable for other industries. Selects the published energy benchmark for SpecificEnergyConsumption; “Other” where the facility fits none of the listed sub-sectors, in which case that KPI is not reported. |
| Average Monthly Production Quantity | `MonthlyProduction` | string | **Yes** | (0, ∞) | **[changed in v2.0]** / Average Monthly Production Quantity in ton (Cement, Iron & Steel, Chemicals, Fertilizers, Textiles, Food & Beverage, Printing & Packaging, Leather Industry, Furniture); piece (Engineering, Automotive, Electronics); US$1000 revenue (Pharmaceuticals, Handicraft); boe (Hydrocarbons); kWh (Electricity); m² (Construction). / For Chemicals with ChemicalProductType “Ethylene”: tonnes of high value chemicals (HVC). / For Construction: m² of gross floor area built in the month; Consumption is the energy and water used on construction sites in the same month. |
| Primary Fuel Type | `PrimaryFuelType` | string | Optional | {“Natural Gas”, “Coal”, “Diesel”, “Petrol”, “LPG”, “LNG”, “HFO”, “LFO”, “Electricity”} | The facility’s expected primary thermal fuel type at this design stage, if known – used only to select a more accurate emission factor for TotalCarbonEmission; does not affect TotalEnergyConsumption. Omit if not yet decided – the engine falls back to an industry-typical or generic blended estimate. |

### Step 3: System Types

JSON location: `BuildingData.SystemTypes (array)`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| System Types | `SystemTypes` | array | **Yes** | {"Motors", "Compressed Air Systems", "Boilers", "Furnaces", "Ovens", "Air Conditioners (AC Units)", "Air Handling Fans", "Lighting Systems", "Water Heaters", "Chillers", "Cooling Towers", "Computers / Data Centers", "Elevators / Mechanical Equipment", "Clinker Handling / Conveyors", "Pumps", "Renewable Generation (Solar PV/Thermal/Wind)", "Water/Wastewater Treatment", "Construction Site Energy"} | one or more System Types |


## Rules and conditional logic

- `ProjectCountry` must be `"Egypt"`; `BuildingType` must be `"Industrial Facility"`; `ProjectStatus` is `"New Development"` (fixed, not editable).
- `SystemTypes` must contain **one or more** of the 18 listed values. Unlike the Existing form, no per-system data is sent.
- **Electricity industry:** the spec notes that the generation / steam-cycle train is represented with the "Boilers" system type.
- `PrimaryFuelType` is optional: it only selects the emission factor for `TotalCarbonEmission` and does not change energy. Omit the key if undecided (do not send an empty string).

### Industry-dependent inputs
| IndustryType | Extra input in Building Information |
|---|---|
| Chemicals | `ChemicalProductType` — required ("Ethylene", "Methanol") |
| Iron & Steel | `SteelProductionRoute` — required ("DRI-EAF", "Scrap-EAF") **(new in v2.0)** |
| Electricity | `GenerationTechnology` — required (4 thermal technologies) **(new in v2.0)** |
| Textiles | `FabricType` — required ("Knitted", "Woven") **(new in v2.0)** |
| Printing & Packaging | `PrintingMethod` — required (9 methods) **(new in v2.0)** |
| Food | `FoodSubSector` — required (16 values incl. "Other") **(new in v2.0)** |

All other industries need no extra selector. A selector field must only be sent for its own industry ("not applicable for other industries").

### MonthlyProduction unit by industry
| Unit | Industries |
|---|---|
| ton | Cement, Iron & Steel, Chemicals, Fertilizers, Textiles, Food, Printing & Packaging, Leather, Furniture (Furniture moved here in v2.0) |
| piece | Engineering, Automotive, Electronics |
| US$1000 revenue | Pharmaceuticals, Handicraft |
| boe | Hydrocarbons |
| kWh | Electricity |
| m² | Construction (m² of GFA built in the month) |

Special cases: Chemicals + Ethylene → tonnes of high-value chemicals (HVC). The spec text says "Food & Beverage" in this list; the `IndustryType` value is "Food".

### Response handling
- Every KPI takes the industry baseline (`ValueSource` = "Baseline").
- `CoreIndicators`: `FuelEnergyPerUnit`, `ElectricityPerUnit` and the two shares are `null` (only total energy is estimated); `WaterPerUnit` is `null` where the industry has no water baseline.
- `KPIsNotAssessed` can only contain `VOCEmissions` for Printing & Packaging with `PrintingMethod` = "Digital". Treat anything listed there as **unknown**, never as satisfactory.
- `EnergyEstimateBasis` per system is "Industry default" or "Not estimated" (then energy/savings are `null`).
- A KPI’s `…Recommendation` is the string `"-"` when its result is "On Track", otherwise an array of strings. Handle both.

