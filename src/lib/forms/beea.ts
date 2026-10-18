import { getPath, type FieldDef, type FlowSchema, type Range, type StepDef, type Values } from "./engine";

/** BEEA schemas (spec sections 2.2.1 to 2.2.3). One builder, three variants. */

type Variant = "newdev" | "retrofit" | "inoperation";

const BI = "BuildingData.BuildingInfo";
const FA = "BuildingData.Facade";
const AC = "BuildingData.ACSystem";
const AD = "BuildingData.ADSystem";
const LI = "BuildingData.LightingSystem";
const MV = "BuildingData.MVSystem";
const OT = "BuildingData.OtherSystem";

export const BUILDING_TYPES = [
  "Office Building",
  "Retail Building",
  "Hotel",
  "Healthcare Facility",
  "Educational Institution",
  "Industrial Building",
  "Residential Building",
  "Mixed Development",
  "Others",
] as const;

const WATER_COOLED = "Water-cooled Chilled Water Plant";
const AIR_COOLED = "Air-cooled Chilled Water Plant";
const UNITARY = "Unitary Air-conditioning System";
const DISTRICT = "District Cooling System";
export const AC_TYPES = [WATER_COOLED, AIR_COOLED, UNITARY, DISTRICT] as const;
export const AD_TYPES = ["AHU-CAV", "AHU-VAV", "FCU-CAV", "FCU-VAV"] as const;

const acType = (v: Values) => getPath(v, `${BI}.ACType`) as string;
const adType = (v: Values) => getPath(v, `${BI}.ExistingADType`) as string;
const bType = (v: Values) => getPath(v, `${BI}.BuildingType`) as string;
const acIs = (...types: string[]) => (v: Values) => types.includes(acType(v));

const pct: Range = { min: 0, max: 100 };
const positive: Range = { min: 0, minExclusive: true };
const nonNegative: Range = { min: 0 };

/** Required numeric field. Spec ranges are treated as inclusive unless clearly exclusive. */
function num(
  name: string,
  label: string,
  unit: string | undefined,
  range: FieldDef["range"],
  sample: string,
  extra: Partial<FieldDef> = {}
): FieldDef {
  return { name, label, type: "number", unit, range, required: true, sample, ...extra };
}

function toggle(name: string, label: string, help: string, extra: Partial<FieldDef> = {}): FieldDef {
  return { name, label, type: "toggle", help, sample: true, ...extra };
}

export function projectFields(opts: { egyptOnly?: boolean; sampleName: string; gfa: string }): FieldDef[] {
  return [
    { name: "ProjectName", label: "Project name", type: "text", required: true, sample: opts.sampleName, wide: true },
    { name: "ProjectAddress", label: "Project address", type: "text", required: true, sample: "12 Green Street", wide: true },
    { name: "ProjectPostalCode", label: "Postal code", type: "text", required: true, sample: opts.egyptOnly ? "11511" : "123456" },
    opts.egyptOnly
      ? {
          name: "ProjectCountry",
          label: "Country",
          type: "select",
          options: ["Egypt"],
          required: true,
          defaultValue: "Egypt",
          sample: "Egypt",
          help: "IEEA currently supports facilities in Egypt only.",
        }
      : { name: "ProjectCountry", label: "Country", type: "text", required: true, sample: "Egypt" },
    num("ProjectGFA", "Project gross floor area", "m²", positive, opts.gfa, {
      help: "Excluding car park area.",
    }),
  ];
}

