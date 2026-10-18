import { NextResponse } from "next/server";
import { getFlow } from "@/lib/catalog";
import { serialize, validateAll, type Values } from "@/lib/forms/engine";
import { getSchema } from "@/lib/forms/registry";
import { isMockMode, slebPost, SlebError } from "@/lib/sleb-client";
import { mockBeeaReport, mockIeeaResult } from "@/lib/sleb-mock";

export const maxDuration = 120;

/**
 * POST /api/assess/{family}/{flow}
 * Body: { values } (the wizard's form values). The server re-validates and re-serializes
 * them with the same schema, so only known fields ever reach SLEB.
 * BEEA -> application/pdf bytes. IEEA -> { data } JSON.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/assess/[family]/[flow]">) {
  const { family, flow: flowId } = await ctx.params;
  const flow = getFlow(family, flowId);
  const schema = getSchema(family, flowId);
  if (!flow || !schema) return NextResponse.json({ error: "Unknown assessment type." }, { status: 404 });

  let values: Values;
  try {
    const body = await request.json();
    values = body?.values;
    if (!values || typeof values !== "object") throw new Error();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON: { values: {...} }." }, { status: 400 });
  }

  const check = validateAll(schema, values);
  if (!check.ok) {
    return NextResponse.json(
      { error: "Some fields are invalid.", fieldErrors: check.errors, step: check.firstStep },
      { status: 400 }
    );
  }
  const payload = serialize(schema, values);
  const mock = isMockMode();

  try {
    if (flow.output === "pdf") {
      let pdf: Uint8Array;
      if (mock) {
        pdf = await mockBeeaReport(payload, flow.title);
      } else {
        const res = await slebPost<{ report?: string }>(flow.endpoint, payload);
        const b64 = res.data?.report;
        if (!b64) throw new SlebError("SLEB returned no report.", 502);
        pdf = Buffer.from(b64.replace(/^data:application\/pdf;base64,/, ""), "base64");
        if (Buffer.from(pdf.subarray(0, 5)).toString("latin1") !== "%PDF-")
          throw new SlebError("SLEB returned a report that is not a valid PDF.", 502);
      }
      return new Response(Buffer.from(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${reportFileName(payload, flow.id)}"`,
          "Cache-Control": "no-store",
          "X-Sleb-Mock": mock ? "1" : "0",
        },
      });
    }

    const data = mock
      ? mockIeeaResult(payload, flow.id === "existing")
      : (await slebPost<Record<string, unknown>>(flow.endpoint, payload)).data;
    if (!data) throw new SlebError("SLEB returned no results.", 502);
    return NextResponse.json({ data, mock }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const err = e instanceof SlebError ? e : new SlebError(`Unexpected error: ${(e as Error).message}`, 500);
    // errcode 1 from SLEB surfaces as 422 with SLEB's own message.
    return NextResponse.json({ error: err.message }, { status: err.status >= 400 ? err.status : 502 });
  }
}

function reportFileName(payload: Values, flowId: string) {
  const name = String(payload.ProjectName ?? "project")
    .replace(/[^A-Za-z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return `BEEA-${flowId}-${name || "project"}.pdf`;
}
