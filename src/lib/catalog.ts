export type Family = "beea" | "ieea";

export type Flow = {
  id: string; // used in the URL: /assess/[family]/[flow]
  family: Family;
  title: string;
  description: string;
  endpoint: string; // path under the SLEB base URL
  status: string; // value sent as ProjectStatus
  output: "pdf" | "json";
};

export const FAMILIES: Record<
  Family,
  { name: string; fullName: string; blurb: string; points: string[] }
> = {
  beea: {
    name: "BEEA",
    fullName: "Building Energy Efficiency Assessment",
    blurb:
      "Assess offices, retail, hotels, hospitals, schools and residential buildings. Returns a PDF report.",
    points: ["Facade & envelope", "A/C, ventilation & lighting", "Lifts, BEMS & solar"],
  },
  ieea: {
    name: "IEEA",
    fullName: "Industrial Energy Efficiency Assessment",
    blurb:
      "Benchmark industrial facilities against Best Available Techniques. Returns structured results we turn into a PDF.",
    points: ["17 industries", "Motors, boilers, furnaces & more", "Energy, water & material savings"],
  },
};

export const FLOWS: Flow[] = [
  {
    id: "new-development",
    family: "beea",
    title: "New Development",
    description: "Assess the proposed design of a new building project.",
    endpoint: "/project/report/newdev",
    status: "New Development",
    output: "pdf",
  },
  {
    id: "retrofitting",
    family: "beea",
    title: "Retrofitting",
    description: "Compare existing conditions against planned upgrades.",
    endpoint: "/project/report/retrofit",
    status: "Retrofitting Project",
    output: "pdf",
  },
  {
    id: "in-operation",
    family: "beea",
    title: "In Operation",
    description: "Find improvement measures for a building that is already running.",
    endpoint: "/project/report/inoperation",
    status: "In Operation",
    output: "pdf",
  },
  {
    id: "new-development",
    family: "ieea",
    title: "New Development",
    description: "Estimate performance of a planned industrial facility from minimal input.",
    endpoint: "/project/report/newdevind",
    status: "New Development",
    output: "json",
  },
  {
    id: "existing",
    family: "ieea",
    title: "Existing Facility",
    description: "Detailed assessment using measured consumption, KPIs and system data.",
    endpoint: "/project/report/existingind",
    status: "Existing Building",
    output: "json",
  },
];

export function getFlows(family: Family) {
  return FLOWS.filter((f) => f.family === family);
}

export function getFlow(family: string, id: string) {
  return FLOWS.find((f) => f.family === family && f.id === id);
}

export function isFamily(value: string): value is Family {
  return value === "beea" || value === "ieea";
}