function buildingInfo(variant: Variant): FieldDef[] {
  const existing = variant !== "newdev";
  const f: FieldDef[] = [
    { name: `${BI}.BuildingName`, label: "Building name", type: "text", required: true, sample: "Tower A", wide: true },
    num(`${BI}.GFA`, "Building gross floor area", "m²", positive, "10000", { help: "Excluding car park area." }),
    { name: `${BI}.BuildingType`, label: "Building type", type: "select", options: BUILDING_TYPES, required: true, sample: "Office Building" },
    { name: `${BI}.Storey`, label: "Number of storeys", type: "int", range: { min: 1, max: 300 }, required: true, sample: "10" },
    num(`${BI}.YearTOP`, "Year of TOP / CSC", undefined, { min: 1900, max: 9999, integer: true }, existing ? "2008" : "2026", {
      help: "Temporary Occupation Permit or Certificate of Statutory Completion.",
    }),
    num(`${BI}.FBArea`, "Food & beverage area", "m²", nonNegative, "0"),
    num(`${BI}.SupermarArea`, "Supermarket area", "m²", nonNegative, "0"),
    num(`${BI}.DCArea`, "Data centre / server room area", "m²", nonNegative, "100"),
    num(`${BI}.Schedule`, "Total building operation", "hours/week", { min: 0, max: 168, minExclusive: true }, "55"),
  ];
  if (existing)
    f.push(num(`${BI}.MonthlyConsumption`, "Average monthly energy consumption", "kWh", positive, "200000"));
  f.push(
    num(`${BI}.PACArea`, "Air-conditioned area", "%", pct, "80"),
    { name: `${BI}.ACType`, label: "Air conditioning system type", type: "select", options: AC_TYPES, required: true, sample: WATER_COOLED, wide: true }
  );
  if (existing)
    f.push(num(`${BI}.ExistingACEffi`, "Existing A/C system efficiency", "kW/RT", { min: 0, max: 3, minExclusive: true }, "0.75"));
  f.push({ name: `${BI}.ExistingADType`, label: "Air distribution system type", type: "select", options: AD_TYPES, required: true, sample: "AHU-CAV" });
  if (existing)
    f.push(num(`${BI}.ExistingADEffi`, "Existing air distribution efficiency", "kW/RT", { min: 0, max: 1, minExclusive: true }, "0.25"));
  if (variant === "retrofit") f.push(num(`${BI}.ExistingPLED`, "Existing LED lighting share", "%", pct, "20"));
  f.push(num(`${BI}.MVArea`, "Total mechanically ventilated area", "m²", nonNegative, "2000"));
  return f;
}

const facade: FieldDef[] = [
  num(`${FA}.PNVArea`, "Natural ventilation area converted from A/C area", "%",
    (v) => ({ min: 0, max: Number(getPath(v, `${BI}.PACArea`)) || 100 }), "10",
    { help: "Must not exceed the air-conditioned area percentage." }),
  num(`${FA}.WWR`, "Reduced window-to-wall ratio", undefined, { min: 0, max: 0.4 }, "0.3"),
  num(`${FA}.RoofU`, "Roof U-value (insulation)", "W/m²·K", { min: 0.2, max: 1.5 }, "0.6"),
  num(`${FA}.WallU`, "Wall U-value (insulation)", "W/m²·K", { min: 0.2, max: 1.5 }, "0.6"),
  num(`${FA}.GlassU`, "Glass U-value (high-performance glass)", "W/m²·K", { min: 0.5, max: 2.8 }, "1.9"),
  num(`${FA}.GlassSHGC`, "Glass solar heat gain coefficient", undefined, { min: 0.1, max: 0.35 }, "0.25"),
  num(`${FA}.FilmU`, "Solar window film U-value", "W/m²·K", { min: 1, max: 10 }, "4"),
  num(`${FA}.FilmSHGC`, "Film solar heat gain coefficient", undefined, { min: 0.05, max: 0.6 }, "0.3"),
  num(`${FA}.FrameU`, "Window frame U-value (thermally broken)", "W/m²·K", { min: 0.4, max: 1.2 }, "0.7"),
  num(`${FA}.PaintSR`, "Solar reflectivity (cool paint)", undefined, { min: 0.3, max: 0.9 }, "0.6"),
  num(`${FA}.Shading`, "Shading coefficient (external shading)", undefined, { min: 0.1, max: 0.9 }, "0.6"),
];

