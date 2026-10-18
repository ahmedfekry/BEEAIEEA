"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  defaultValues,
  sampleValues,
  serialize,
  validateAll,
  validateStep,
  visibleFields,
  visibleSteps,
  type FieldErrors as EngineErrors,
  type StepDef,
  type Values,
} from "@/lib/forms/engine";
import { getSchema } from "@/lib/forms/registry";
import type { IeeaResult } from "@/lib/ieea-result";
import { FieldInput } from "./FieldInput";
import { ReviewStep } from "./ReviewStep";
import { BeeaReport } from "./BeeaReport";
import { IeeaResults } from "./IeeaResults";

const REVIEW = "review";

/** Zod schema for the step being shown; the rules themselves live in the form engine. */
function stepSchema(step: StepDef | null) {
  return z.record(z.string(), z.unknown()).superRefine((values, ctx) => {
    if (!step) return;
    for (const [name, message] of Object.entries(validateStep(step, values)))
      ctx.addIssue({ code: "custom", path: name.split("."), message });
  });
}

type Result =
  | { kind: "pdf"; url: string; fileName: string; mock: boolean }
  | { kind: "json"; data: IeeaResult; payload: Values; mock: boolean };

type Status = { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string };

export function AssessmentWizard({
  family,
  flowId,
  familyName,
  title,
}: {
  family: string;
  flowId: string;
  familyName: string;
  title: string;
}) {
  const schema = useMemo(() => getSchema(family, flowId)!, [family, flowId]);
  const draftKey = `sleb-draft:${schema.key}`;
  const stepRef = useRef<StepDef | null>(null);

  const form = useForm<Values>({
    defaultValues: defaultValues(schema),
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: ((values, ctx, opts) =>
      zodResolver(stepSchema(stepRef.current))(values, ctx, opts as never)) as Resolver<Values>,
  });
  const { register, watch, reset, trigger, getValues, setError, clearErrors, formState } = form;
  const values = watch();

  const steps = visibleSteps(schema, values);
  const [currentId, setCurrentId] = useState(steps[0].id);
  const [visited, setVisited] = useState<Set<string>>(() => new Set([steps[0].id]));
  const [allUnlocked, setAllUnlocked] = useState(false); // after "Fill sample data"
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [result, setResult] = useState<Result | null>(null);
  const [restored, setRestored] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const ids = [...steps.map((s) => s.id), REVIEW];
  // If the current step disappears (e.g. a system was deselected) fall back to the review step.
  const currentIndex = Math.max(0, ids.indexOf(currentId) === -1 ? ids.length - 1 : ids.indexOf(currentId));
  const current = steps[currentIndex] ?? null; // null => review

  useLayoutEffect(() => {
    stepRef.current = current;
  }, [current]);

  // Restore a saved draft once, then keep saving changes.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        reset({ ...defaultValues(schema), ...JSON.parse(raw) });
        setRestored(true);
      }
    } catch {}
    const sub = watch((v) => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(v));
      } catch {}
    });
    return () => sub.unsubscribe();
  }, [draftKey, reset, schema, watch]);

  // Free the PDF blob URL when the result goes away.
  useEffect(() => {
    return () => {
      if (result?.kind === "pdf") URL.revokeObjectURL(result.url);
    };
  }, [result]);

  function goTo(id: string) {
    setCurrentId(id);
    setVisited((v) => new Set(v).add(id));
    setStatus((s) => (s.kind === "error" ? { kind: "idle" } : s));
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function next() {
    if (!(await trigger())) {
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }
    goTo(ids[currentIndex + 1]);
  }

  function applyErrors(errors: EngineErrors) {
    clearErrors();
    for (const [name, message] of Object.entries(errors)) setError(name, { type: "custom", message });
  }

  async function submit() {
    const vals = getValues();
    const check = validateAll(schema, vals);
    if (!check.ok) {
      applyErrors(check.errors);
      goTo(check.firstStep!);
      return;
    }
    setStatus({ kind: "loading" });
    try {
      const res = await fetch(`/api/assess/${family}/${flowId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: vals }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.fieldErrors && body.step) {
          applyErrors(body.fieldErrors);
          goTo(body.step);
        }
        setStatus({ kind: "error", message: body.error ?? `Request failed (HTTP ${res.status}).` });
        return;
      }
      const mock = res.headers.get("X-Sleb-Mock") === "1";
      if (res.headers.get("Content-Type")?.includes("application/pdf")) {
        const blob = await res.blob();
        const fileName =
          /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? "BEEA-report.pdf";
        setResult({ kind: "pdf", url: URL.createObjectURL(blob), fileName, mock });
      } else {
        const body = await res.json();
        setResult({ kind: "json", data: body.data, payload: serialize(schema, vals), mock: !!body.mock });
      }
      setStatus({ kind: "idle" });
      topRef.current?.scrollIntoView({ block: "start" });
    } catch (e) {
      setStatus({ kind: "error", message: `Could not reach the server: ${(e as Error).message}` });
    }
  }

  function fillSample() {
    reset(sampleValues(schema));
    setAllUnlocked(true);
    setStatus({ kind: "idle" });
  }

  function clearAll() {
    reset(defaultValues(schema));
    try {
      localStorage.removeItem(draftKey);
    } catch {}
    setRestored(false);
    setAllUnlocked(false);
    setResult(null);
    setVisited(new Set([steps[0].id]));
    setCurrentId(steps[0].id);
    setStatus({ kind: "idle" });
  }

  const header = (
    <div ref={topRef} className="scroll-mt-6">
      <Link href={`/assess/${family}`} className="text-sm font-medium text-slate-500 hover:text-emerald-700">
        ← Back
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">{familyName}</p>
          <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
        </div>
        {!result && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={fillSample}
              className="rounded-lg border border-emerald-600 bg-white px-3.5 py-2 text-sm font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-50"
            >
              Fill sample data
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (result) {
    return (
      <div className="space-y-6">
        {header}
        {result.kind === "pdf" ? (
          <BeeaReport url={result.url} fileName={result.fileName} mock={result.mock} />
        ) : (
          <IeeaResults data={result.data} payload={result.payload} flowTitle={title} mock={result.mock} />
        )}
        <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-6">
          <button
            type="button"
            onClick={() => {
              setResult(null);
              goTo(REVIEW);
            }}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            ← Edit inputs
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-700"
          >
            Start a new assessment
          </button>
        </div>
      </div>
    );
  }

  const stepTitle = current ? current.title : "Review & submit";
  const fields = current ? visibleFields(current, values) : [];

  return (
    <div className="space-y-6">
      {header}
      {restored && (
        <p className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-800">
          Restored your previous draft from this browser.{" "}
          <button type="button" onClick={clearAll} className="font-medium underline">
            Start fresh
          </button>
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
        {/* Stepper */}
        <nav aria-label="Steps" className="lg:sticky lg:top-6 lg:self-start">
          <ol className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
            {ids.map((id, i) => {
              const s = steps.find((x) => x.id === id);
              const label = s ? s.title : "Review & submit";
              const active = i === currentIndex;
              const reachable = allUnlocked || visited.has(id) || i <= currentIndex;
              const hasError = s && Object.keys(validateStep(s, values)).length > 0 && (allUnlocked || visited.has(id)) && !active;
              return (
                <li key={id} className="shrink-0">
                  <button
                    type="button"
                    disabled={!reachable}
                    onClick={() => goTo(id)}
                    aria-current={active ? "step" : undefined}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition ${
                      active
                        ? "bg-emerald-600 font-medium text-white shadow-sm"
                        : reachable
                          ? "text-slate-700 hover:bg-white hover:shadow-sm"
                          : "cursor-not-allowed text-slate-400"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        active
                          ? "bg-white/20 text-white"
                          : hasError
                            ? "bg-amber-100 text-amber-700"
                            : reachable
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {hasError ? "!" : i + 1}
                    </span>
                    <span className="whitespace-nowrap lg:whitespace-normal">{label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Step body */}
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (current) next();
            else submit();
          }}
          className="rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 px-6 py-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Step {currentIndex + 1} of {ids.length}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">{stepTitle}</h2>
            {current?.description && <p className="mt-1 text-sm text-slate-600">{current.description}</p>}
          </div>

          <div className="px-6 py-6">
            {current ? (
              fields.length ? (
                <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                  {fields.map((f) => (
                    <FieldInput key={f.name} field={f} values={values} register={register} errors={formState.errors} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Nothing to fill in for this step with the current selections.</p>
              )
            ) : (
              <ReviewStep schema={schema} values={values} onEdit={goTo} />
            )}

            {status.kind === "error" && (
              <div role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <p className="font-semibold">The assessment could not be generated</p>
                <p className="mt-1 whitespace-pre-wrap">{status.message}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              disabled={currentIndex === 0 || status.kind === "loading"}
              onClick={() => goTo(ids[currentIndex - 1])}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={status.kind === "loading"}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-70"
            >
              {status.kind === "loading" && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
              )}
              {current
                ? "Next"
                : status.kind === "loading"
                  ? family === "beea"
                    ? "Generating report…"
                    : "Running assessment…"
                  : family === "beea"
                    ? "Generate PDF report"
                    : "Run assessment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
