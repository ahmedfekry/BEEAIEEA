import Link from "next/link";
import { notFound } from "next/navigation";
import { FAMILIES, FLOWS, getFlow, isFamily } from "@/lib/catalog";

export function generateStaticParams() {
  return FLOWS.map((f) => ({ family: f.family, flow: f.id }));
}

// Placeholder: the multi-step form engine is added in the next milestone.
export default async function FlowPage({
  params,
}: {
  params: Promise<{ family: string; flow: string }>;
}) {
  const { family, flow: flowId } = await params;
  if (!isFamily(family)) notFound();
  const flow = getFlow(family, flowId);
  if (!flow) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-14">
      <Link
        href={`/assess/${family}`}
        className="text-sm font-medium text-slate-500 hover:text-emerald-700"
      >
        ← Back
      </Link>
      <h1 className="mt-6 text-3xl font-semibold text-slate-900">
        {FAMILIES[family].name} · {flow.title}
      </h1>
      <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
        The multi-step form for this assessment is coming in the next milestone.
      </div>
    </main>
  );
}
