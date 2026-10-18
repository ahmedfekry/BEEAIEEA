import { getPath, type FieldDef, type FlowSchema, type Range, type StepDef, type Values } from "./engine";
import { projectFields } from "./beea";

/** IEEA schemas (spec sections 2.2.4 and 2.2.5). */

const BI = "BuildingData.BuildingInfo";
const CONS = `${BI}.Consumption`;
const KPI = `${BI}.FacilityKPIs`;
const SYSTEM_TYPES_PATH = "BuildingData.SystemTypes";

export const INDUSTRIES = [
  "Cement",
  "Iron & Steel",
  "Fertilizers",
  "Chemicals",
  "Textiles",
  "Food",
  "Pharmaceuticals",
  "Engineering",
  "Automotive",
  "Furniture",
  "Printing & Packaging",
  "Leather",
  "Handicraft",
  "Hydrocarbons",
  "Electricity",
  "Construction",
  "Electronics",
] as const;
export type Industry = (typeof INDUSTRIES)[number];

export const PRODUCTION_UNIT: Record<Industry, string> = {
  Cement: "ton",
  "Iron & Steel": "ton",
  Chemicals: "ton",
  Fertilizers: "ton",
  Textiles: "ton",
  Food: "ton",
  "Printing & Packaging": "ton",
  Leather: "ton",
  Engineering: "piece",
  Automotive: "piece",
  Furniture: "piece",
  Electronics: "piece",
  Pharmaceuticals: "US$1000 revenue",
  Handicraft: "US$1000 revenue",
  Hydrocarbons: "boe",
  Electricity: "kWh",
  Construction: "m²",
};

export const FUEL_TYPES = ["Natural Gas", "Coal", "Diesel", "Petrol", "LPG", "LNG", "HFO", "LFO", "Electricity"] as const;

/** System type label (sent in SystemTypes) -> variable name of its object. */
export const SYSTEM_TYPES = {
  Motors: "Motors",
  "Compressed Air Systems": "CompressedAirSystems",
  Boilers: "Boilers",
  Furnaces: "Furnaces",
  Ovens: "Ovens",
  "Air Conditioners (AC Units)": "AirConditioners",
  "Air Handling Fans": "AirHandlingFans",
  "Lighting Systems": "LightingSystems",
  "Water Heaters": "WaterHeaters",
  Chillers: "Chillers",
  "Cooling Towers": "CoolingTowers",
  "Computers / Data Centers": "ComputersDataCenters",
  "Elevators / Mechanical Equipment": "ElevatorsMechanicalEquipment",
  "Clinker Handling / Conveyors": "ClinkerHandlingConveyors",
  Pumps: "Pumps",
  "Renewable Generation (Solar PV/Thermal/Wind)": "RenewableGeneration",
  "Water/Wastewater Treatment": "WaterWastewaterTreatment",
  "Construction Site Energy": "ConstructionSiteEnergy",
} as const;
export type SystemLabel = keyof typeof SYSTEM_TYPES;
export const SYSTEM_LABELS = Object.keys(SYSTEM_TYPES) as SystemLabel[];

/** Reverse lookup used by the results screen and the PDF. */
export const SYSTEM_DISPLAY_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(SYSTEM_TYPES).map(([label, key]) => [key, label])
);

// Range shorthands matching the spec notation.
const POS: Range = { min: 0, minExclusive: true }; // (0, ∞)
const NONNEG: Range = { min: 0 }; // [0, ∞)
const PCT: Range = { min: 0, max: 100 }; // [0, 100]
const HOURS: Range = { min: 0, max: 8760, minExclusive: true }; // (0, 8760]
const GT1: Range = { min: 1, minExclusive: true }; // (1, ∞)

const industry = (v: Values) => getPath(v, `${BI}.IndustryType`) as string;
const selectedSystems = (v: Values) => (getPath(v, SYSTEM_TYPES_PATH) as string[] | undefined) ?? [];

// ---------------------------------------------------------------------------
// Facility KPIs per industry: [variable name, label, unit, range, sample]

type KpiRow = [string, string, string | undefined, Range, string];

