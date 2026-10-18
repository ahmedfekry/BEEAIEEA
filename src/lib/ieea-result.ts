import { kpiMeta, SYSTEM_DISPLAY_NAME, systemMetricMeta } from "./forms/ieea";

/** Shape of `data` returned by the IEEA endpoints (spec 2.2.4 / 2.2.5). Values arrive as strings. */
export type IeeaResult = {
  TotalEnergyConsumption?: string;
  TotalCarbonEmission?: string;
  SpecificEnergyConsumptionBenchmarking?: {
    SEC?: string;
    SECOfBAT?: string;
    SECUnit?: string;
    SECBenchmarkingResult?: string;
  } | null;
  KPIBenchmarking?: Record<string, unknown> | null;
  SystemPerformanceBenchmarking?: Record<string, Record<string, unknown>> | null;
  EnergyAnalysisAndRecommendation?: Record<string, unknown> | null;
  WaterAnalysisAndRecommendation?: {
    WaterConsumption?: string;
    WaterRecommendation?: unknown;
    TotalWaterSavings?: string;
  } | null;
  RawMaterialAnalysisAndRecommendation?: {
    RawMaterialConsumption?: string;
    RawMaterialRecommendation?: unknown;
    TotalRawMaterialSavings?: string;
  } | null;
};

export function isOnTrack(result: unknown) {
  return /on\s*track/i.test(String(result ?? ""));
}

/** Recommendations come as a list, a single string, or "-" when not applicable. */
export function toList(x: unknown): string[] {
  if (Array.isArray(x)) return x.map(String).filter((s) => s.trim() && s.trim() !== "-");
  if (typeof x === "string" && x.trim() && x.trim() !== "-") return [x.trim()];
  return [];
}

export function fmtNum(x: unknown, maxFrac = 2): string {
  if (x === null || x === undefined || x === "") return "–";
  const n = Number(x);
  if (!Number.isFinite(n)) return String(x);
  return n.toLocaleString("en-US", { maximumFractionDigits: maxFrac });
}

/** Splits a camel-case variable name into words, as a fallback label. */
export function humanize(name: string) {
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/CO2/g, "CO₂");
}

const KPI_SUFFIXES = ["OfBAT", "BenchmarkingResult", "Recommendation"];

export type KpiRow = {
  name: string;
  label: string;
  unit?: string;
  value: unknown;
  bat: unknown;
  result: string;
  recommendations: string[];
};

export function kpiRows(kpis: IeeaResult["KPIBenchmarking"], industry: string): KpiRow[] {
  if (!kpis) return [];
  const names = Object.keys(kpis).filter((k) => !KPI_SUFFIXES.some((s) => k.endsWith(s)));
  return names.map((name) => {
    const meta = kpiMeta(industry, name);
    return {
      name,
      label: meta?.label ?? humanize(name),
      unit: meta?.unit,
      value: kpis[name],
      bat: kpis[`${name}OfBAT`],
      result: String(kpis[`${name}BenchmarkingResult`] ?? ""),
      recommendations: toList(kpis[`${name}Recommendation`]),
    };
  });
}

export type SystemPerfRow = {
  key: string;
  name: string;
  result: string;
  metrics: { name: string; label: string; unit?: string; value: unknown; bat: unknown }[];
};

export function systemPerfRows(spb: IeeaResult["SystemPerformanceBenchmarking"]): SystemPerfRow[] {
  if (!spb) return [];
  return Object.entries(spb).map(([key, obj]) => {
    const o = obj ?? {};
    const metricNames = Object.keys(o).filter((k) => k !== "BenchmarkingResult" && !k.endsWith("OfBAT"));
    return {
      key,
      name: SYSTEM_DISPLAY_NAME[key] ?? humanize(key),
      result: String(o.BenchmarkingResult ?? ""),
      metrics: metricNames.map((m) => {
        const meta = systemMetricMeta(key, m);
        return { name: m, label: meta?.label ?? humanize(m), unit: meta?.unit, value: o[m], bat: o[`${m}OfBAT`] };
      }),
    };
  });
}

export type EnergyRow = {
  key: string;
  name: string;
  consumption: unknown;
  savings: unknown;
  recommendations: string[];
};

export function energyRows(eaar: IeeaResult["EnergyAnalysisAndRecommendation"]) {
  const rows: EnergyRow[] = [];
  if (!eaar) return { rows, total: undefined as unknown };
  for (const [key, v] of Object.entries(eaar)) {
    if (key === "TotalEnergySavings" || !v || typeof v !== "object") continue;
    const o = v as Record<string, unknown>;
    rows.push({
      key,
      name: SYSTEM_DISPLAY_NAME[key] ?? humanize(key),
      consumption: o.EnergyConsumption,
      savings: o.EnergySavings,
      recommendations: toList(o.Recommendation),
    });
  }
  return { rows, total: eaar.TotalEnergySavings };
}
