"use client";

import { get, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { describeRange, resolve, type FieldDef, type Values } from "@/lib/forms/engine";

const inputCls =
  "block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

export function FieldInput({
  field,
  values,
  register,
  errors,
}: {
  field: FieldDef;
  values: Values;
  register: UseFormRegister<Values>;
  errors: FieldErrors<Values>;
}) {
  const error = get(errors, field.name)?.message as string | undefined;
  const unit = resolve(field.unit, values);
  const range = resolve(field.range, values);
  const id = `f-${field.name.replace(/\./g, "-")}`;
  const border = error ? "border-red-400" : "border-slate-300";
  const describedBy = `${id}-hint`;

  const hint = [
    range && (field.type === "number" || field.type === "int") ? `Range ${describeRange(range)}` : undefined,
    field.help,
  ]
    .filter(Boolean)
    .join(" · ");

  if (field.type === "toggle") {
    return (
      <div className={field.wide ? "sm:col-span-2" : undefined}>
        <label
          htmlFor={id}
          className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 transition hover:border-emerald-400 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50/50"
        >
          <input id={id} type="checkbox" className="peer sr-only" {...register(field.name)} />
          <span
            aria-hidden
            className="relative mt-0.5 h-5 w-9 shrink-0 rounded-full bg-slate-300 transition after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition peer-checked:bg-emerald-600 peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500/40"
          />
          <span>
            <span className="block text-sm font-medium text-slate-800">{field.label}</span>
            {field.help && <span className="block text-xs text-slate-500">{field.help}</span>}
          </span>
        </label>
      </div>
    );
  }

  if (field.type === "multiselect") {
    const options = resolve(field.options ?? [], values);
    return (
      <fieldset className="sm:col-span-2" aria-describedby={error ? `${id}-err` : undefined}>
        <legend className="mb-2 text-sm font-medium text-slate-800">
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((opt) => (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition hover:border-emerald-400 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50"
            >
              <input
                type="checkbox"
                value={opt}
                className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                {...register(field.name)}
              />
              {opt}
            </label>
          ))}
        </div>
        {error && (
          <p id={`${id}-err`} className="mt-2 text-xs font-medium text-red-600">
            {error}
          </p>
        )}
      </fieldset>
    );
  }

  return (
    <div className={field.wide ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between gap-2 text-sm font-medium text-slate-800">
        <span>
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </span>
        {unit && <span className="shrink-0 text-xs font-normal text-slate-500">{unit}</span>}
      </label>
      {field.type === "select" ? (
        <select
          id={id}
          className={`${inputCls} ${border}`}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          {...register(field.name)}
        >
          <option value="">{field.emptyOption ?? "Select…"}</option>
          {resolve(field.options ?? [], values).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type="text"
          inputMode={field.type === "text" ? "text" : field.type === "int" ? "numeric" : "decimal"}
          autoComplete="off"
          className={`${inputCls} ${border}`}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          {...register(field.name)}
        />
      )}
      <p id={describedBy} className={`mt-1 text-xs ${error ? "font-medium text-red-600" : "text-slate-500"}`}>
        {error ?? (hint || " ")}
      </p>
    </div>
  );
}