export const INDUSTRY_KPIS: Record<Industry, KpiRow[]> = {
  Cement: [
    ["SpecificThermalEnergyConsumption", "Specific thermal energy consumption", "GJ/t clinker", POS, "3.6"],
    ["SpecificElectricalEnergyConsumption", "Specific electrical energy consumption", "kWh/t cement", POS, "95"],
    ["CO2Intensity", "CO₂ intensity", "kg CO₂/t cement", POS, "540"],
    ["ClinkerRatio", "Clinker ratio", undefined, { min: 0, max: 1, minExclusive: true }, "0.68"],
    ["AlternativeFuelRate", "Alternative fuel rate", "%", PCT, "22"],
  ],
  "Iron & Steel": [
    ["SpecificEnergyConsumptionEAFRoute", "Specific energy consumption (EAF route)", "GJ/t crude steel", POS, "2.6"],
    ["EAFElectricityIntensity", "EAF electricity intensity", "kWh/t crude steel", POS, "450"],
    ["SpecificEnergyConsumptionDRIEAFRoute", "Specific energy consumption (DRI–EAF route)", "GJ/t crude steel", POS, "18"],
    ["MotorSystemEfficiency", "Motor system efficiency", "%", PCT, "85"],
    ["CO2Intensity", "CO₂ intensity", "t CO₂/t steel", POS, "1.1"],
    ["ScrapRecoveryRate", "Scrap recovery rate", "%", PCT, "90"],
  ],
  Chemicals: [
    ["SpecificEnergyConsumption", "Specific energy consumption", "GJ/ton product", POS, "12"],
    ["MotorSystemEfficiency", "Motor system efficiency", "%", PCT, "85"],
    ["CompressedAirSpecificEnergy", "Compressed air specific energy", "kWh/m³ compressed air", POS, "0.13"],
    ["SteamSystemEfficiency", "Steam system efficiency", "%", PCT, "75"],
    ["ProcessHeatRecoveryRate", "Process heat recovery rate", "%", PCT, "40"],
  ],
  Fertilizers: [
    ["AmmoniaEnergyIntensity", "Ammonia energy intensity", "GJ/t NH₃", POS, "32"],
    ["NaturalGasConsumptionIntensity", "Natural gas consumption intensity", "Nm³/t NH₃", POS, "900"],
    ["SteamConsumption", "Steam consumption", "GJ/t product", POS, "3"],
    ["CO2CaptureRate", "CO₂ capture rate", "%", PCT, "30"],
    ["ElectricityIntensity", "Electricity intensity", "kWh/t NH₃", POS, "120"],
  ],
  Textiles: [
    ["SteamConsumption", "Steam consumption", "GJ/t fabric", POS, "25"],
    ["ElectricityIntensity", "Electricity intensity", "kWh/t fabric", POS, "3000"],
    ["BoilerEfficiency", "Boiler efficiency", "%", PCT, "80"],
    ["WaterConsumption", "Water consumption", "m³/t fabric", POS, "150"],
    ["DyebathHeatRecoveryRate", "Dyebath heat recovery rate", "%", PCT, "20"],
  ],
  Food: [
    ["ThermalEnergyIntensity", "Thermal energy intensity", "GJ/t product", POS, "2.5"],
    ["ElectricityIntensity", "Electricity intensity", "kWh/t product", POS, "250"],
    ["RefrigerationCOP", "Refrigeration COP", "COP", POS, "3"],
    ["BoilerEfficiency", "Boiler efficiency", "%", PCT, "82"],
    ["RenewableEnergyShare", "Renewable energy share", "%", PCT, "5"],
  ],
  Pharmaceuticals: [
    ["EnergyIntensity", "Energy intensity", "GJ/$M revenue", POS, "900"],
    ["ElectricityConsumption", "Electricity consumption", "kWh/m²/yr", POS, "450"],
    ["WaterConsumptionIntensity", "Water consumption intensity", "m³/t product", POS, "80"],
    ["CO2Intensity", "CO₂ intensity", "kg CO₂/$M revenue", POS, "60000"],
    ["WasteGenerationRate", "Waste generation rate", "kg waste/t product", POS, "200"],
    ["SolventRecoveryRate", "Solvent recovery rate", "%", PCT, "60"],
  ],
  Engineering: [
    ["SpecificEnergyConsumption", "Specific energy consumption", "kWh/unit", POS, "40"],
    ["MotorSystemEfficiency", "Motor system efficiency", "%", PCT, "85"],
    ["CompressedAirEfficiency", "Compressed air efficiency", "kWh/m³", POS, "0.13"],
    ["MaterialUtilisationRate", "Material utilisation rate", "%", PCT, "85"],
    ["DefectRatePPM", "Defect rate", "PPM", POS, "500"],
    ["CO2Intensity", "CO₂ intensity", "kg CO₂/t product", POS, "800"],
  ],
  Automotive: [
    ["SpecificEnergyConsumption", "Specific energy consumption", "GJ/vehicle", POS, "5.5"],
    ["PaintShopEnergyIntensity", "Paint shop energy intensity", "kWh/vehicle", POS, "290"],
    ["WaterConsumption", "Water consumption", "m³/vehicle", POS, "6.5"],
    ["CO2Intensity", "CO₂ intensity", "t CO₂/vehicle", POS, "0.75"],
    ["ScrapRecoveryRate", "Scrap recovery rate", "%", PCT, "91"],
    ["RobotUtilisationRate", "Robot utilisation rate", "%", PCT, "75"],
    ["TyreRollingResistance", "Tyre rolling resistance", "N/kN", POS, "8.2"],
  ],
  Furniture: [
    ["WoodMaterialYield", "Wood material yield", "%", PCT, "60"],
    ["SpecificEnergyConsumption", "Specific energy consumption", "kWh/m³", POS, "300"],
    ["VOCEmissionsRate", "VOC emissions rate", "g VOC/m² surface", POS, "60"],
    ["DustExtractionEfficiency", "Dust extraction efficiency", "%", PCT, "90"],
    ["WaterBasedCoatingsShare", "Water-based coatings share", "%", PCT, "30"],
    ["WasteWoodRecoveryRate", "Waste wood recovery rate", "%", PCT, "50"],
  ],
  "Printing & Packaging": [
    ["SpecificEnergyConsumption", "Specific energy consumption", "kWh/t output", POS, "800"],
    ["InkChemicalWasteRate", "Ink & chemical waste rate", "kg/t product", POS, "15"],
    ["PaperMaterialWasteRate", "Paper/material waste rate", "%", PCT, "8"],
    ["VOCEmissions", "VOC emissions", "g VOC/m² printed", POS, "2"],
    ["RecycledContentShare", "Recycled content share", "%", PCT, "40"],
    ["WaterConsumption", "Water consumption", "m³/t output", POS, "10"],
  ],
  Leather: [
    ["WaterConsumptionIntensity", "Water consumption intensity", "m³/t hide", POS, "40"],
    ["ChromiumRecoveryRate", "Chromium recovery rate", "%", PCT, "60"],
    ["ChemicalOxygenDemandCOD", "Chemical oxygen demand (COD)", "mg/L in effluent", POS, "3000"],
    ["SolidWasteGeneration", "Solid waste generation", "kg/t hide", POS, "600"],
    ["EnergyConsumption", "Energy consumption", "GJ/t finished leather", POS, "20"],
    ["EffluentSulphideContent", "Effluent sulphide content", "mg/L", POS, "5"],
  ],
  Handicraft: [
    ["EnergyIntensity", "Energy intensity", "kWh/$1K revenue", POS, "150"],
    ["RenewableEnergyShare", "Renewable energy share", "%", PCT, "5"],
    ["MaterialWasteRate", "Material waste rate", "%", PCT, "15"],
    ["WaterConsumption", "Water consumption", "m³/t product", POS, "20"],
    ["ChemicalUseIntensity", "Chemical use intensity", "kg/t product", POS, "30"],
  ],
  Hydrocarbons: [
    ["FlaringIntensity", "Flaring intensity", "m³ gas flared/boe", POS, "3"],
    ["EnergyIntensityRefining", "Energy intensity (refining)", "GJ/barrel", POS, "0.6"],
    ["GHGIntensity", "GHG intensity", "kg CO₂e/boe", POS, "20"],
    ["MethaneLeakRate", "Methane leak rate", "%", PCT, "0.5"],
    ["WaterReInjectionRate", "Water re-injection rate", "%", PCT, "70"],
    ["LNGBoilOffRate", "LNG boil-off rate", "% per day", POS, "0.1"],
    ["RefineryComplexityIndex", "Refinery complexity index", "Index", POS, "8"],
  ],
  Electricity: [
    ["TransmissionDistributionLoss", "Transmission & distribution loss", "%", PCT, "15"],
    ["NetHeatRateThermal", "Net heat rate (thermal)", "kJ/kWh", POS, "9500"],
    ["CapacityFactorSolarPV", "Capacity factor (solar PV)", "%", PCT, "22"],
    ["CapacityFactorWind", "Capacity factor (wind)", "%", PCT, "35"],
    ["RenewableEnergyShare", "Renewable energy share", "%", PCT, "12"],
    ["PlantAvailabilityFactor", "Plant availability factor", "%", PCT, "88"],
    ["CO2IntensityGrid", "CO₂ intensity (grid)", "g CO₂/kWh", POS, "450"],
    ["SAIDI", "SAIDI", "hours/customer/yr", POS, "8"],
  ],
  Construction: [
    ["EnergyUseIntensityEUI", "Energy use intensity (EUI)", "kWh/m²/yr", POS, "180"],
    ["EmbodiedCarbonIntensity", "Embodied carbon intensity", "kg CO₂e/m²", POS, "600"],
    ["ConstructionWasteRate", "Construction waste rate", "kg/m²", POS, "40"],
    ["WaterConsumptionOnSite", "Water consumption on site", "m³/m²", POS, "0.5"],
    ["ConcreteCementContent", "Concrete cement content", "kg/m³ concrete", POS, "350"],
    ["RecycledMaterialShare", "Recycled material share", "%", PCT, "10"],
  ],
  Electronics: [
    ["SpecificEnergyConsumption", "Specific energy consumption", "kWh/unit", POS, "2"],
    ["YieldRate", "Yield rate", "%", PCT, "95"],
    ["SolderingDefectRate", "Soldering defect rate", "DPMO", POS, "50"],
    ["HazardousWasteGeneration", "Hazardous waste generation", "kg/t output", POS, "20"],
    ["WaterConsumption", "Water consumption", "L/m²", POS, "10"],
    ["ESDIncidentRate", "ESD incident rate", "per million units", POS, "5"],
    ["OEEOverallEquipmentEff", "OEE (overall equipment effectiveness)", "%", PCT, "70"],
  ],
};