function acSystem(variant: Variant): FieldDef[] {
  const acOpt = toggle(`${AC}.ACOpt`, "Air conditioning system optimisation", "Chiller plant optimisation controls.", {
    visibleWhen: acIs(WATER_COOLED, AIR_COOLED),
  });
  const unitary = num(`${AC}.UnitaryEffi`, "Energy-efficient unitary A/C system", "kW/RT", { min: 0.6, max: 1.1 }, "0.8", {
    visibleWhen: acIs(UNITARY),
  });
  if (variant === "inoperation") return [acOpt, unitary];
  return [
    num(`${AC}.ChillerEffi`, "Energy-efficient chiller", "kW/RT",
      (v) => (acType(v) === AIR_COOLED ? { min: 0.8, max: 1.5 } : { min: 0.4, max: 0.9 }), "0.52",
      { visibleWhen: acIs(WATER_COOLED, AIR_COOLED) }),
    num(`${AC}.CHWPEffi`, "Energy-efficient chilled water pump", "kW/m³/s", { min: 160, max: 350 }, "230", {
      visibleWhen: acIs(WATER_COOLED, AIR_COOLED, DISTRICT),
    }),
    num(`${AC}.CWPEffi`, "Energy-efficient condensing water pump", "kW/m³/s", { min: 140, max: 300 }, "210", {
      visibleWhen: acIs(WATER_COOLED),
    }),
    num(`${AC}.CTEffi`, "Energy-efficient cooling tower", "L/s/kW", { min: 1.7, max: 7 }, "5.2", {
      visibleWhen: acIs(WATER_COOLED),
    }),
    acOpt,
    unitary,
  ];
}

/** ADFanEffi range depends on the effective distribution type (after any VSD upgrade). */
function adFanRange(v: Values): Range {
  const upgraded = getPath(v, `${AD}.ADType`) as string;
  const t = upgraded || adType(v);
  switch (t) {
    case "FCU-CAV":
      return { min: 0.05, max: 0.18 };
    case "AHU-CAV":
      return { min: 0.2, max: 0.5 };
    case "AHU-VAV":
      return { min: 0.3, max: 0.6 };
    default:
      return { min: 0.06, max: 0.22 }; // FCU-VAV
  }
}

function adSystem(variant: Variant): FieldDef[] {
  const notUnitary = (v: Values) => !!acType(v) && acType(v) !== UNITARY;
  const vsd: FieldDef = {
    name: `${AD}.ADType`,
    label: "Variable speed drive (VSD) upgrade in AHU/FCU",
    type: "select",
    options: (v) => (adType(v) === "AHU-CAV" ? ["AHU-VAV"] : ["FCU-VAV"]),
    emptyOption: "None (no VSD upgrade)",
    visibleWhen: (v) => adType(v) === "AHU-CAV" || adType(v) === "FCU-CAV",
    sample: "AHU-VAV",
    help: "Only for constant air volume (CAV) systems.",
  };
  const dcv = toggle(`${AD}.DCV`, "Demand-controlled ventilation of A/C area", "CO₂-based fresh air control.", { visibleWhen: notUnitary });
  const erv = num(`${AD}.ERVEffi`, "Energy recovery ventilation efficiency", "%", { min: 30, max: 95 }, "70", { visibleWhen: notUnitary });
  const pfan = num(`${AD}.PFan`, "Fans used to offset cooling load", "%", pct, "50");
  if (variant === "inoperation") return [vsd, dcv, erv, pfan];
  return [
    vsd,
    num(`${AD}.PACT`, "Alternative cooling technologies", "%", pct, "20"),
    num(`${AD}.ADFanEffi`, "Energy-efficient air distribution fan", "W/CMH", adFanRange, "0.46", {
      visibleWhen: notUnitary,
      help: "Allowed range depends on the air distribution type.",
    }),
    dcv,
    erv,
    pfan,
  ];
}

