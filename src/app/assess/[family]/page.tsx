import Link from "next/link";
import { notFound } from "next/navigation";
import { FAMILIES, getFlows, isFamily } from "@/lib/catalog";

export function generateStaticParams() {
  return [{ family: "beea" }, { family: "ieea" }];
}

export default async function FamilyPage({
  params,
}: {
  params: Promise<{ family: string }>;
}) {
  const { family } = await params;
  if (!isFamily(family)) notFound();

  const info = FAMILIES[family];
  const flows = getFlows(family);

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-14">
      <Link href="/" className="text-sm font-medium text-slate-500 hover:text-emerald-700">
        ← Back
      </Link>

      <header className="mb-10 mt-6">
        <h1 className="text-3xl font-semibold text-slate-900">{info.name}</h1>
        <p className="mt-1 text-slate-600">{info.fullName}</p>
        <p className="mt-6 text-sm font-medium uppercase tracking-wide text-slate-500">
          Select the project type
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {flows.map((flow) => (
          <Link
            key={flow.id}
            href={`/assess/${family}/${flow.id}`}
            className="group flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-500 hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-slate-900">{flow.title}</h2>
            <p className="mt-2 flex-1 text-sm text-slate-600">{flow.description}</p>
            <div className="mt-5 flex items-center justify-between text-xs">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                {flow.output === "pdf" ? "PDF report" : "Results + PDF"}
              </span>
              <span className="font-semibold text-emerald-700">Start →</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