export const BUILDING_ENERGY_RATINGS = ["Certified", "Silver", "Gold", "Platinum", "1 Star", "2 Star", "3 Star", "4 Star", "5 Star"];

/** Unit lookup for a KPI name in a given industry (used by results + PDF). */
export function kpiMeta(ind: string, name: string) {
  const row = INDUSTRY_KPIS[ind as Industry]?.find((r) => r[0] === name);
  if (name === "BuildingEnergyRating") return { label: "Building energy rating", unit: undefined };
  return row ? { label: row[1], unit: row[2] } : undefined;
}

function kpiFields(): FieldDef[] {
  const fields: FieldDef[] = [];
  for (const ind of INDUSTRIES) {
    for (const [name, label, unit, range, sample] of INDUSTRY_KPIS[ind]) {
      fields.push({
        name: `${KPI}.${name}`,
        label,
        type: "number",
        unit,
        range,
        required: true,
        sample,
        visibleWhen: (v) => industry(v) === ind,
      });
    }
  }
  fields.push({
    name: `${KPI}.BuildingEnergyRating`,
    label: "Building energy rating (Star / LEED level)",
    type: "select",
    options: BUILDING_ENERGY_RATINGS,
    required: true,
    sample: "Gold",
    visibleWhen: (v) => industry(v) === "Construction",
  });
  return fields;
}

