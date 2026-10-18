"use client";

import {
  getPath,
  resolve,
  serialize,
  validateStep,
  visibleFields,
  visibleSteps,
  type FieldDef,
  type FlowSchema,
  type Values,
} from "@/lib/forms/engine";

function display(field: FieldDef, value: unknown, values: Values) {
  if (field.type === "toggle") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (value === undefined || value === null || String(value).trim() === "")
    return field.type === "select" && field.emptyOption ? field.emptyOption : "—";
  const unit = resolve(field.unit, values);
  return unit ? `${value} ${unit}` : String(value);
}

export function ReviewStep({
  schema,
  values,
  onEdit,
}: {
  schema: FlowSchema;
  values: Values;
  onEdit: (stepId: string) => void;
}) {
  const steps = visibleSteps(schema, values);
  const payload = serialize(schema, values);

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">Check your inputs before submitting. Click Edit to change a section.</p>
      {steps.map((step) => {
        const errors = validateStep(step, values);
        const fields = visibleFields(step, values);
        return (
          <section key={step.id} className="overflow-hidden rounded-xl border border-slate-200">
            <header className="flex items-center justify-between bg-slate-50 px-4 py-2.5">
              <h3 className="text-sm font-semibold text-slate-800">
                {step.title}
                {Object.keys(errors).length > 0 && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    {Object.keys(errors).length} to fix
                  </span>
                )}
              </h3>
              <button
                type="button"
                onClick={() => onEdit(step.id)}
                className="text-sm font-medium text-emerald-700 hover:underline"
              >
                Edit
              </button>
            </header>
            {fields.length ? (
              <dl className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0">
                {fields.map((f) => (
                  <div key={f.name} className="flex justify-between gap-4 border-slate-100 px-4 py-2 text-sm sm:border-b">
                    <dt className="text-slate-500">{f.label}</dt>
                    <dd className={`text-right font-medium ${errors[f.name] ? "text-red-600" : "text-slate-900"}`}>
                      {errors[f.name] ? errors[f.name] : display(f, getPath(values, f.name), values)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="px-4 py-3 text-sm text-slate-500">No inputs.</p>
            )}
          </section>
        );
      })}
      <details className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium text-slate-700">Show request JSON sent to SLEB</summary>
        <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-emerald-100">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </details>
    </div>
  );
}