const lighting: FieldDef[] = [
  num(`${LI}.LEDEfficacy`, "LED efficacy", "lm/W", { min: 70, max: 200 }, "160"),
  num(`${LI}.PLED`, "Energy-efficient LED lights", "%", pct, "90"),
  num(`${LI}.PLigCrl`, "Smart lighting control coverage", "%", pct, "50"),
  num(`${LI}.PDaylight`, "Daylighting coverage", "%", pct, "20"),
];

const mv: FieldDef[] = [
  num(`${MV}.MVFanEffi`, "Energy-efficient MV fan", "W/CMH", { min: 0.05, max: 0.3 }, "0.15"),
  num(`${MV}.PMVCrl`, "Demand-controlled ventilation of MV area", "%", pct, "50"),
];

const HOT_WATER = ["Hotel", "Healthcare Facility", "Residential Building"];
const other: FieldDef[] = [
  toggle(`${OT}.PLC`, "Smart plug load control", "Automatic shutdown of plug loads."),
  toggle(`${OT}.EfficientApp`, "Energy-efficient appliances", "Residential buildings only.", {
    visibleWhen: (v) => bType(v) === "Residential Building",
  }),
  num(`${OT}.HWCOP`, "Energy-efficient hot water system (COP)", undefined, { min: 2, max: 5 }, "3.5", {
    visibleWhen: (v) => HOT_WATER.includes(bType(v)),
  }),
  num(`${OT}.PSolarHW`, "Solar hot water collectors", "%", pct, "30", {
    visibleWhen: (v) => HOT_WATER.includes(bType(v)),
  }),
  toggle(`${OT}.EfficientLift`, "Energy-efficient lifts", "Regenerative drives, sleep mode, etc."),
  toggle(`${OT}.EfficientEscalator`, "Energy-efficient escalators", "Variable speed / auto-start."),
  toggle(`${OT}.BEMS`, "Building energy management system", "Centralised monitoring and control."),
  num(`${OT}.PVEffi`, "Rooftop solar panel efficiency", "%", pct, "19"),
  num(`${OT}.PVArea`, "Rooftop solar panel area", "m²", nonNegative, "100"),
  num(`${OT}.BIPVEffi`, "BIPV solar panel efficiency", "%", pct, "19"),
  num(`${OT}.BIPVArea`, "BIPV solar panel area", "m²", nonNegative, "100"),
];

const STATUS: Record<Variant, string> = {
  newdev: "New Development",
  retrofit: "Retrofitting Project",
  inoperation: "In Operation",
};

function buildBeea(variant: Variant, flowId: string, sampleName: string): FlowSchema {
  const designWord = variant === "inoperation" ? "Improvement measures" : variant === "retrofit" ? "Planned upgrades" : "Proposed design";
  const steps: StepDef[] = [
    { id: "project", title: "Project", description: "Basic project details.", fields: projectFields({ sampleName, gfa: "10000" }) },
    {
      id: "building",
      title: "Building info",
      description: variant === "newdev" ? "Building characteristics." : "Current building characteristics and measured performance.",
      fields: buildingInfo(variant),
    },
    { id: "facade", title: "Facade", description: `${designWord} for the building envelope.`, fields: facade },
    { id: "ac", title: "A/C system", description: `${designWord} for air conditioning. Fields depend on the A/C system type.`, fields: acSystem(variant) },
    { id: "ad", title: "Air distribution", description: `${designWord} for air distribution.`, fields: adSystem(variant) },
    { id: "lighting", title: "Lighting", description: `${designWord} for lighting.`, fields: lighting },
    { id: "mv", title: "Mechanical ventilation", description: `${designWord} for mechanical ventilation.`, fields: mv },
    { id: "other", title: "Other systems", description: "Plug loads, hot water, vertical transport, BEMS and solar.", fields: other },
  ];
  return { key: `beea/${flowId}`, steps, constants: { ProjectStatus: STATUS[variant] } };
}

export const beeaNewDev = buildBeea("newdev", "new-development", "Demo New Development");
export const beeaRetrofit = buildBeea("retrofit", "retrofitting", "Demo Retrofit");
export const beeaInOperation = buildBeea("inoperation", "in-operation", "Demo In Operation");