// ---------------------------------------------------------------------------
// System objects (all fields optional): [name, label, unit, range | options, sample]

type SysRow = [string, string, string | undefined, Range | readonly string[], string];

const YN = ["Yes", "No"] as const;
const measured = (sample: string): SysRow => ["EnergyConsumptionMeasured", "Energy consumption (measured)", "kWh/yr", POS, sample];

export const SYSTEM_FIELDS: Record<string, SysRow[]> = {
  Motors: [
    ["RatedPower", "Rated power", "kW", POS, "750"],
    ["MotorEfficiency", "Motor efficiency", "%", PCT, "88"],
    ["OperatingHours", "Operating hours", "h/yr", HOURS, "7200"],
    ["LoadFactor", "Load factor", "%", PCT, "65"],
    ["VFDAvailability", "VFD availability", undefined, YN, "No"],
    measured("3985000"),
  ],
  CompressedAirSystems: [
    ["RatedCapacity", "Rated capacity", "m³/min", POS, "40"],
    ["SpecificPowerConsumption", "Specific power consumption", "kW/(m³/min)", POS, "7"],
    ["OperatingHours", "Operating hours", "h/yr", HOURS, "6000"],
    ["AirLeakageRate", "Air leakage rate", "%", PCT, "25"],
    ["VFDAvailability", "VFD availability", undefined, YN, "No"],
    measured("1700000"),
  ],
  Boilers: [
    ["RatedCapacity", "Rated capacity", undefined, POS, "10"],
    ["RatedCapacityUnit", "Rated capacity unit", undefined, ["MW", "ton steam/hr"], "ton steam/hr"],
    ["ThermalEfficiency", "Thermal efficiency", "%", PCT, "80"],
    ["FuelType", "Fuel type", undefined, ["Natural Gas", "Diesel", "Coal", "Biomass", "LPG", "Other"], "Natural Gas"],
    ["FuelEnergyInput", "Fuel energy input", "GJ/yr", POS, "180000"],
    ["BoilerLoading", "Boiler loading", "%", PCT, "70"],
    ["OperatingHours", "Operating hours", "h/yr", HOURS, "7000"],
    ["ExcessAirLevel", "Excess air level", "%", PCT, "25"],
    ["CondensateRecovery", "Condensate recovery", "%", PCT, "40"],
    ["EnergyConsumptionMeasured", "Energy consumption (measured)", "GJ/yr", POS, "175000"],
  ],
  Furnaces: [
    ["RatedCapacity", "Rated capacity", "MW", POS, "45"],
    ["LoadFactor", "Load factor", "%", PCT, "85"],
    ["OperatingHours", "Operating hours", "h/yr", HOURS, "8000"],
    ["ThermalEfficiency", "Thermal efficiency", "%", PCT, "82"],
    ["ExcessAirRatio", "Excess air ratio", "ratio", GT1, "1.45"],
    ["FlueGasLosses", "Flue gas losses", "% of energy input", PCT, "18"],
    ["InsulationSurfaceTemperature", "Insulation surface temperature", "°C", POS, "68"],
    measured("309500000"),
  ],
  Ovens: [
    measured("2500000"),
    ["RatedCapacity", "Rated capacity", "MW", POS, "2"],
    ["LoadFactor", "Load factor", "%", PCT, "60"],
    ["OperatingHours", "Operating hours", "h/yr", HOURS, "5000"],
    ["ThermalEfficiency", "Thermal efficiency", "%", PCT, "55"],
    ["HeatLossesThroughWallsOpenings", "Heat losses through walls/openings", "% of input energy", PCT, "15"],
  ],
  AirConditioners: [
    ["CoolingCapacity", "Cooling capacity", undefined, POS, "300"],
    ["CoolingCapacityUnit", "Cooling capacity unit", undefined, ["TR", "kW"], "TR"],
    ["EfficiencyValue", "Efficiency value", undefined, POS, "2.7"],
    ["EfficiencyMetricType", "Efficiency metric type", undefined, ["COP", "EER", "SEER"], "COP"],
    ["OperatingHours", "Operating hours", "h/yr", HOURS, "3000"],
    ["MonthsSinceLastService", "Months since last service", "months", NONNEG, "12"],
    ["ControlSystem", "Control system", undefined, ["Manual", "Programmable Thermostat", "BMS", "None"], "Manual"],
    measured("1100000"),
  ],
  AirHandlingFans: [
    ["FanPower", "Fan power", "kW", POS, "75"],
    ["FanEfficiency", "Fan efficiency", "%", PCT, "60"],
    ["OperatingHours", "Operating hours", "h/yr", HOURS, "6000"],
    ["VariableSpeedControlAvailability", "Variable speed control availability", undefined, YN, "No"],
    ["AirLeakageInDucts", "Air leakage in ducts", "% of airflow", PCT, "10"],
    measured("450000"),
  ],
  LightingSystems: [
    ["LightingPowerDensity", "Lighting power density", "W/m²", POS, "18"],
    ["OperatingHours", "Operating hours", "h/yr", HOURS, "4000"],
    ["ControlSystems", "Control systems", undefined, ["None", "Timers", "Occupancy Sensors", "Daylight Harvesting", "Combination"], "None"],
    measured("1300000"),
  ],
  WaterHeaters: [
    ["RatedCapacity", "Rated capacity", "kW", POS, "150"],
    ["HeatingEfficiency", "Heating efficiency", "%", PCT, "85"],
    ["StandbyHeatLossRate", "Standby heat loss rate", "% of stored energy/day", PCT, "3"],
    ["ScaleBuildupCondition", "Scale build-up condition", undefined, ["None", "Light", "Moderate", "Heavy"], "Moderate"],
    ["OperatingHours", "Operating hours", "h/yr", HOURS, "3000"],
    measured("500000"),
  ],
  Chillers: [
    ["CoolingCapacity", "Cooling capacity", "TR", POS, "500"],
    ["KWTRRatio", "kW/TR ratio", "kW/TR", POS, "0.85"],
    ["OperatingHours", "Operating hours", "h/yr", HOURS, "4000"],
    ["CondenserCondition", "Condenser condition", undefined, ["Clean", "Fouled", "Poor"], "Fouled"],
    ["ChilledWaterTemperatureDifference", "Chilled water temperature difference", "°C", POS, "5"],
    measured("1700000"),
  ],
  CoolingTowers: [
    ["HeatRejectionCapacity", "Heat rejection capacity", undefined, POS, "650"],
    ["HeatRejectionCapacityUnit", "Heat rejection capacity unit", undefined, ["kW", "TR"], "TR"],
    ["FanMotorEfficiency", "Fan motor efficiency", "%", PCT, "88"],
    ["OperatingHours", "Operating hours", "h/yr", HOURS, "4000"],
    ["ApproachTemperature", "Approach temperature", "°C", POS, "4"],
    ["VFDAvailability", "VFD availability", undefined, YN, "No"],
    ["CyclesOfConcentration", "Cycles of concentration", "ratio", GT1, "3"],
    measured("180000"),
  ],
  ComputersDataCenters: [
    ["ITEquipmentLoad", "IT equipment load", "kW", POS, "200"],
    ["PowerUsageEffectiveness", "Power usage effectiveness", "PUE", { min: 1 }, "1.9"],
    ["ServerUtilization", "Server utilisation", "%", PCT, "30"],
    ["UPSEfficiency", "UPS efficiency", "%", PCT, "90"],
    ["HotColdAisleManagement", "Hot/cold aisle management", undefined, ["Yes", "No", "Partial"], "Partial"],
    measured("3300000"),
  ],
  ElevatorsMechanicalEquipment: [
    ["MotorEfficiency", "Motor efficiency", "%", PCT, "85"],
    ["DriveTechnology", "Drive technology", undefined, ["Geared", "Hydraulic", "Gearless", "VFD-driven"], "Geared"],
    ["RegenerativeBrakingAvailability", "Regenerative braking availability", undefined, YN, "No"],
    ["OperatingCyclesPerDay", "Operating cycles per day", "cycles/day", POS, "300"],
    ["EnergyConsumptionPerCycle", "Energy consumption per cycle", "kWh/cycle", POS, "0.3"],
    measured("33000"),
  ],
  ClinkerHandlingConveyors: [
    ["MotorPowerRating", "Motor power rating", "kW", POS, "160"],
    ["MotorEfficiencyClass", "Motor efficiency class", undefined, ["IE1", "IE2", "IE3", "IE4"], "IE2"],
    ["LoadingFactor", "Loading factor", "%", PCT, "55"],
    ["OperatingHours", "Operating hours", "h/yr", HOURS, "8000"],
    ["VariableSpeedDriveAvailability", "Variable speed drive availability", undefined, YN, "No"],
    ["IdleRunningTime", "Idle running time", "% of operating time", PCT, "28"],
    measured("3850000"),
  ],
  Pumps: [
    ["RatedPower", "Rated power", "kW", POS, "110"],
    ["PumpEfficiency", "Pump efficiency", "%", PCT, "65"],
    ["OperatingHours", "Operating hours", "h/yr", HOURS, "7000"],
    ["FlowControlMethod", "Flow control method", undefined, ["Throttling Valve", "VFD", "On-Off Control", "Bypass/Recirculation", "None"], "Throttling Valve"],
    ["LoadFactor", "Load factor", "%", PCT, "70"],
    measured("540000"),
  ],
  RenewableGeneration: [
    ["GenerationType", "Generation type", undefined, ["Solar PV", "Solar Thermal", "Wind", "Other"], "Solar PV"],
    ["InstalledCapacity", "Installed capacity", "kWp (PV/wind) or kWth (thermal)", POS, "1000"],
    ["PerformanceRatio", "Performance ratio", "%", PCT, "75"],
    ["AnnualGenerationMeasured", "Annual generation (measured)", "kWh/yr (PV/wind) or GJ/yr (thermal)", POS, "1600000"],
  ],
  WaterWastewaterTreatment: [
    ["TreatmentCapacity", "Treatment capacity", "m³/day", POS, "500"],
    ["AnnualVolumeTreated", "Annual volume treated", "m³/yr", POS, "150000"],
    ["SpecificEnergyConsumption", "Specific energy consumption", "kWh/m³ treated", POS, "0.8"],
    ["AerationSystemType", "Aeration system type", undefined, ["Diffused Aeration", "Mechanical Surface Aerator", "None/Not Applicable"], "Mechanical Surface Aerator"],
    ["AerationControl", "Aeration control", undefined, ["Fixed Speed", "DO-based Automatic Control (VFD)", "None/Not Applicable"], "Fixed Speed"],
    ["OperatingHours", "Operating hours", "h/yr", HOURS, "8000"],
    measured("120000"),
  ],
  ConstructionSiteEnergy: [
    ["DieselConsumptionIntensity", "Diesel consumption intensity", "L/m² GFA", POS, "4"],
    ["GridElectricityConsumptionIntensity", "Grid electricity consumption intensity", "kWh/m² GFA", POS, "15"],
    ["RenewableEnergyShareOfTotalEnergy", "Renewable share of total energy", "%", PCT, "5"],
    ["GeneratorLoadFactor", "Average diesel generator load factor", "%", PCT, "35"],
  ],
};

