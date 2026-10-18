import { PDFDocument, type PDFFont, type PDFPage, rgb, StandardFonts } from "pdf-lib";
import { getPath, type Values } from "./forms/engine";
import { PRODUCTION_UNIT, type Industry } from "./forms/ieea";
import {
  energyRows,
  fmtNum,
  isOnTrack,
  kpiRows,
  systemPerfRows,
  toList,
  type IeeaResult,
} from "./ieea-result";
import { winAnsi } from "./pdf-text";

/** Builds the IEEA results PDF from the API response and the submitted payload. */

type RGB = [number, number, number];
const C = {
  ink: [0.06, 0.09, 0.16] as RGB,
  muted: [0.39, 0.45, 0.53] as RGB,
  line: [0.89, 0.91, 0.94] as RGB,
  brand: [0.02, 0.47, 0.34] as RGB,
  brandSoft: [0.93, 0.98, 0.95] as RGB,
  good: [0.02, 0.5, 0.27] as RGB,
  goodBg: [0.86, 0.97, 0.9] as RGB,
  warn: [0.7, 0.33, 0.04] as RGB,
  warnBg: [1, 0.95, 0.85] as RGB,
  headBg: [0.95, 0.96, 0.97] as RGB,
};
const color = (c: RGB) => rgb(c[0], c[1], c[2]);

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 48;
const CONTENT_W = PAGE_W - 2 * M;

type Col = { header: string; width: number; align?: "left" | "right" };
type Cell = string | { badge: string };

class Writer {
  page!: PDFPage;
  y = 0;
  constructor(
    public doc: PDFDocument,
    public font: PDFFont,
    public bold: PDFFont
  ) {
    this.newPage();
  }

  newPage() {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.y = PAGE_H - M;
  }

  ensure(h: number) {
    if (this.y - h < M + 20) this.newPage();
  }

  wrap(text: string, font: PDFFont, size: number, width: number): string[] {
    const words = winAnsi(text).split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (font.widthOfTextAtSize(next, size) <= width) cur = next;
      else {
        if (cur) lines.push(cur);
        // Hard-break words longer than the column.
        let word = w;
        while (font.widthOfTextAtSize(word, size) > width && word.length > 1) {
          let i = word.length - 1;
          while (i > 1 && font.widthOfTextAtSize(word.slice(0, i), size) > width) i--;
          lines.push(word.slice(0, i));
          word = word.slice(i);
        }
        cur = word;
      }
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [""];
  }

  text(str: string, o: { size?: number; bold?: boolean; color?: RGB; indent?: number; gap?: number } = {}) {
    const size = o.size ?? 10;
    const font = o.bold ? this.bold : this.font;
    const indent = o.indent ?? 0;
    for (const line of this.wrap(str, font, size, CONTENT_W - indent)) {
      this.ensure(size + 4);
      this.page.drawText(line, { x: M + indent, y: this.y - size, size, font, color: color(o.color ?? C.ink) });
      this.y -= size + 4;
    }
    this.y -= o.gap ?? 0;
  }

  heading(str: string) {
    // Keep the heading with at least a table header and a couple of rows.
    this.ensure(110);
    this.y -= 14;
    this.page.drawRectangle({ x: M, y: this.y - 18, width: 3, height: 18, color: color(C.brand) });
    this.page.drawText(winAnsi(str), { x: M + 10, y: this.y - 14, size: 13, font: this.bold, color: color(C.ink) });
    this.y -= 28;
  }

  bullets(items: string[], indent = 10) {
    for (const item of items) {
      const lines = this.wrap(item, this.font, 9, CONTENT_W - indent - 10);
      lines.forEach((line, i) => {
        this.ensure(13);
        if (i === 0)
          this.page.drawText("•", { x: M + indent, y: this.y - 9, size: 9, font: this.font, color: color(C.brand) });
        this.page.drawText(line, { x: M + indent + 10, y: this.y - 9, size: 9, font: this.font, color: color(C.ink) });
        this.y -= 13;
      });
    }
  }

