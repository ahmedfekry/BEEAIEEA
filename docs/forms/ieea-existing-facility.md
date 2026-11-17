# IEEA — Existing Facility

- **Endpoint:** `POST {BASE}/project/report/existingind`  (BASE = `https://sleb.sg/slebapi/beea`)
- **Fixed values:** `ProjectCountry` = `"Egypt"` (only value accepted), `ProjectStatus` = `"Existing Building"`, `BuildingType` = `"Industrial Facility"`
- **Response:** JSON results (no PDF). The app renders them and generates its own PDF.
- **Example payloads:** `docs/spec/examples/ieea-existing-facility-example1-mandatory-only.*.json` and `...example2-all-inputs.*.json`

Range notation (as in the API spec): `(a, b)` exclusive, `[a, b]` inclusive, `{"x", "y"}` allowed values, `∞` unbounded. All values are sent as **strings** except where Type says `int` or `array`.

## Request structure

```
ProjectName, ProjectAddress, ProjectPostalCode, ProjectCountry, ProjectGFA, ProjectStatus
BuildingData:
  BuildingInfo:
    BuildingName, GFA, BuildingType, IndustryType, <selector field>, MonthlyProduction, <optional quantities>
    Consumption   { monthly energy / water / raw material }
    FacilityKPIs  { KPIs of the selected industry — ALL OPTIONAL, may be {} }
  SystemTypes: ["Motors", …]
  <SystemKey>: { … }   one object per selected system, e.g. "Motors", "ClinkerHandlingConveyors" (fields optional, may be {})
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
| Project Status | `ProjectStatus` | string | **Yes** | {“Existing Building”} | Project status |

### Step 2: Building Information

JSON location: `BuildingData.BuildingInfo`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Building Name | `BuildingName` | string | **Yes** | free text | Building Name |
| Building Gross Floor Area | `GFA` | string | **Yes** | (0, ∞) | Building Gross Floor Area (excluding car park area) in m2 |
| Building Type | `BuildingType` | string | **Yes** | {“Industrial Facility”} | Building Type |
| Industry Type | `IndustryType` | string | **Yes** | {“Cement”, “Iron & Steel”, “Fertilizers”, “Chemicals”, “Textiles”, “Food”, “Pharmaceuticals”, “Engineering”, “Automotive”, “Furniture”, “Printing & Packaging”, “Leather”, “Handicraft”, “Hydrocarbons”, “Electricity”, “Construction”, “Electronics”} | Industry Type / Note: for “Electricity”, represent the generation/steam-cycle train using “Boilers” (e.g., HRSG or steam generation). |
| Chemical Product Type | `ChemicalProductType` | string | **Conditional** | {“Ethylene”, “Methanol”} | Required if IndustryType is “Chemicals”; not applicable for other industries. |
| Steel Production Route | `SteelProductionRoute` | string | **Conditional** | {“DRI-EAF”, “Scrap-EAF”} | **[new in v2.0]** / Required if IndustryType is “Iron & Steel”; not applicable for other industries. Selects the benchmark for SpecificEnergyConsumption. Blast furnace routes are not covered. |
| Generation Technology | `GenerationTechnology` | string | **Conditional** | {“Coal-fired steam turbine”, “Combined cycle gas turbine”, “Gas-fired steam turbine”, “Open cycle gas turbine”} | **[new in v2.0]** / Required if IndustryType is “Electricity”; not applicable for other industries. Selects the heat-rate benchmark (NetHeatRateThermal). Thermal technologies only. |
| Fabric Type | `FabricType` | string | **Conditional** | {“Knitted”, “Woven”} | **[new in v2.0]** / Required if IndustryType is “Textiles”; not applicable for other industries. Selects the steam, electricity and water benchmarks. |
| Printing Method | `PrintingMethod` | string | **Conditional** | {“Coldset web offset - forms”, “Coldset web offset - newspaper”, “Coldset web offset - other”, “Digital”, “Flexography”, “Heatset web offset”, “Rotogravure”, “Screen printing”, “Sheet-fed offset”} | **[new in v2.0]** / Required if IndustryType is “Printing & Packaging”; not applicable for other industries. Selects the paper waste and VOC limits. |
| Food Sub-Sector | `FoodSubSector` | string | **Conditional** | {“Compound animal feed”, “Dairy - cheese”, “Dairy - fermented milk”, “Dairy - market milk”, “Dairy - milk powder”, “Grain milling”, “Meat processing”, “Oilseed crushing and refining - rapeseed or sunflower”, “Oilseed crushing and refining - soybean”, “Potato processing”, “Starch - maize or wheat”, “Starch - potato”, “Sugar beet processing”, “Tomato processing”, “Vegetable oil refining (stand-alone)”, “Other”} | **[new in v2.0]** / Required if IndustryType is “Food”; not applicable for other industries. Selects the published energy benchmark for SpecificEnergyConsumption; “Other” where the facility fits none of the listed sub-sectors, in which case that KPI is not reported. |
| Average Monthly Production Quantity | `MonthlyProduction` | string | **Yes** | (0, ∞) | **[changed in v2.0]** / Average Monthly Production Quantity in ton (Cement, Iron & Steel, Chemicals, Fertilizers, Textiles, Food & Beverage, Printing & Packaging, Leather Industry, Furniture); piece (Engineering, Automotive, Electronics); US$1000 revenue (Pharmaceuticals, Handicraft); boe (Hydrocarbons); kWh (Electricity); m² (Construction). / For Chemicals with ChemicalProductType “Ethylene”: tonnes of high value chemicals (HVC). / For Construction: m² of gross floor area built in the month; Consumption is the energy and water used on construction sites in the same month. |
| Average Monthly Ammonia Production | `MonthlyAmmoniaProduction` | string | **Conditional** | (0, ∞) | **[new in v2.0]** / required when IndustryType is “Fertilizers”; not used otherwise. Average monthly ammonia (NH₃) production in ton. AmmoniaEnergyIntensity and NaturalGasConsumptionIntensity are derived per tonne of ammonia from it, so neither needs to be submitted. MonthlyProduction is total fertilizer product and is never used for these two KPIs. |
| Average Monthly Clinker Production | `MonthlyClinkerProduction` | string | **Conditional** | (0, ∞) | **[new in v2.0]** / required when IndustryType is “Cement”, unless ClinkerRatio is submitted under FacilityKPIs; not used otherwise. Average monthly clinker production in ton. ClinkerRatio is derived from it as clinker production / cement production, and it lets SpecificThermalEnergyConsumption and CO2Intensity be derived (CO2Intensity with calcination emissions included). |
| Average Monthly Gas Flared | `MonthlyGasFlared` | string | Optional | [0, ∞) | **[new in v2.0]** / Average monthly volume of gas flared in m³. Hydrocarbons only. When provided, FlaringIntensity is derived; together with MonthlyMethaneEmissions it also allows GHGIntensity to be derived. Enter 0 where nothing is flared — a blank means not reported. |
| Average Monthly Methane Emissions | `MonthlyMethaneEmissions` | string | Optional | [0, ∞) | **[new in v2.0]** / Average monthly methane emitted (vented, leaked or unburnt) in ton CH₄. Hydrocarbons only. Together with MonthlyGasFlared it allows GHGIntensity to be derived. Enter 0 where there are none — a blank means not reported. |
| Average Monthly Waste Generated | `MonthlyWasteGenerated` | string | Optional | [0, ∞) | **[new in v2.0]** / Average monthly waste generated in ton, counting the waste the industry’s KPI counts: solid waste (Leather), construction waste (Construction), material waste (Handicraft), process solid waste (Pharmaceuticals), hazardous waste (Electronics). When provided, that industry’s waste KPI is derived. |
| Average Monthly Production Tonnage | `MonthlyProductionTonnage` | string | Optional | (0, ∞) | **[new in v2.0]** / Average monthly production in ton, for industries whose MonthlyProduction is counted in pieces or revenue (Pharmaceuticals, Handicraft, Engineering, Electronics). When provided, that industry’s per-tonne KPIs are derived. |

### Step 3: Consumption

JSON location: `BuildingData.BuildingInfo.Consumption`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Average Monthly Electricity Consumption | `MonthlyElectricityConsumption` | string | **Yes** | [0, ∞) | Average Monthly Electricity Consumption in kWh |
| Average Monthly Natural Gas Consumption | `MonthlyNaturalGasConsumption` | string | **Yes** | [0, ∞) | Average Monthly Natural Gas Consumption in m3 |
| Average Monthly Coal Consumption | `MonthlyCoalConsumption` | string | **Yes** | [0, ∞) | Average Monthly Coal Consumption in ton |
| Average Monthly Diesel Consumption | `MonthlyDieselConsumption` | string | **Yes** | [0, ∞) | Average Monthly Diesel Consumption in m3 |
| Average Monthly Petrol Consumption | `MonthlyPetrolConsumption` | string | **Yes** | [0, ∞) | Average Monthly Petrol Consumption in m3 |
| Average Monthly LPG Consumption | `MonthlyLPGConsumption` | string | **Yes** | [0, ∞) | Average Monthly LPG Consumption in ton |
| Average Monthly LNG Consumption | `MonthlyLNGConsumption` | string | **Yes** | [0, ∞) | Average Monthly LNG Consumption in ton |
| Average Monthly HFO Consumption | `MonthlyHFOConsumption` | string | **Yes** | [0, ∞) | Average Monthly HFO Consumption in m3 |
| Average Monthly LFO Consumption | `MonthlyLFOConsumption` | string | **Yes** | [0, ∞) | Average Monthly LFO Consumption in m3 |
| Average Monthly Other Energy Consumption | `MonthlyOtherConsumption` | string | **Yes** | [0, ∞) | Average Monthly Other Consumption in GJ |
| Weighted Emission Factor of Other Energy | `OtherEnergyEF` | string | **Yes** | [0, ∞) | Weighted Emission Factor of Other Energy in ton CO2e/GJ |
| Average Monthly Water Consumption | `MonthlyWaterConsumption` | string | **Yes** | [0, ∞) | Average Monthly Water Consumption in m3 |
| Average Monthly Raw Material Consumption | `MonthlyRawMaterialConsumption` | string | **Yes** | [0, ∞) | **[changed in v2.0]** / Average Monthly Raw Material Consumption in ton / For Leather: tonnes of raw hide processed. For Food sub-sectors whose benchmark is per tonne of raw materials (dairy, meat, starch, sugar beet): tonnes of raw material processed. These figures are the denominators of derived KPIs. |

### Step 4: Facility KPIs (dynamic, one set per industry) — ALL OPTIONAL

Show only the KPI set for the chosen `IndustryType`. JSON location: `BuildingData.BuildingInfo.FacilityKPIs` (send `{}` if the user enters none).
Leave a KPI blank to let the engine derive it (see the Notes column). If a value is submitted it always takes precedence. Retired and renamed KPIs are marked in the notes.

#### KPIs — Cement

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Specific Thermal Energy Consumption | `SpecificThermalEnergyConsumption` | string | Optional | (0, ∞) | **[changed in v2.0]** / Specific Thermal Energy Consumption in GJ/t clinker / Derived automatically as annual thermal energy / annual clinker production when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| Specific Electrical Energy Consumption | `SpecificElectricalEnergyConsumption` | string | Optional | (0, ∞) | **[changed in v2.0]** / Specific Electrical Energy Consumption in kWh/t cement / Derived automatically as annual electricity consumption / annual production when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| CO₂ Intensity | `CO2Intensity` | string | Optional | (0, ∞) | **[changed in v2.0]** / CO₂ Intensity in kg CO₂/t cement / Derived automatically as (TotalCarbonEmission + calcination CO₂ at the IPCC default of 0.52 t CO₂ per tonne of clinker) / annual production when not provided. Calcination is added because the published benchmark includes process emissions. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| Clinker Ratio | `ClinkerRatio` | string | Optional | (0, 1] | **[changed in v2.0]** / Clinker Ratio / Derived automatically as MonthlyClinkerProduction / MonthlyProduction when not provided. If submitted, MonthlyClinkerProduction is not required. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| Alternative Fuel Rate | `AlternativeFuelRate` | string | Optional | [0, 100] | **[changed in v2.0]** / Alternative Fuel Rate in % / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |

#### KPIs — Iron & Steel

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Specific Energy Consumption | `SpecificEnergyConsumption` | string | Optional | (0, ∞) | **[changed in v2.0]** / Specific Energy Consumption in GJ/t crude steel, for the route given in SteelProductionRoute / Derived automatically as TotalEnergyConsumption / annual production when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| EAF Electricity Intensity | `EAFElectricityIntensity` | string | Optional | (0, ∞) | **[changed in v2.0]** / EAF Electricity Intensity in kWh/t crude steel / Derived automatically as annual electricity consumption / annual production when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| Motor System Efficiency | `MotorSystemEfficiency` | string | Optional | [0, 100] | **[changed in v2.0]** / Motor System Efficiency in % / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| CO₂ Intensity | `CO2Intensity` | string | Optional | (0, ∞) | **[changed in v2.0]** / CO₂ Intensity in t CO₂/t steel / Derived automatically as TotalCarbonEmission / annual production when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| Scrap Recovery Rate | `ScrapRecoveryRate` | string | Optional | [0, 100] | **[changed in v2.0]** / Scrap Recovery Rate in % / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |

#### KPIs — Fertilizers

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Ammonia Energy Intensity | `AmmoniaEnergyIntensity` | string | Optional | (0, ∞) | **[changed in v2.0]** / Ammonia Energy Intensity in GJ/t NH₃ / Derived automatically as TotalEnergyConsumption / annual ammonia production (MonthlyAmmoniaProduction x 12) when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| Natural Gas Consumption Intensity | `NaturalGasConsumptionIntensity` | string | Optional | (0, ∞) | **[changed in v2.0]** / Natural Gas Consumption Intensity in Nm³/t NH₃ / Derived automatically as annual natural gas consumption / annual ammonia production when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| Steam Consumption | `SteamConsumption` | string | Optional | (0, ∞) | **[changed in v2.0]** / Steam Consumption in GJ/t product / Derived automatically as annual thermal (non-electric) energy / annual production when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| CO₂ Capture Rate | `CO2CaptureRate` | string | Optional | [0, 100] | **[changed in v2.0]** / CO₂ Capture Rate in % / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Electricity Intensity | `ElectricityIntensity` | string | Optional | (0, ∞) | **[changed in v2.0]** / Electricity Intensity in kWh/t NH₃ / Retired in v2.0: no longer benchmarked, and ignored if sent. AmmoniaEnergyIntensity is total energy and already includes electricity. |

#### KPIs — Chemicals

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Specific Energy Consumption | `SpecificEnergyConsumption` | string | Optional | (0, ∞) | **[changed in v2.0]** / Specific Energy Consumption in GJ/ton product / For ChemicalProductType “Ethylene” the unit is GJ per tonne of high value chemicals (HVC: ethylene, propylene, butadiene, aromatics and hydrogen), the basis on which the benchmark is published. / Derived automatically as TotalEnergyConsumption / annual production when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| Motor System Efficiency | `MotorSystemEfficiency` | string | Optional | [0, 100] | **[changed in v2.0]** / Motor System Efficiency in % / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Compressed Air Specific Energy | `CompressedAirSpecificEnergy` | string | Optional | (0, ∞) | **[changed in v2.0]** / Compressed Air Specific Energy in kWh/m³ compressed air / When the Compressed Air Systems system is submitted with SpecificPowerConsumption and no value is given here, derived automatically as that system’s SpecificPowerConsumption / 60 (kW per m³/min to kWh per m³). Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. Not assessed if no value is provided and it cannot be derived: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Steam System Efficiency | `SteamSystemEfficiency` | string | Optional | [0, 100] | **[changed in v2.0]** / Steam System Efficiency in % / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Process Heat Recovery Rate | `ProcessHeatRecoveryRate` | string | Optional | [0, 100] | **[changed in v2.0]** / Process Heat Recovery Rate in % / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |

#### KPIs — Textiles

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Steam Consumption | `SteamConsumption` | string | Optional | (0, ∞) | **[changed in v2.0]** / Steam Consumption in GJ/t fabric / Derived automatically as annual thermal (non-electric) energy / annual production when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| Electricity Intensity | `ElectricityIntensity` | string | Optional | (0, ∞) | **[changed in v2.0]** / Electricity Intensity in kWh/t fabric / Derived automatically as annual electricity consumption / annual production when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| Boiler Efficiency | `BoilerEfficiency` | string | Optional | [0, 100] | **[changed in v2.0]** / Boiler Efficiency in % / When the Boilers system is submitted with ThermalEfficiency and no value is given here, derived automatically as that system’s ThermalEfficiency. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. Not assessed if no value is provided and it cannot be derived: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Water Consumption | `WaterConsumption` | string | Optional | (0, ∞) | **[changed in v2.0]** / Water Consumption in m³/t fabric / Derived automatically as annual water consumption / annual production when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| Dyebath Heat Recovery Rate | `DyebathHeatRecoveryRate` | string | Optional | [0, 100] | **[changed in v2.0]** / Dyebath Heat Recovery Rate in % / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |

#### KPIs — Food

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Thermal Energy Intensity | `ThermalEnergyIntensity` | string | Optional | (0, ∞) | **[changed in v2.0]** / Thermal Energy Intensity in GJ/t product / Derived automatically as annual thermal (non-electric) energy / annual production when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| Electricity Intensity | `ElectricityIntensity` | string | Optional | (0, ∞) | **[changed in v2.0]** / Electricity Intensity in kWh/t product / Derived automatically as annual electricity consumption / annual production when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| Specific Energy Consumption | `SpecificEnergyConsumption` | string | Optional | (0, ∞) | **[new in v2.0]** / Specific Energy Consumption in MWh/t — total energy (fuel, steam and electricity) per tonne of product or of raw materials, whichever the published benchmark for the FoodSubSector uses. / Derived automatically as TotalEnergyConsumption / annual production, or / annual raw material consumption. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. Not reported for FoodSubSector “Other”. |
| Refrigeration COP | `RefrigerationCOP` | string | Optional | (0, ∞) | **[changed in v2.0]** / Refrigeration COP in COP / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Boiler Efficiency | `BoilerEfficiency` | string | Optional | [0, 100] | **[changed in v2.0]** / Boiler Efficiency in % / When the Boilers system is submitted with ThermalEfficiency and no value is given here, derived automatically as that system’s ThermalEfficiency. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. Not assessed if no value is provided and it cannot be derived: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Renewable Energy Share | `RenewableEnergyShare` | string | Optional | [0, 100] | **[changed in v2.0]** / Renewable Energy Share in % / When the Renewable Generation system is submitted and no value is given here, derived automatically as on-site renewable generation / (TotalEnergyConsumption + that generation). Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. Not assessed if no value is provided and it cannot be derived: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |

#### KPIs — Pharmaceuticals

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Energy Intensity | `EnergyIntensity` | string | Optional | (0, ∞) | **[changed in v2.0]** / Energy Intensity in GJ / $M revenue / Derived automatically as TotalEnergyConsumption / annual revenue when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| Electricity Consumption | `ElectricityConsumption` | string | Optional | (0, ∞) | **[changed in v2.0]** / Electricity Consumption in kWh/m²/yr / Derived automatically as annual electricity consumption / GFA when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| Water Consumption Intensity | `WaterConsumptionIntensity` | string | Optional | (0, ∞) | **[changed in v2.0]** / Water Consumption Intensity in m³/t product / When MonthlyProductionTonnage is provided and no value is given here, derived automatically as annual water consumption / annual production tonnage. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. Not assessed if no value is provided and it cannot be derived: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| CO₂ Intensity | `CO2Intensity` | string | Optional | (0, ∞) | **[changed in v2.0]** / CO₂ Intensity in kg CO₂/$M revenue / Derived automatically as TotalCarbonEmission / annual revenue when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| Waste Generation Rate | `WasteGenerationRate` | string | Optional | (0, ∞) | **[changed in v2.0]** / Waste Generation Rate in kg waste/t product / When MonthlyWasteGenerated and MonthlyProductionTonnage are both provided and no value is given here, derived automatically as annual waste generated / annual production tonnage. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. Not assessed if no value is provided and it cannot be derived: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Solvent Recovery Rate | `SolventRecoveryRate` | string | Optional | [0, 100] | **[changed in v2.0]** / Solvent Recovery Rate in % / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |

#### KPIs — Engineering

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Specific Energy Consumption | `SpecificEnergyConsumption` | string | Optional | (0, ∞) | **[changed in v2.0]** / Specific Energy Consumption in kWh/unit / From v2.0 this is total energy — electricity and all fuels — expressed in kWh, not electricity alone. / Derived automatically as TotalEnergyConsumption (electricity and all fuels) in kWh / annual production when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| Motor System Efficiency | `MotorSystemEfficiency` | string | Optional | [0, 100] | **[changed in v2.0]** / Motor System Efficiency in % / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Compressed Air Efficiency | `CompressedAirEfficiency` | string | Optional | (0, ∞) | **[changed in v2.0]** / Compressed Air Efficiency in kWh/m³ / When the Compressed Air Systems system is submitted with SpecificPowerConsumption and no value is given here, derived automatically as that system’s SpecificPowerConsumption / 60 (kW per m³/min to kWh per m³). Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. Not assessed if no value is provided and it cannot be derived: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Material Utilisation Rate | `MaterialUtilisationRate` | string | Optional | [0, 100] | **[changed in v2.0]** / Material Utilisation Rate in % / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Defect Rate (PPM) | `DefectRatePPM` | string | Optional | (0, ∞) | **[changed in v2.0]** / Defect Rate (PPM) in PPM / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| CO₂ Intensity | `CO2Intensity` | string | Optional | (0, ∞) | **[changed in v2.0]** / CO₂ Intensity in kg CO₂/t product / When MonthlyProductionTonnage is provided and no value is given here, derived automatically as TotalCarbonEmission / annual production tonnage. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. Not assessed if no value is provided and it cannot be derived: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |

#### KPIs — Automotive

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Specific Energy Consumption | `SpecificEnergyConsumption` | string | Optional | (0, ∞) | **[changed in v2.0]** / Specific Energy Consumption in GJ/vehicle / Derived automatically as TotalEnergyConsumption / annual production when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| Paint Shop Energy Intensity | `PaintShopEnergyIntensity` | string | Optional | (0, ∞) | **[changed in v2.0]** / Paint Shop Energy Intensity in kWh/vehicle / Derived automatically as annual electricity consumption / annual production when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| Water Consumption | `WaterConsumption` | string | Optional | (0, ∞) | **[changed in v2.0]** / Water Consumption in m³/vehicle / Derived automatically as annual water consumption / annual production when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| CO₂ Intensity | `CO2Intensity` | string | Optional | (0, ∞) | **[changed in v2.0]** / CO₂ Intensity in t CO₂/vehicle / Derived automatically as TotalCarbonEmission / annual production when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| Scrap Recovery Rate | `ScrapRecoveryRate` | string | Optional | [0, 100] | **[changed in v2.0]** / Scrap Recovery Rate in % / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Robot Utilisation Rate | `RobotUtilisationRate` | string | Optional | [0, 100] | **[changed in v2.0]** / Robot Utilisation Rate in % / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Tyre Rolling Resistance | `TyreRollingResistance` | string | Optional | (0, ∞) | **[changed in v2.0]** / Tyre Rolling Resistance in N/kN / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |

#### KPIs — Furniture

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Wood Material Yield | `WoodMaterialYield` | string | Optional | [0, 100] | **[changed in v2.0]** / Wood Material Yield in % / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Specific Energy Consumption | `SpecificEnergyConsumption` | string | Optional | (0, ∞) | **[changed in v2.0]** / Specific Energy Consumption in GJ/t product / From v2.0 total energy (electricity and fuels) per tonne of finished furniture; it was kWh/m³. / Derived automatically as TotalEnergyConsumption / annual production when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| VOC Emissions Rate | `VOCEmissionsRate` | string | Optional | (0, ∞) | **[changed in v2.0]** / VOC Emissions Rate in g VOC/m² surface / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Dust Extraction Efficiency | `DustExtractionEfficiency` | string | Optional | [0, 100] | **[changed in v2.0]** / Dust Extraction Efficiency in % / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Water-based Coatings Share | `WaterBasedCoatingsShare` | string | Optional | [0, 100] | **[changed in v2.0]** / Water-based Coatings Share in % / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Waste Wood Recovery Rate | `WasteWoodRecoveryRate` | string | Optional | [0, 100] | **[changed in v2.0]** / Waste Wood Recovery Rate in % / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |

#### KPIs — Printing & Packaging

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Specific Energy Consumption | `SpecificEnergyConsumption` | string | Optional | (0, ∞) | **[changed in v2.0]** / Specific Energy Consumption in kWh/t output / From v2.0 this is total energy — electricity and all fuels — expressed in kWh, not electricity alone. / Derived automatically as TotalEnergyConsumption (electricity and all fuels) in kWh / annual production when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| Ink & Chemical Waste Rate | `InkChemicalWasteRate` | string | Optional | (0, ∞) | **[changed in v2.0]** / Ink & Chemical Waste Rate in kg/t product / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Paper/Material Waste Rate | `PaperMaterialWasteRate` | string | Optional | [0, 100] | **[changed in v2.0]** / Paper/Material Waste Rate in % / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| VOC Emissions | `VOCEmissions` | string | Optional | (0, ∞) | **[changed in v2.0]** / VOC Emissions in kg VOC/t paper / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Recycled Content Share | `RecycledContentShare` | string | Optional | [0, 100] | **[changed in v2.0]** / Recycled Content Share in % / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Water Consumption | `WaterConsumption` | string | Optional | (0, ∞) | **[changed in v2.0]** / Water Consumption in m³/t output / Derived automatically as annual water consumption / annual production when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |

#### KPIs — Leather

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Water Consumption Intensity | `WaterConsumptionIntensity` | string | Optional | (0, ∞) | **[changed in v2.0]** / Water Consumption Intensity in m³/t hide / Derived automatically as annual water consumption / annual raw material consumption when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| Chromium Recovery Rate | `ChromiumRecoveryRate` | string | Optional | [0, 100] | **[changed in v2.0]** / Chromium Recovery Rate in % / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Chemical Oxygen Demand (COD) | `ChemicalOxygenDemandCOD` | string | Optional | (0, ∞) | **[changed in v2.0]** / Chemical Oxygen Demand (COD) in mg/L in effluent / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Solid Waste Generation | `SolidWasteGeneration` | string | Optional | (0, ∞) | **[changed in v2.0]** / Solid Waste Generation in kg/t hide / When MonthlyWasteGenerated is provided and no value is given here, derived automatically as annual waste generated / annual raw material consumption. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. Not assessed if no value is provided and it cannot be derived: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Energy Consumption | `EnergyConsumption` | string | Optional | (0, ∞) | **[changed in v2.0]** / Energy Consumption in GJ/t raw hide / Derived automatically as TotalEnergyConsumption / annual raw material consumption when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| Effluent Sulphide Content | `EffluentSulphideContent` | string | Optional | (0, ∞) | **[changed in v2.0]** / Effluent Sulphide Content in mg/L / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |

#### KPIs — Handicraft

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Energy Intensity | `EnergyIntensity` | string | Optional | (0, ∞) | **[changed in v2.0]** / Energy Intensity in kWh/$1K revenue / From v2.0 this is total energy — electricity and all fuels — expressed in kWh, not electricity alone. / Derived automatically as TotalEnergyConsumption (electricity and all fuels) in kWh / annual production when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| Renewable Energy Share | `RenewableEnergyShare` | string | Optional | [0, 100] | **[changed in v2.0]** / Renewable Energy Share in % / When the Renewable Generation system is submitted and no value is given here, derived automatically as on-site renewable generation / (TotalEnergyConsumption + that generation). Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. Not assessed if no value is provided and it cannot be derived: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Material Waste Rate | `MaterialWasteRate` | string | Optional | [0, 100] | **[changed in v2.0]** / Material Waste Rate in % / When MonthlyWasteGenerated is provided and no value is given here, derived automatically as annual waste generated / annual raw material consumption. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. Not assessed if no value is provided and it cannot be derived: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Water Consumption | `WaterConsumption` | string | Optional | (0, ∞) | **[changed in v2.0]** / Water Consumption in m3/t product / When MonthlyProductionTonnage is provided and no value is given here, derived automatically as annual water consumption / annual production tonnage. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. Not assessed if no value is provided and it cannot be derived: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Chemical Use Intensity | `ChemicalUseIntensity` | string | Optional | (0, ∞) | **[changed in v2.0]** / Chemical Use Intensity in kg/t product / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |

#### KPIs — Hydrocarbons

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Flaring Intensity | `FlaringIntensity` | string | Optional | (0, ∞) | **[changed in v2.0]** / Flaring Intensity in m³ gas flared/boe / When MonthlyGasFlared is provided and no value is given here, derived automatically as annual gas flared / annual production. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. Not assessed if no value is provided and it cannot be derived: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Energy Intensity (Refining) | `EnergyIntensityRefining` | string | Optional | (0, ∞) | **[changed in v2.0]** / Energy Intensity (Refining) in GJ/barrel / Derived automatically as TotalEnergyConsumption / annual production when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| GHG Intensity | `GHGIntensity` | string | Optional | (0, ∞) | **[changed in v2.0]** / GHG Intensity in kg CO₂e/boe / When MonthlyGasFlared and MonthlyMethaneEmissions are both provided and no value is given here, derived automatically as (TotalCarbonEmission + gas flared at 2.6 kg CO₂e/m³ + methane at a global warming potential of 28) / annual production. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. Not assessed if no value is provided and it cannot be derived: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Methane Leak Rate | `MethaneLeakRate` | string | Optional | [0, 100] | **[changed in v2.0]** / Methane Leak Rate in % / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Water Re-injection Rate | `WaterReInjectionRate` | string | Optional | [0, 100] | **[changed in v2.0]** / Water Re-injection Rate in % / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| LNG Boil-off Rate | `LNGBoilOffRate` | string | Optional | (0, ∞) | **[changed in v2.0]** / LNG Boil-off Rate in % per day / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Refinery Complexity Index | `RefineryComplexityIndex` | string | Optional | (0, ∞) | **[changed in v2.0]** / Refinery Complexity Index in Index / From v2.0 reported for information only: it describes the asset or its site rather than how well it is run, so no BenchmarkingResult is given. / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |

#### KPIs — Electricity

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Transmission & Distribution Loss | `TransmissionDistributionLoss` | string | Optional | [0, 100] | **[changed in v2.0]** / Transmission & Distribution Loss in % / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Net Heat Rate (Thermal) | `NetHeatRateThermal` | string | Optional | (0, ∞) | **[changed in v2.0]** / Net Heat Rate (Thermal) in kJ/kWh / Derived automatically as annual thermal energy / annual generation when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| Capacity Factor (Solar PV) | `CapacityFactorSolarPV` | string | Optional | [0, 100] | **[changed in v2.0]** / Capacity Factor (Solar PV) in % / From v2.0 reported for information only: it describes the asset or its site rather than how well it is run, so no BenchmarkingResult is given. / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Capacity Factor (Wind) | `CapacityFactorWind` | string | Optional | [0, 100] | **[changed in v2.0]** / Capacity Factor (Wind) in % / From v2.0 reported for information only: it describes the asset or its site rather than how well it is run, so no BenchmarkingResult is given. / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Renewable Energy Share | `RenewableEnergyShare` | string | Optional | [0, 100] | **[changed in v2.0]** / Renewable Energy Share in % / When the Renewable Generation system is submitted and no value is given here, derived automatically as renewable generation / annual electricity generated. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. Not assessed if no value is provided and it cannot be derived: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Plant Availability Factor | `PlantAvailabilityFactor` | string | Optional | [0, 100] | **[changed in v2.0]** / Plant Availability Factor in % / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| CO₂ Intensity (Grid) | `CO2IntensityGrid` | string | Optional | (0, ∞) | **[changed in v2.0]** / CO₂ Intensity (Grid) in g CO₂/kWh / Derived automatically as TotalCarbonEmission / annual generation when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| SAIDI | `SAIDI` | string | Optional | (0, ∞) | **[changed in v2.0]** / SAIDI in hours/customer/yr / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |

#### KPIs — Construction

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Energy Use Intensity (EUI) | `EnergyUseIntensityEUI` | string | Optional | (0, ∞) | **[changed in v2.0]** / Energy Use Intensity (EUI) in kWh/m²/yr / The operating energy (electricity and all fuels) of the COMPLETED building, from its design energy model or energy certificate. From v2.0 it is not calculated from Consumption, which for Construction is the energy used on construction sites (see SiteEnergyIntensity). / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Site Energy Intensity | `SiteEnergyIntensity` | string | Optional | (0, ∞) | **[new in v2.0]** / Site Energy Intensity in kWh/m² built — total energy (grid electricity and all fuels, mainly generator diesel) used on construction sites per m² of gross floor area built. Construction’s primary energy KPI from v2.0. / Derived automatically as TotalEnergyConsumption (electricity and all fuels) in kWh / annual production when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| Embodied Carbon Intensity | `EmbodiedCarbonIntensity` | string | Optional | (0, ∞) | **[changed in v2.0]** / Embodied Carbon Intensity in kg CO₂e/m² / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Construction Waste Rate | `ConstructionWasteRate` | string | Optional | (0, ∞) | **[changed in v2.0]** / Construction Waste Rate in kg/m² / When MonthlyWasteGenerated is provided and no value is given here, derived automatically as annual waste generated / annual production. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. Not assessed if no value is provided and it cannot be derived: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Water Consumption on Site | `WaterConsumptionOnSite` | string | Optional | (0, ∞) | **[changed in v2.0]** / Water Consumption on Site in m³/m² / Derived automatically as annual water consumption / annual production when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| Concrete Cement Content | `ConcreteCementContent` | string | Optional | (0, ∞) | **[changed in v2.0]** / Concrete Cement Content in kg/m³ concrete / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Recycled Material Share | `RecycledMaterialShare` | string | Optional | [0, 100] | **[changed in v2.0]** / Recycled Material Share in % / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Building Energy Rating | `BuildingEnergyRating` | string | Optional | {“Certified”, “Silver”, “Gold”, “Platinum”, “1 Star”, “2 Star”, “3 Star”, “4 Star”, “5 Star”} | **[changed in v2.0]** / Building Energy Rating (Star / LEED Level) / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |

#### KPIs — Electronics

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Specific Energy Consumption | `SpecificEnergyConsumption` | string | Optional | (0, ∞) | **[changed in v2.0]** / Specific Energy Consumption in kWh/unit / From v2.0 this is total energy — electricity and all fuels — expressed in kWh, not electricity alone. / Derived automatically as TotalEnergyConsumption (electricity and all fuels) in kWh / annual production when not provided. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. |
| Yield Rate | `YieldRate` | string | Optional | [0, 100] | **[changed in v2.0]** / Yield Rate in % / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Soldering Defect Rate | `SolderingDefectRate` | string | Optional | (0, ∞) | **[changed in v2.0]** / Soldering Defect Rate in DPMO / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Hazardous Waste Generation | `HazardousWasteGeneration` | string | Optional | (0, ∞) | **[changed in v2.0]** / Hazardous Waste Generation in kg/t output / When MonthlyWasteGenerated and MonthlyProductionTonnage are both provided and no value is given here, derived automatically as annual waste generated / annual production tonnage. Submit a value only where the facility holds a measured or sub-metered figure of its own — a submitted value always takes precedence. See “<Name>ValueSource” in the Response. Not assessed if no value is provided and it cannot be derived: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| Water Consumption | `WaterConsumption` | string | Optional | (0, ∞) | **[changed in v2.0]** / Water Consumption in L/m² / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| ESD Incident Rate | `ESDIncidentRate` | string | Optional | (0, ∞) | **[changed in v2.0]** / ESD Incident Rate in per million units / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |
| OEE (Overall Equipment Eff.) | `OEEOverallEquipmentEff` | string | Optional | [0, 100] | **[changed in v2.0]** / OEE (Overall Equipment Eff.) in % / Not assessed if no value is provided: the KPI is left out of KPIBenchmarking and named under “KPIsNotAssessed” in the Response. |

### Step 5: System Types

JSON location: `BuildingData.SystemTypes (array)`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| System Types | `SystemTypes` | array | **Yes** | {"Motors", "Compressed Air Systems", "Boilers", "Furnaces", "Ovens", "Air Conditioners (AC Units)", "Air Handling Fans", "Lighting Systems", "Water Heaters", "Chillers", "Cooling Towers", "Computers / Data Centers", "Elevators / Mechanical Equipment", "Clinker Handling / Conveyors", "Pumps", "Renewable Generation (Solar PV/Thermal/Wind)", "Water/Wastewater Treatment", "Construction Site Energy"} | one or more System Types / Note: where a building has multiple pieces of equipment of the same system type (e.g., several motors), provide the aggregate/overall value for that system in the respective system object below- for example, combined rated power and a production-weighted average efficiency - rather than a value for a single unit. |

### Step 6+: System data (one step per selected system) — ALL FIELDS OPTIONAL

Each system chosen in System Types gets a step. The system object is required to exist (may be `{}`), but its fields are optional. JSON location: `BuildingData.<SystemKey>`.

| System Types value | JSON key |
|---|---|
| Motors | `Motors` |
| Compressed Air Systems | `CompressedAirSystems` |
| Boilers | `Boilers` |
| Furnaces | `Furnaces` |
| Ovens | `Ovens` |
| Air Conditioners (AC Units) | `AirConditioners` |
| Air Handling Fans | `AirHandlingFans` |
| Lighting Systems | `LightingSystems` |
| Water Heaters | `WaterHeaters` |
| Chillers | `Chillers` |
| Cooling Towers | `CoolingTowers` |
| Computers / Data Centers | `ComputersDataCenters` |
| Elevators / Mechanical Equipment | `ElevatorsMechanicalEquipment` |
| Clinker Handling / Conveyors | `ClinkerHandlingConveyors` |
| Pumps | `Pumps` |
| Renewable Generation (Solar PV/Thermal/Wind) | `RenewableGeneration` |
| Water/Wastewater Treatment | `WaterWastewaterTreatment` |
| Construction Site Energy | `ConstructionSiteEnergy` |

#### Motors → `Motors`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Rated Power | `RatedPower` | string | Optional | (0, ∞) | Rated Power in kW |
| Motor Efficiency | `MotorEfficiency` | string | Optional | [0, 100] | **[changed in v2.0]** / Motor Efficiency in % / Benchmarked against the IE3 minimum efficiency (IEC 60034-30-1) for the average motor size when NumberOfMotors is provided, and against a flat 90% otherwise. |
| Number of Motors | `NumberOfMotors` | string | Optional | [1, ∞) | **[new in v2.0]** / Number of motors that RatedPower is the total of. Used only to find the average motor size for the MotorEfficiency benchmark. |
| Operating Hours | `OperatingHours` | string | Optional | (0, 8760] | Operating Hours in h/yr |
| Load Factor | `LoadFactor` | string | Optional | [0, 100] | Load Factor in % |
| VFD Availability | `VFDAvailability` | string | Optional | {“Yes”, “No”} | VFD Availability |
| Energy Consumption (Measured) | `EnergyConsumptionMeasured` | string | Optional | (0, ∞) | Energy Consumption (Measured) in kWh/yr |

#### Compressed Air Systems → `CompressedAirSystems`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Rated Capacity | `RatedCapacity` | string | Optional | (0, ∞) | Rated Capacity in m³/min |
| Specific Power Consumption | `SpecificPowerConsumption` | string | Optional | (0, ∞) | Specific Power Consumption in kW/(m³/min) |
| Operating Hours | `OperatingHours` | string | Optional | (0, 8760] | Operating Hours in h/yr |
| Air Leakage Rate | `AirLeakageRate` | string | Optional | [0, 100] | Air Leakage Rate in % |
| VFD Availability | `VFDAvailability` | string | Optional | {“Yes”, “No”} | VFD Availability |
| Energy Consumption (Measured) | `EnergyConsumptionMeasured` | string | Optional | (0, ∞) | Energy Consumption (Measured) in kWh/yr |

#### Boilers → `Boilers`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Rated Capacity | `RatedCapacity` | string | Optional | (0, ∞) | Rated Capacity (see Rated Capacity Unit for the unit used) |
| Rated Capacity Unit | `RatedCapacityUnit` | string | Optional | {“MW”, “ton steam/hr”} | Rated Capacity Unit |
| Thermal Efficiency | `ThermalEfficiency` | string | Optional | [0, 100] | Thermal Efficiency in % |
| Fuel Type | `FuelType` | string | Optional | {“Natural Gas”, “Diesel”, “Coal”, “Biomass”, “LPG”, “Other”} | Fuel Type |
| Fuel Energy Input | `FuelEnergyInput` | string | Optional | (0, ∞) | Fuel Energy Input in GJ/yr (total fuel energy delivered to the boiler, from fuel purchase/metering records) |
| Boiler Loading | `BoilerLoading` | string | Optional | [0, 100] | Boiler Loading in % |
| Operating Hours | `OperatingHours` | string | Optional | (0, 8760] | Operating Hours in h/yr |
| Excess Air Level | `ExcessAirLevel` | string | Optional | [0, 100] | Excess Air Level in % |
| Condensate Recovery | `CondensateRecovery` | string | Optional | [0, 100] | Condensate Recovery in % |
| Energy Consumption (Measured) | `EnergyConsumptionMeasured` | string | Optional | (0, ∞) | Energy Consumption (Measured) in GJ/yr |

#### Furnaces → `Furnaces`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Rated Capacity | `RatedCapacity` | string | Optional | (0, ∞) | Rated Capacity in MW |
| Load Factor | `LoadFactor` | string | Optional | [0, 100] | Load Factor in % |
| Operating Hours | `OperatingHours` | string | Optional | (0, 8760] | Operating Hours in h/yr |
| Thermal Efficiency | `ThermalEfficiency` | string | Optional | [0, 100] | Thermal Efficiency in % |
| Excess Air Ratio | `ExcessAirRatio` | string | Optional | (1, ∞) | Excess Air Ratio in ratio |
| Flue Gas Losses | `FlueGasLosses` | string | Optional | [0, 100] | Flue Gas Losses in % of energy input |
| Insulation Surface Temperature | `InsulationSurfaceTemperature` | string | Optional | (0, ∞) | Insulation Surface Temperature in °C (measured shell/casing temperature; higher values indicate degraded insulation) |
| Energy Consumption (Measured) | `EnergyConsumptionMeasured` | string | Optional | (0, ∞) | Energy Consumption (Measured) in kWh/yr |

#### Ovens → `Ovens`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Energy Consumption (Measured) | `EnergyConsumptionMeasured` | string | Optional | (0, ∞) | Energy Consumption (Measured) in kWh/yr |
| Rated Capacity | `RatedCapacity` | string | Optional | (0, ∞) | Rated Capacity in MW |
| Load Factor | `LoadFactor` | string | Optional | [0, 100] | Load Factor in % |
| Operating Hours | `OperatingHours` | string | Optional | (0, 8760] | Operating Hours in h/yr |
| Thermal Efficiency | `ThermalEfficiency` | string | Optional | [0, 100] | Thermal Efficiency in % |
| Heat Losses through Walls/Openings | `HeatLossesThroughWallsOpenings` | string | Optional | [0, 100] | Heat Losses through Walls/Openings in % of input energy |

#### Air Conditioners (AC Units) → `AirConditioners`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Cooling Capacity | `CoolingCapacity` | string | Optional | (0, ∞) | Cooling Capacity (see Cooling Capacity Unit for the unit used) |
| Cooling Capacity Unit | `CoolingCapacityUnit` | string | Optional | {“TR”, “kW”} | Cooling Capacity Unit |
| Efficiency Value | `EfficiencyValue` | string | Optional | (0, ∞) | Efficiency Value (see Efficiency Metric Type for which metric this is) |
| Efficiency Metric Type | `EfficiencyMetricType` | string | Optional | {“COP”, “EER”, “SEER”} | Efficiency Metric Type |
| Operating Hours | `OperatingHours` | string | Optional | (0, 8760] | Operating Hours in h/yr |
| Months Since Last Service | `MonthsSinceLastService` | string | Optional | [0, ∞) | Months Since Last Service |
| Control System | `ControlSystem` | string | Optional | {“Manual”, “Programmable Thermostat”, “BMS”, “None”} | Control System |
| Energy Consumption (Measured) | `EnergyConsumptionMeasured` | string | Optional | (0, ∞) | Energy Consumption (Measured) in kWh/yr |

#### Air Handling Fans → `AirHandlingFans`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Fan Power | `FanPower` | string | Optional | (0, ∞) | Fan Power in kW |
| Fan Efficiency | `FanEfficiency` | string | Optional | [0, 100] | Fan Efficiency in % |
| Operating Hours | `OperatingHours` | string | Optional | (0, 8760] | Operating Hours in h/yr |
| Variable Speed Control Availability | `VariableSpeedControlAvailability` | string | Optional | {“Yes”, “No”} | Variable Speed Control Availability |
| Air Leakage in Ducts | `AirLeakageInDucts` | string | Optional | [0, 100] | Air Leakage in Ducts in % of airflow |
| Energy Consumption (Measured) | `EnergyConsumptionMeasured` | string | Optional | (0, ∞) | Energy Consumption (Measured) in kWh/yr |

#### Lighting Systems → `LightingSystems`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Lighting Power Density | `LightingPowerDensity` | string | Optional | (0, ∞) | Lighting Power Density in W/m² |
| Operating Hours | `OperatingHours` | string | Optional | (0, 8760] | Operating Hours in h/yr |
| Control Systems | `ControlSystems` | string | Optional | {“None”, “Timers”, “Occupancy Sensors”, “Daylight Harvesting”, “Combination”} | Control Systems |
| Energy Consumption (Measured) | `EnergyConsumptionMeasured` | string | Optional | (0, ∞) | Energy Consumption (Measured) in kWh/yr |

#### Water Heaters → `WaterHeaters`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Rated Capacity | `RatedCapacity` | string | Optional | (0, ∞) | Rated Capacity in kW |
| Heating Efficiency | `HeatingEfficiency` | string | Optional | [0, 100] | Heating Efficiency in % |
| Standby Heat Loss Rate | `StandbyHeatLossRate` | string | Optional | [0, 100] | Standby Heat Loss Rate in % of stored energy per day |
| Scale Buildup Condition | `ScaleBuildupCondition` | string | Optional | {“None”, “Light”, “Moderate”, “Heavy”} | Scale Buildup Condition |
| Operating Hours | `OperatingHours` | string | Optional | (0, 8760] | Operating Hours in h/yr |
| Energy Consumption (Measured) | `EnergyConsumptionMeasured` | string | Optional | (0, ∞) | Energy Consumption (Measured) in kWh/yr |

#### Chillers → `Chillers`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Cooling Capacity | `CoolingCapacity` | string | Optional | (0, ∞) | Cooling Capacity in TR |
| kW/TR Ratio | `KWTRRatio` | string | Optional | (0, ∞) | kW/TR Ratio in kW/TR |
| Operating Hours | `OperatingHours` | string | Optional | (0, 8760] | Operating Hours in h/yr |
| Condenser Condition | `CondenserCondition` | string | Optional | {“Clean”, “Fouled”, “Poor”} | Condenser Condition |
| Chilled Water Temperature Difference | `ChilledWaterTemperatureDifference` | string | Optional | (0, ∞) | Chilled Water Temperature Difference in °C |
| Energy Consumption (Measured) | `EnergyConsumptionMeasured` | string | Optional | (0, ∞) | Energy Consumption (Measured) in kWh/yr |

#### Cooling Towers → `CoolingTowers`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Heat Rejection Capacity | `HeatRejectionCapacity` | string | Optional | (0, ∞) | Heat Rejection Capacity (see Heat Rejection Capacity Unit for the unit used) |
| Heat Rejection Capacity Unit | `HeatRejectionCapacityUnit` | string | Optional | {“kW”, “TR”} | Heat Rejection Capacity Unit |
| Fan Motor Efficiency | `FanMotorEfficiency` | string | Optional | [0, 100] | Fan Motor Efficiency in % |
| Operating Hours | `OperatingHours` | string | Optional | (0, 8760] | Operating Hours in h/yr |
| Approach Temperature | `ApproachTemperature` | string | Optional | (0, ∞) | Approach Temperature in °C |
| VFD Availability | `VFDAvailability` | string | Optional | {“Yes”, “No”} | VFD Availability |
| Cycles of Concentration | `CyclesOfConcentration` | string | Optional | (1, ∞) | Cycles of Concentration (ratio of dissolved solids in circulating water to make-up water) |
| Energy Consumption (Measured) | `EnergyConsumptionMeasured` | string | Optional | (0, ∞) | Energy Consumption (Measured) in kWh/yr |

#### Computers / Data Centers → `ComputersDataCenters`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| IT Equipment Load | `ITEquipmentLoad` | string | Optional | (0, ∞) | IT Equipment Load in kW |
| Power Usage Effectiveness | `PowerUsageEffectiveness` | string | Optional | [1, ∞) | Power Usage Effectiveness in PUE |
| Server Utilization | `ServerUtilization` | string | Optional | [0, 100] | Server Utilization in % |
| UPS Efficiency | `UPSEfficiency` | string | Optional | [0, 100] | UPS Efficiency in % |
| Hot/Cold Aisle Management | `HotColdAisleManagement` | string | Optional | {“Yes”, “No”, “Partial”} | Hot/Cold Aisle Management |
| Energy Consumption (Measured) | `EnergyConsumptionMeasured` | string | Optional | (0, ∞) | Energy Consumption (Measured) in kWh/yr |

#### Elevators / Mechanical Equipment → `ElevatorsMechanicalEquipment`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Motor Efficiency | `MotorEfficiency` | string | Optional | [0, 100] | Motor Efficiency in % |
| Drive Technology | `DriveTechnology` | string | Optional | {“Geared”, “Hydraulic”, “Gearless”, “VFD-driven”} | Drive Technology |
| Regenerative Braking Availability | `RegenerativeBrakingAvailability` | string | Optional | {“Yes”, “No”} | Regenerative Braking Availability |
| Operating Cycles per Day | `OperatingCyclesPerDay` | string | Optional | (0, ∞) | Operating Cycles per Day in cycles/day |
| Energy Consumption per Cycle | `EnergyConsumptionPerCycle` | string | Optional | (0, ∞) | Energy Consumption per Cycle in kWh/cycle |
| Energy Consumption (Measured) | `EnergyConsumptionMeasured` | string | Optional | (0, ∞) | Energy Consumption (Measured) in kWh/yr |

#### Clinker Handling / Conveyors → `ClinkerHandlingConveyors`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Motor Power Rating | `MotorPowerRating` | string | Optional | (0, ∞) | Motor Power Rating in kW |
| Motor Efficiency Class | `MotorEfficiencyClass` | string | Optional | {“IE1”, “IE2”, “IE3”, “IE4”} | **[changed in v2.0]** / Motor Efficiency Class / Benchmarked against IE4 where MotorPowerRating is 75–200 kW, and IE3 otherwise (Regulation (EU) 2019/1781). |
| Loading Factor | `LoadingFactor` | string | Optional | [0, 100] | Loading Factor in % |
| Operating Hours | `OperatingHours` | string | Optional | (0, 8760] | Operating Hours in h/yr |
| Variable Speed Drive Availability | `VariableSpeedDriveAvailability` | string | Optional | {“Yes”, “No”} | Variable Speed Drive Availability |
| Idle Running Time | `IdleRunningTime` | string | Optional | [0, 100] | Idle Running Time in % of operating time |
| Energy Consumption (Measured) | `EnergyConsumptionMeasured` | string | Optional | (0, ∞) | Energy Consumption (Measured) in kWh/yr |

#### Pumps → `Pumps`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Rated Power | `RatedPower` | string | Optional | (0, ∞) | Rated Power in kW |
| Pump Efficiency | `PumpEfficiency` | string | Optional | [0, 100] | Pump Efficiency in % |
| Operating Hours | `OperatingHours` | string | Optional | (0, 8760] | Operating Hours in h/yr |
| Flow Control Method | `FlowControlMethod` | string | Optional | {“Throttling Valve”, “VFD”, “On-Off Control”, “Bypass/Recirculation”, “None”} | Flow Control Method |
| Load Factor | `LoadFactor` | string | Optional | [0, 100] | Load Factor in % |
| Energy Consumption (Measured) | `EnergyConsumptionMeasured` | string | Optional | (0, ∞) | Energy Consumption (Measured) in kWh/yr |

#### Renewable Generation (Solar PV/Thermal/Wind) → `RenewableGeneration`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Generation Type | `GenerationType` | string | Optional | {“Solar PV”, “Solar Thermal”, “Wind”, “Other”} | Generation Type |
| Installed Capacity | `InstalledCapacity` | string | Optional | (0, ∞) | Installed Capacity in kWp (Solar PV/Wind) or kWth (Solar Thermal) |
| Performance Ratio | `PerformanceRatio` | string | Optional | [0, 100] | Performance Ratio in % (actual output as a share of theoretical output; captures soiling, shading, degradation, and blade/panel wear) |
| Annual Generation (Measured) | `AnnualGenerationMeasured` | string | Optional | (0, ∞) | Annual Generation (Measured) in kWh/yr (Solar PV/Wind) or GJ/yr (Solar Thermal) |

#### Water/Wastewater Treatment → `WaterWastewaterTreatment`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Treatment Capacity | `TreatmentCapacity` | string | Optional | (0, ∞) | Treatment Capacity in m³/day |
| Annual Volume Treated | `AnnualVolumeTreated` | string | Optional | (0, ∞) | Annual Volume Treated in m³/yr |
| Specific Energy Consumption | `SpecificEnergyConsumption` | string | Optional | (0, ∞) | Specific Energy Consumption in kWh/m³ treated |
| Aeration System Type | `AerationSystemType` | string | Optional | {“Diffused Aeration”, “Mechanical Surface Aerator”, “None/Not Applicable”} | Aeration System Type |
| Aeration Control | `AerationControl` | string | Optional | {“Fixed Speed”, “DO-based Automatic Control (VFD)”, “None/Not Applicable”} | Aeration Control |
| Operating Hours | `OperatingHours` | string | Optional | (0, 8760] | Operating Hours in h/yr |
| Energy Consumption (Measured) | `EnergyConsumptionMeasured` | string | Optional | (0, ∞) | Energy Consumption (Measured) in kWh/yr |

#### Construction Site Energy → `ConstructionSiteEnergy`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Diesel Consumption Intensity | `DieselConsumptionIntensity` | string | Optional | (0, ∞) | Diesel Consumption Intensity in L/m² GFA |
| Grid Electricity Consumption Intensity | `GridElectricityConsumptionIntensity` | string | Optional | (0, ∞) | Grid Electricity Consumption Intensity in kWh/m² GFA |
| Renewable Energy Share of Total Energy | `RenewableEnergyShareOfTotalEnergy` | string | Optional | [0, 100] | Renewable Energy Share of Total Energy Consumption in % |
| Generator Load Factor | `GeneratorLoadFactor` | string | Optional | [0, 100] | Average Diesel Generator Load Factor in % |


## Rules and conditional logic

- `ProjectCountry` must be `"Egypt"`; `BuildingType` must be `"Industrial Facility"`; `ProjectStatus` is `"Existing Building"` (fixed, not editable).
- `SystemTypes` must contain one or more of the 18 listed values. For every selected value, include the matching system object (it may be empty `{}`); do not send objects for unselected systems.
- **Multiple units of the same system:** provide one aggregate value per system (e.g. combined rated power and a production-weighted average efficiency), never a value for a single unit (spec note on `SystemTypes`). Show this as helper text in every system step.
- **Electricity industry:** represent the generation / steam-cycle train with the "Boilers" system (e.g. HRSG or steam generation) (spec note on `IndustryType`).
- **Consumption:** all 13 fields are required. Send `"0"` for any fuel not used (the spec examples do). Units differ per fuel (m³ for gas/diesel/petrol/HFO/LFO, ton for coal/LPG/LNG, GJ for "other"); `OtherEnergyEF` is the emission factor of the "other" energy in t CO₂e/GJ.
- **Units differ per system:** `EnergyConsumptionMeasured` is kWh/yr for every system **except Boilers (GJ/yr)**; Renewable Generation uses `AnnualGenerationMeasured` in kWh/yr (Solar PV / Wind) or GJ/yr (Solar Thermal). Always show the unit from each system's table.

### Industry-dependent inputs
| IndustryType | Extra input in Building Information |
|---|---|
| Chemicals | `ChemicalProductType` — required ("Ethylene", "Methanol") |
| Iron & Steel | `SteelProductionRoute` — required ("DRI-EAF", "Scrap-EAF") **(new in v2.0)** |
| Electricity | `GenerationTechnology` — required (4 thermal technologies) **(new in v2.0)** |
| Textiles | `FabricType` — required ("Knitted", "Woven") **(new in v2.0)** |
| Printing & Packaging | `PrintingMethod` — required (9 methods) **(new in v2.0)** |
| Food | `FoodSubSector` — required (16 values incl. "Other") **(new in v2.0)** |
| Cement | `MonthlyClinkerProduction` — required **unless** `ClinkerRatio` is submitted in Facility KPIs **(new in v2.0)** |
| Fertilizers | `MonthlyAmmoniaProduction` — required **(new in v2.0)** |
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

### Optional production quantities (new in v2.0) and what they unlock
| Field | Industry | Effect |
|---|---|---|
| `MonthlyGasFlared` | Hydrocarbons | Derives `FlaringIntensity`; with `MonthlyMethaneEmissions` also derives `GHGIntensity`. Enter `0` when nothing is flared — blank means "not reported". |
| `MonthlyMethaneEmissions` | Hydrocarbons | See above. Enter `0` for none. |
| `MonthlyWasteGenerated` | Leather, Construction, Handicraft, Pharmaceuticals, Electronics | Derives that industry's waste KPI. |
| `MonthlyProductionTonnage` | Pharmaceuticals, Handicraft, Engineering, Electronics | Derives per-tonne KPIs (needed because their `MonthlyProduction` is in pieces / revenue). |
| `MonthlyRawMaterialConsumption` | all (required in Consumption) | Leather: tonnes of raw hide. Food sub-sectors benchmarked per tonne of raw material (dairy, meat, starch, sugar beet): tonnes processed. Denominator of derived KPIs. |

### Facility KPIs are optional (v2.0)
- The whole `FacilityKPIs` object may be `{}`. Every KPI the engine can compute from Consumption / MonthlyProduction / GFA / the optional quantities / submitted systems is **derived automatically** (`…ValueSource` = "Derived").
- A submitted KPI always wins (`…ValueSource` = "Submitted"). Only ask for a value when the facility has a measured or sub-metered figure.
- A KPI that is neither submitted nor derivable is left out of `KPIBenchmarking` and listed in `KPIsNotAssessed` — treat as **unknown**, not satisfactory.
- Information-only KPIs (no verdict, `…BenchmarkingResult` is `null`): `RefineryComplexityIndex`, `CapacityFactorSolarPV`, `CapacityFactorWind`.
- **Retired:** Fertilizers `ElectricityIntensity` is ignored if sent — do not show it.
- **Removed/renamed:** Iron & Steel `SpecificEnergyConsumptionEAFRoute` and `SpecificEnergyConsumptionDRIEAFRoute` are replaced by `SpecificEnergyConsumption` (route chosen via `SteelProductionRoute`).
- **Unit / meaning changes:** Furniture SEC kWh/m³ → GJ/t product; Printing & Packaging `VOCEmissions` g/m² → kg VOC/t paper; Leather `EnergyConsumption` GJ/t finished leather → GJ/t raw hide; Engineering, Printing & Packaging, Handicraft and Electronics SEC/EnergyIntensity is now **total energy in kWh** (not electricity only); Construction `EnergyUseIntensityEUI` is the completed building's operating energy (from its design model/certificate), no longer calculated from Consumption (use `SiteEnergyIntensity` for site energy).

### Cross-system derivations (submitted system data feeds KPIs)
- Compressed Air Systems `SpecificPowerConsumption` ÷ 60 → `CompressedAirSpecificEnergy` (Chemicals) / `CompressedAirEfficiency` (Engineering) when the KPI is blank.
- Boilers `ThermalEfficiency` → `BoilerEfficiency` (Textiles, Food).
- Renewable Generation → `RenewableEnergyShare` (Food, Handicraft, Electricity).
- Motors: `MotorEfficiency` is benchmarked against the IE3 minimum for the average motor size when `NumberOfMotors` is given (`RatedPower` = total of all motors), else a flat 90 %. `MotorEfficiencyClass` (conveyors) is benchmarked against IE4 for `MotorPowerRating` 75–200 kW, else IE3.

### Response handling
- Total energy GJ/yr, carbon t CO₂e/yr, SEC vs BAT, `CoreIndicators`, `KPIBenchmarking` (with `ValueSource`), `KPIsNotAssessed`, `SystemPerformanceBenchmarking`, `EnergyAnalysisAndRecommendation`, water and raw-material analysis (`RawMaterialAnalysisAndRecommendation` may be `null`).
- `EnergyEstimateBasis` per system: "Measured" (from `EnergyConsumptionMeasured` / `AnnualGenerationMeasured`), "Calculated", "Industry default", or "Not estimated" (energy and savings `null`).
- Renewable Generation `EnergyConsumption` is **negative** (annual generation offset); it and Construction Site Energy are excluded from `TotalEnergySavings`.