/** Unit lookup for a system metric (used by results + PDF). */
export function systemMetricMeta(systemKey: string, name: string) {
  const row = SYSTEM_FIELDS[systemKey]?.find((r) => r[0] === name);
  return row ? { label: row[1], unit: row[2] } : undefined;
}

function systemSteps(): StepDef[] {
  return SYSTEM_LABELS.map((label) => {
    const key = SYSTEM_TYPES[label];
    const base = `BuildingData.${key}`;
    return {
      id: `system:${base}`,
      title: label,
      description:
        "All fields are optional. For several units of the same type, enter aggregate values (e.g. combined rated power, production-weighted average efficiency).",
      visibleWhen: (v: Values) => selectedSystems(v).includes(label),
      fields: SYSTEM_FIELDS[key].map(([name, flabel, unit, rangeOrOpts, sample]): FieldDef =>
        Array.isArray(rangeOrOpts)
          ? { name: `${base}.${name}`, label: flabel, type: "select", options: rangeOrOpts, emptyOption: "Not specified", sample }
          : { name: `${base}.${name}`, label: flabel, type: "number", unit, range: rangeOrOpts as Range, sample }
      ),
    };
  });
}

// ---------------------------------------------------------------------------
// Shared building-info fields

function buildingInfoFields(existing: boolean): FieldDef[] {
  return [
    { name: `${BI}.BuildingName`, label: "Facility name", type: "text", required: true, sample: existing ? "Kiln Line 2" : "Assembly Plant 1", wide: true },
    { name: `${BI}.GFA`, label: "Facility gross floor area", type: "number", unit: "m²", range: POS, required: true, sample: existing ? "45000" : "18000", help: "Excluding car park area." },
    { name: `${BI}.IndustryType`, label: "Industry type", type: "select", options: INDUSTRIES, required: true, sample: existing ? "Cement" : "Automotive" },
    {
      name: `${BI}.ChemicalProductType`,
      label: "Chemical product type",
      type: "select",
      options: ["Ethylene", "Methanol"],
      required: true,
      sample: "Methanol",
      visibleWhen: (v) => industry(v) === "Chemicals",
    },
    {
      name: `${BI}.MonthlyProduction`,
      label: "Average monthly production",
      type: "number",
      unit: (v) => PRODUCTION_UNIT[industry(v) as Industry],
      range: POS,
      required: true,
      sample: existing ? "38000" : "4500",
    },
    ...(existing
      ? []
      : [
          {
            name: `${BI}.PrimaryFuelType`,
            label: "Primary thermal fuel type (optional)",
            type: "select",
            options: FUEL_TYPES,
            emptyOption: "Not decided yet",
            sample: "Natural Gas",
            help: "Only used to pick a more accurate emission factor for total carbon emission.",
          } satisfies FieldDef,
        ]),
  ];
}

