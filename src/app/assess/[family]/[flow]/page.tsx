import { Suspense } from "react";
import { notFound } from "next/navigation";
import { FAMILIES, FLOWS, getFlow, isFamily } from "@/lib/catalog";
import { AssessmentWizard } from "@/components/wizard/AssessmentWizard";

export function generateStaticParams() {
  return FLOWS.map((f) => ({ family: f.family, flow: f.id }));
}

// `params` is read inside Suspense so the route shell can render instantly.
export default function FlowPage({ params }: PageProps<"/assess/[family]/[flow]">) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-10 sm:px-6">
      <Suspense fallback={<FlowSkeleton />}>
        <FlowContent params={params} />
      </Suspense>
    </main>
  );
}

async function FlowContent({ params }: { params: Promise<{ family: string; flow: string }> }) {
  const { family, flow: flowId } = await params;
  if (!isFamily(family)) notFound();
  const flow = getFlow(family, flowId);
  if (!flow) notFound();

  return (
    <AssessmentWizard
      family={family}
      flowId={flow.id}
      familyName={FAMILIES[family].name}
      title={flow.title}
    />
  );
}

function FlowSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 w-16 rounded bg-slate-200" />
      <div className="h-8 w-80 rounded bg-slate-200" />
      <div className="h-96 rounded-xl border border-slate-200 bg-white" />
    </div>
  );
}
