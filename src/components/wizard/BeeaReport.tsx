"use client";

export function BeeaReport({ url, fileName, mock }: { url: string; fileName: string; mock: boolean }) {
  return (
    <section className="space-y-4">
      {mock && <MockBanner />}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
        <div>
          <p className="font-semibold text-emerald-900">Your report is ready</p>
          <p className="text-sm text-emerald-800">{fileName}</p>
        </div>
        <div className="flex gap-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-emerald-600 bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
          >
            Open in new tab
          </a>
          <a
            href={url}
            download={fileName}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Download PDF
          </a>
        </div>
      </div>
      <iframe
        src={url}
        title="BEEA report"
        className="h-[80vh] w-full rounded-xl border border-slate-200 bg-white shadow-sm"
      />
    </section>
  );
}

export function MockBanner() {
  return (
    <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <strong>Demo mode:</strong> the live SLEB API is not being called (<code>SLEB_MOCK=1</code>). The results below
      are placeholders that only show the end-to-end flow.
    </p>
  );
}