const systemTypesField: FieldDef = {
  name: SYSTEM_TYPES_PATH,
  label: "System types present in the facility",
  type: "multiselect",
  options: SYSTEM_LABELS,
  required: true,
  wide: true,
};

const CONSUMPTION: [string, string, string, string][] = [
  ["MonthlyElectricityConsumption", "Electricity", "kWh", "1250000"],
  ["MonthlyNaturalGasConsumption", "Natural gas", "m³", "0"],
  ["MonthlyCoalConsumption", "Coal", "ton", "3200"],
  ["MonthlyDieselConsumption", "Diesel", "m³", "15"],
  ["MonthlyPetrolConsumption", "Petrol", "m³", "0"],
  ["MonthlyLPGConsumption", "LPG", "ton", "0"],
  ["MonthlyLNGConsumption", "LNG", "ton", "0"],
  ["MonthlyHFOConsumption", "HFO", "m³", "0"],
  ["MonthlyLFOConsumption", "LFO", "m³", "0"],
  ["MonthlyOtherConsumption", "Other energy", "GJ", "0"],
  ["OtherEnergyEF", "Weighted emission factor of other energy", "t CO₂e/GJ", "0"],
  ["MonthlyWaterConsumption", "Water", "m³", "8500"],
  ["MonthlyRawMaterialConsumption", "Raw material", "ton", "42000"],
];

