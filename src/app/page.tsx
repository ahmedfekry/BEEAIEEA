import Link from "next/link";
import { FAMILIES, type Family } from "@/lib/catalog";

const ORDER: Family[] = ["beea", "ieea"];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-16">
      <header className="mb-14 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-emerald-700">
          SLEB Smart Hub · Demo
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Energy Efficiency Assessment
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          Choose an assessment type, enter your project data step by step, and
          get a downloadable report.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {ORDER.map((key) => {
          const f = FAMILIES[key];
          return (
            <Link
              key={key}
              href={`/assess/${key}`}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-emerald-500 hover:shadow-lg"
            >
              <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-lg font-bold text-emerald-700">
                {key === "beea" ? "B" : "I"}
              </span>
              <h2 className="text-3xl font-semibold text-slate-900">{f.name}</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">{f.fullName}</p>
              <p className="mt-4 text-slate-600">{f.blurb}</p>
              <ul className="mt-5 space-y-2 text-sm text-slate-600">
                {f.points.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {p}
                  </li>
                ))}
              </ul>
              <span className="mt-8 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 group-hover:gap-2">
                Select {f.name} <span aria-hidden>→</span>
              </span>
            </Link>
          );
        })}
      </section>

      <footer className="mt-auto pt-16 text-center text-xs text-slate-400">
        Demo application. Credentials stay on the server and are never sent to the browser.
      </footer>
    </main>
  );
}