  badge(label: string, x: number, yTop: number) {
    const ok = isOnTrack(label);
    const text = winAnsi(label || "–");
    const size = 7.5;
    const w = this.bold.widthOfTextAtSize(text, size) + 10;
    this.page.drawRectangle({ x, y: yTop - 13, width: w, height: 12, color: color(ok ? C.goodBg : C.warnBg) });
    this.page.drawText(text, { x: x + 5, y: yTop - 10, size, font: this.bold, color: color(ok ? C.good : C.warn) });
  }

  table(cols: Col[], rows: Cell[][]) {
    const size = 8.5;
    const pad = 5;
    const drawHeader = () => {
      this.ensure(22);
      this.page.drawRectangle({ x: M, y: this.y - 18, width: CONTENT_W, height: 18, color: color(C.headBg) });
      let x = M;
      for (const c of cols) {
        const t = winAnsi(c.header);
        const tx = c.align === "right" ? x + c.width - pad - this.bold.widthOfTextAtSize(t, size) : x + pad;
        this.page.drawText(t, { x: tx, y: this.y - 12.5, size, font: this.bold, color: color(C.muted) });
        x += c.width;
      }
      this.y -= 18;
    };
    drawHeader();
    for (const row of rows) {
      const wrapped = row.map((cell, i) =>
        typeof cell === "string" ? this.wrap(cell, this.font, size, cols[i].width - 2 * pad) : [""]
      );
      const h = Math.max(...wrapped.map((l) => l.length)) * (size + 3) + 2 * pad;
      if (this.y - h < M + 20) {
        this.newPage();
        drawHeader();
      }
      let x = M;
      row.forEach((cell, i) => {
        const c = cols[i];
        if (typeof cell !== "string") this.badge(cell.badge, x + pad, this.y - pad + 1);
        else
          wrapped[i].forEach((line, li) => {
            const tx = c.align === "right" ? x + c.width - pad - this.font.widthOfTextAtSize(line, size) : x + pad;
            this.page.drawText(line, { x: tx, y: this.y - pad - size - li * (size + 3) + 1, size, font: this.font, color: color(C.ink) });
          });
        x += c.width;
      });
      this.y -= h;
      this.page.drawLine({ start: { x: M, y: this.y }, end: { x: M + CONTENT_W, y: this.y }, thickness: 0.5, color: color(C.line) });
    }
    this.y -= 6;
  }

  stats(items: { label: string; value: string; unit: string }[]) {
    const gap = 10;
    const w = (CONTENT_W - gap * (items.length - 1)) / items.length;
    this.ensure(64);
    items.forEach((it, i) => {
      const x = M + i * (w + gap);
      this.page.drawRectangle({ x, y: this.y - 56, width: w, height: 56, color: color(C.brandSoft) });
      this.page.drawText(winAnsi(it.label), { x: x + 10, y: this.y - 16, size: 8, font: this.bold, color: color(C.muted) });
      this.page.drawText(winAnsi(it.value), { x: x + 10, y: this.y - 36, size: 16, font: this.bold, color: color(C.ink) });
      this.page.drawText(winAnsi(it.unit), { x: x + 10, y: this.y - 49, size: 8, font: this.font, color: color(C.muted) });
    });
    this.y -= 66;
  }
}

export type IeeaPdfInput = {
  data: IeeaResult;
  payload: Values;
  flowTitle: string;
  mock?: boolean;
};