const consumptionFields: FieldDef[] = CONSUMPTION.map(([name, label, unit, sample]) => ({
  name: `${CONS}.${name}`,
  label: name === "OtherEnergyEF" ? label : `${label} (avg. monthly)`,
  type: "number",
  unit,
  range: NONNEG,
  required: true,
  sample,
}));

export const ieeaNewDev: FlowSchema = {
  key: "ieea/new-development",
  constants: { ProjectStatus: "New Development", [`${BI}.BuildingType`]: "Industrial Facility" },
  steps: [
    { id: "project", title: "Project", description: "Basic project details.", fields: projectFields({ egyptOnly: true, sampleName: "Demo Automotive Plant", gfa: "18000" }) },
    { id: "building", title: "Building info", description: "Industry, expected production and (optionally) the primary fuel.", fields: buildingInfoFields(false) },
    {
      id: "systems",
      title: "System types",
      description: "Select every system type the facility will have. Results are estimated from typical performance for each.",
      fields: [{ ...systemTypesField, sample: ["Motors", "Air Conditioners (AC Units)", "Lighting Systems"] }],
    },
  ],
};

export const ieeaExisting: FlowSchema = {
  key: "ieea/existing",
  constants: { ProjectStatus: "Existing Building", [`${BI}.BuildingType`]: "Industrial Facility" },
  steps: [
    { id: "project", title: "Project", description: "Basic project details.", fields: projectFields({ egyptOnly: true, sampleName: "Demo Cement Works", gfa: "45000" }) },
    { id: "building", title: "Building info", description: "Industry and measured production.", fields: buildingInfoFields(true) },
    { id: "consumption", title: "Consumption", description: "Average monthly consumption from utility bills or meters. Enter 0 for sources you don't use.", fields: consumptionFields },
    {
      id: "kpis",
      title: "Facility KPIs",
      description: "Key performance indicators for the selected industry.",
      fields: kpiFields(),
      visibleWhen: (v) => !!industry(v),
    },
    {
      id: "systems",
      title: "System types",
      description: "Select every system type present. You'll get one step per selected system.",
      fields: [{ ...systemTypesField, sample: ["Motors", "Furnaces", "Clinker Handling / Conveyors"] }],
    },
    ...systemSteps(),
  ],
};
