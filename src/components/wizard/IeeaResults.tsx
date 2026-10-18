"use client";

import { useState, type ReactNode } from "react";
import { getPath, type Values } from "@/lib/forms/engine";
import {
  energyRows,
  fmtNum,
  isOnTrack,
  kpiRows,
  systemPerfRows,
  toList,
  type IeeaResult,
} from "@/lib/ieea-result";
import { MockBanner } from "./BeeaReport";

export function IeeaResults({
  data,
  payload,
  flowTitle,
  mock,
}: {
  data: IeeaResult;
  payload: Values;
  flowTitle: string;
  mock: boolean;
}) {
  const [pdfState, setPdfState] = useState<"idle" | "busy" | "error">("idle");
  const industry = String(getPath(payload, "BuildingData.BuildingInfo.IndustryType") ?? "");
  const sec = data.SpecificEnergyConsumptionBenchmarking;
  const kpis = kpiRows(data.KPIBenchmarking, industry);
  const systems = systemPerfRows(data.SystemPerformanceBenchmarking);
  const { rows: energy, total: totalSavings } = energyRows(data.EnergyAnalysisAndRecommendation);
  const water = data.WaterAnalysisAndRecommendation;
  const raw = data.RawMaterialAnalysisAndRecommendation;
  const totalEnergy = Number(data.TotalEnergyConsumption);
  const savingsPct = totalEnergy > 0 && Number(totalSavings) ? (Number(totalSavings) / totalEnergy) * 100 : undefined;

  async function downloadPdf() {
    setPdfState("busy");
    try {
      const { generateIeeaPdf } = await import("@/lib/ieea-pdf");
      const bytes = await generateIeeaPdf({ data, payload, flowTitle, mock });
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `IEEA-${flowTitle.replace(/\s+/g, "-")}-${String(payload.ProjectName ?? "project").replace(/[^A-Za-z0-9-_]+/g, "-")}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setPdfState("idle");
    } catch (e) {
      console.error(e);
      setPdfState("error");
    }
  }

  return (
    <section className="space-y-6">
      {mock && <MockBanner />}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
        <div>
          <p className="font-semibold text-emerald-900">Assessment complete</p>
          <p className="text-sm text-emerald-800">
            {String(payload.ProjectName ?? "")} · {industry}
          </p>
        </div>
        <button
          type="button"
          onClick={downloadPdf}
          disabled={pdfState === "busy"}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
        >
          {pdfState === "busy" ? "Building PDF…" : "Download PDF report"}
        </button>
      </div>
      {pdfState === "error" && (
        <p role="alert" className="text-sm text-red-600">
          Could not build the PDF. Check the browser console for details.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total energy consumption" value={fmtNum(data.TotalEnergyConsumption, 0)} unit="GJ / year" />
        <Stat label="Total carbon emission" value={fmtNum(data.TotalCarbonEmission, 0)} unit="t CO₂e / year" />
        <Stat
          label="Potential energy savings"
          value={fmtNum(totalSavings, 0)}
          unit={`GJ / year${savingsPct !== undefined ? ` · ${savingsPct.toFixed(1)}% of total` : ""}`}
        />
      </div>

      {sec && (
        <Card title="Specific energy consumption vs BAT">
          <div className="flex flex-wrap items-center gap-6 px-5 py-4">
            <Metric label="Facility SEC" value={fmtNum(sec.SEC)} unit={sec.SECUnit} />
            <Metric label="BAT benchmark" value={fmtNum(sec.SECOfBAT)} unit={sec.SECUnit} />
            <Badge result={sec.SECBenchmarkingResult} />
          </div>
        </Card>
      )}

      {kpis.length > 0 && (
        <Card title="KPI benchmarking">
          <Table head={["KPI", "Facility", "BAT", "Result"]} alignRight={[1, 2]}>
            {kpis.map((k) => (
              <tr key={k.name} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{k.label}</p>
                  {k.unit && <p className="text-xs text-slate-500">{k.unit}</p>}
                  {k.recommendations.length > 0 && <Recs items={k.recommendations} />}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtNum(k.value)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtNum(k.bat)}</td>
                <td className="px-4 py-3">
                  <Badge result={k.result} />
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {systems.length > 0 && (
        <Card title="System performance benchmarking">
          <Table head={["System", "Metric", "Facility", "BAT", "Result"]} alignRight={[2, 3]}>
            {systems.map((s) =>
              (s.metrics.length ? s.metrics : [{ name: "-", label: "–", unit: undefined, value: "", bat: "" }]).map((m, i) => (
                <tr key={`${s.key}-${m.name}`}>
                  <td className="px-4 py-3 font-medium text-slate-900">{i === 0 ? s.name : ""}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {m.label}
                    {m.unit && <span className="text-xs text-slate-400"> ({m.unit})</span>}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtNum(m.value)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtNum(m.bat)}</td>
                  <td className="px-4 py-3">{i === 0 && <Badge result={s.result} />}</td>
                </tr>
              ))
            )}
          </Table>
        </Card>
      )}

      {energy.length > 0 && (
        <Card title="Energy analysis and savings per system">
          <Table head={["System", "Consumption (GJ/yr)", "Savings (GJ/yr)"]} alignRight={[1, 2]}>
            {energy.map((r) => {
              const c = Math.abs(Number(r.consumption));
              const pct = c > 0 && Number(r.savings) ? (Number(r.savings) / c) * 100 : 0;
              return (
                <tr key={r.key} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{r.name}</p>
                    {r.recommendations.length > 0 && <Recs items={r.recommendations} />}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtNum(r.consumption)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {fmtNum(r.savings)}
                    {pct > 0 && (
                      <div className="ml-auto mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            <tr className="bg-slate-50 font-semibold">
              <td className="px-4 py-3">Total energy savings</td>
              <td />
              <td className="px-4 py-3 text-right tabular-nums">{fmtNum(totalSavings)}</td>
            </tr>
          </Table>
          <p className="px-5 pb-4 text-xs text-slate-500">
            Renewable generation (negative consumption = generation offset) and construction site energy are excluded from the total.
          </p>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Water analysis">
          {water ? (
            <div className="space-y-3 px-5 py-4">
              <div className="flex gap-8">
                <Metric label="Consumption" value={fmtNum(water.WaterConsumption)} unit="m³/yr" />
                <Metric label="Potential savings" value={fmtNum(water.TotalWaterSavings)} unit="m³/yr" />
              </div>
              <Recs items={toList(water.WaterRecommendation)} />
            </div>
          ) : (
            <NotApplicable />
          )}
        </Card>
        <Card title="Raw material analysis">
          {raw ? (
            <div className="space-y-3 px-5 py-4">
              <div className="flex gap-8">
                <Metric label="Consumption" value={fmtNum(raw.RawMaterialConsumption)} unit="t/yr" />
                <Metric label="Potential savings" value={fmtNum(raw.TotalRawMaterialSavings)} unit="t/yr" />
              </div>
              <Recs items={toList(raw.RawMaterialRecommendation)} />
            </div>
          ) : (
            <NotApplicable />
          )}
        </Card>
      </div>

      <details className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium text-slate-700">Show raw API response</summary>
        <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-emerald-100">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </section>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{unit}</p>
    </div>
  );
}

function Metric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-semibold tabular-nums text-slate-900">
        {value} {unit && <span className="text-sm font-normal text-slate-500">{unit}</span>}
      </p>
    </div>
  );
}

function Badge({ result }: { result?: string }) {
  if (!result) return <span className="text-slate-400">–</span>;
  const ok = isOnTrack(result);
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
        ok ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
      }`}
    >
      {ok ? "✓ " : ""}
      {result}
    </span>
  );
}

function Recs({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="mt-2 space-y-1 text-sm text-slate-600">
      {items.map((r) => (
        <li key={r} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
          {r}
        </li>
      ))}
    </ul>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <h3 className="border-b border-slate-100 px-5 py-3 font-semibold text-slate-900">{title}</h3>
      {children}
    </section>
  );
}

function Table({ head, alignRight = [], children }: { head: string[]; alignRight?: number[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {head.map((h, i) => (
              <th key={h} className={`px-4 py-2.5 font-medium ${alignRight.includes(i) ? "text-right" : "text-left"}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

function NotApplicable() {
  return <p className="px-5 py-4 text-sm text-slate-500">Not applicable for this facility.</p>;
}