export async function generateIeeaPdf({ data, payload, flowTitle, mock }: IeeaPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`IEEA ${flowTitle} - ${String(payload.ProjectName ?? "")}`);
  doc.setProducer("SLEB Energy Assessment Demo");
  const w = new Writer(doc, await doc.embedFont(StandardFonts.Helvetica), await doc.embedFont(StandardFonts.HelveticaBold));
  const bi = (getPath(payload, "BuildingData.BuildingInfo") ?? {}) as Values;
  const industry = String(bi.IndustryType ?? "");

  // Title band
  w.page.drawRectangle({ x: 0, y: PAGE_H - 96, width: PAGE_W, height: 96, color: color(C.brand) });
  w.page.drawText("INDUSTRIAL ENERGY EFFICIENCY ASSESSMENT", { x: M, y: PAGE_H - 40, size: 9, font: w.bold, color: rgb(0.8, 0.95, 0.88) });
  w.page.drawText(winAnsi(String(payload.ProjectName ?? "Project")), { x: M, y: PAGE_H - 64, size: 20, font: w.bold, color: rgb(1, 1, 1) });
  w.page.drawText(winAnsi(`${flowTitle} · ${industry} · ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`), {
    x: M,
    y: PAGE_H - 82,
    size: 9.5,
    font: w.font,
    color: rgb(0.85, 0.97, 0.91),
  });
  w.y = PAGE_H - 96 - 20;
  if (mock) w.text("Demo mode: these figures are mock placeholders, not SLEB results.", { size: 9, bold: true, color: C.warn, gap: 4 });

  // Project summary
  w.heading("Project summary");
  const prodUnit = PRODUCTION_UNIT[industry as Industry];
  const summary: [string, string][] = [
    ["Project name", String(payload.ProjectName ?? "")],
    ["Address", `${payload.ProjectAddress ?? ""}, ${payload.ProjectPostalCode ?? ""}, ${payload.ProjectCountry ?? ""}`],
    ["Project status", String(payload.ProjectStatus ?? "")],
    ["Project GFA", `${fmtNum(payload.ProjectGFA)} m²`],
    ["Facility", `${bi.BuildingName ?? ""} (${fmtNum(bi.GFA)} m²)`],
    ["Industry", industry + (bi.ChemicalProductType ? ` (${bi.ChemicalProductType})` : "")],
    ["Avg. monthly production", `${fmtNum(bi.MonthlyProduction)}${prodUnit ? ` ${prodUnit}` : ""}`],
  ];
  if (bi.PrimaryFuelType) summary.push(["Primary fuel", String(bi.PrimaryFuelType)]);
  summary.push(["Systems assessed", ((getPath(payload, "BuildingData.SystemTypes") as string[]) ?? []).join(", ")]);
  w.table([{ header: "Item", width: 150 }, { header: "Value", width: CONTENT_W - 150 }], summary);

  // Totals
  w.heading("Key results");
  const { rows: eRows, total: totalSavings } = energyRows(data.EnergyAnalysisAndRecommendation);
  const totalEnergy = Number(data.TotalEnergyConsumption);
  const savingsPct = totalEnergy > 0 && Number(totalSavings) ? ` (${((Number(totalSavings) / totalEnergy) * 100).toFixed(1)}%)` : "";
  w.stats([
    { label: "TOTAL ENERGY CONSUMPTION", value: fmtNum(data.TotalEnergyConsumption, 0), unit: "GJ / year" },
    { label: "TOTAL CARBON EMISSION", value: fmtNum(data.TotalCarbonEmission, 0), unit: "t CO2e / year" },
    { label: "POTENTIAL ENERGY SAVINGS", value: fmtNum(totalSavings, 0), unit: `GJ / year${savingsPct}` },
  ]);

  // SEC vs BAT
  const sec = data.SpecificEnergyConsumptionBenchmarking;
  if (sec) {
    w.heading("Specific energy consumption vs Best Available Techniques");
    w.table(
      [
        { header: "SEC (baseline)", width: 120, align: "right" },
        { header: "BAT benchmark", width: 120, align: "right" },
        { header: "Unit", width: 140 },
        { header: "Result", width: CONTENT_W - 380 },
      ],
      [[fmtNum(sec.SEC), fmtNum(sec.SECOfBAT), sec.SECUnit ?? "", { badge: sec.SECBenchmarkingResult ?? "" }]]
    );
  }

  // KPI benchmarking
  const kpis = kpiRows(data.KPIBenchmarking, industry);
  if (kpis.length) {
    w.heading("KPI benchmarking");
    w.table(
      [
        { header: "KPI", width: 170 },
        { header: "Unit", width: 95 },
        { header: "Facility", width: 65, align: "right" },
        { header: "BAT", width: 65, align: "right" },
        { header: "Result", width: CONTENT_W - 395 },
      ],
      kpis.map((k) => [k.label, k.unit ?? "", fmtNum(k.value), fmtNum(k.bat), { badge: k.result }])
    );
    const withRecs = kpis.filter((k) => k.recommendations.length);
    if (withRecs.length) {
      w.ensure(50);
      w.text("Recommendations", { bold: true, size: 10, gap: 2 });
      for (const k of withRecs) {
        w.ensure(30);
        w.text(k.label, { bold: true, size: 9, color: C.muted, indent: 4 });
        w.bullets(k.recommendations);
        w.y -= 3;
      }
    }
  }

  // System performance benchmarking
  const sys = systemPerfRows(data.SystemPerformanceBenchmarking);
  if (sys.length) {
    w.heading("System performance benchmarking");
    w.table(
      [
        { header: "System", width: 140 },
        { header: "Metric", width: 135 },
        { header: "Facility", width: 65, align: "right" },
        { header: "BAT", width: 65, align: "right" },
        { header: "Result", width: CONTENT_W - 405 },
      ],
      sys.flatMap((s) =>
        (s.metrics.length ? s.metrics : [{ label: "–", unit: undefined, value: "", bat: "" }]).map((m, i) => [
          i === 0 ? s.name : "",
          m.label + (m.unit ? ` (${m.unit})` : ""),
          fmtNum(m.value),
          fmtNum(m.bat),
          i === 0 ? { badge: s.result } : "",
        ])
      )
    );
  }

  // Energy analysis
  if (eRows.length) {
    w.heading("Energy analysis and savings per system");
    w.table(
      [
        { header: "System", width: 190 },
        { header: "Consumption (GJ/yr)", width: 115, align: "right" },
        { header: "Savings (GJ/yr)", width: 105, align: "right" },
        { header: "Saving %", width: CONTENT_W - 410, align: "right" },
      ],
      eRows.map((r) => {
        const c = Math.abs(Number(r.consumption));
        const pct = c > 0 && Number(r.savings) ? `${((Number(r.savings) / c) * 100).toFixed(1)}%` : "–";
        return [r.name, fmtNum(r.consumption), fmtNum(r.savings), pct];
      })
    );
    w.text(`Total energy savings: ${fmtNum(totalSavings)} GJ/yr (excludes renewable generation and construction site energy).`, {
      size: 8.5,
      color: C.muted,
      gap: 6,
    });
    for (const r of eRows.filter((r) => r.recommendations.length)) {
      w.ensure(30);
      w.text(r.name, { bold: true, size: 9, color: C.muted, indent: 4 });
      w.bullets(r.recommendations);
      w.y -= 3;
    }
  }

  // Water + raw material
  w.heading("Water analysis");
  const water = data.WaterAnalysisAndRecommendation;
  if (water) {
    w.table(
      [{ header: "Water consumption (m³/yr)", width: CONTENT_W / 2, align: "right" }, { header: "Potential savings (m³/yr)", width: CONTENT_W / 2, align: "right" }],
      [[fmtNum(water.WaterConsumption), fmtNum(water.TotalWaterSavings)]]
    );
    w.bullets(toList(water.WaterRecommendation));
  } else w.text("Not applicable for this facility.", { color: C.muted, size: 9.5 });

  w.heading("Raw material analysis");
  const raw = data.RawMaterialAnalysisAndRecommendation;
  if (raw) {
    w.table(
      [{ header: "Raw material consumption (t/yr)", width: CONTENT_W / 2, align: "right" }, { header: "Potential savings (t/yr)", width: CONTENT_W / 2, align: "right" }],
      [[fmtNum(raw.RawMaterialConsumption), fmtNum(raw.TotalRawMaterialSavings)]]
    );
    w.bullets(toList(raw.RawMaterialRecommendation));
  } else w.text("Not applicable for this facility.", { color: C.muted, size: 9.5 });

  // Footer on every page
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: 36 }, end: { x: PAGE_W - M, y: 36 }, thickness: 0.5, color: color(C.line) });
    p.drawText("Generated from SLEB IEEA API results", { x: M, y: 24, size: 7.5, font: w.font, color: color(C.muted) });
    const t = `Page ${i + 1} of ${pages.length}`;
    p.drawText(t, { x: PAGE_W - M - w.font.widthOfTextAtSize(t, 7.5), y: 24, size: 7.5, font: w.font, color: color(C.muted) });
  });

  return doc.save();
}
