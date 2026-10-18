/**
 * Config-driven form engine shared by the browser (wizard) and the server (API routes).
 *
 * Every field is defined once with its payload path (`name`, dot-separated, exactly the
 * SLEB variable names), type, range, options, and visibility rule. The same definition
 * drives rendering, validation and serialization to the SLEB request JSON.
 */

export type Values = Record<string, unknown>;

export type FieldType =
  | "text"
  | "number" // decimal sent as a string
  | "int" // sent as a JSON integer (only BEEA `Storey`)
  | "select"
  | "toggle" // `{"Yes"}` fields: sent as "Yes" when on, omitted when off
  | "multiselect"; // array of strings (IEEA `SystemTypes`)

export type Range = {
  min?: number;
  max?: number;
  minExclusive?: boolean;
  maxExclusive?: boolean;
  integer?: boolean;
};

type Dyn<T> = T | ((values: Values) => T);

export type FieldDef = {
  /** Dot path in the request payload, e.g. "BuildingData.BuildingInfo.GFA". */
  name: string;
  label: string;
  type: FieldType;
  unit?: Dyn<string | undefined>;
  help?: string;
  /** Applies only while the field is visible. */
  required?: boolean;
  range?: Dyn<Range | undefined>;
  options?: Dyn<readonly string[]>;
  /** Label for the empty option of an optional select (e.g. "None"). */
  emptyOption?: string;
  visibleWhen?: (values: Values) => boolean;
  defaultValue?: unknown;
  sample?: unknown;
  /** Render across the full grid width. */
  wide?: boolean;
};

export type StepDef = {
  id: string;
  title: string;
  description?: string;
  fields: FieldDef[];
  visibleWhen?: (values: Values) => boolean;
};

export type FlowSchema = {
  key: string; // "<family>/<flowId>"
  steps: StepDef[];
  /** Fixed values always written to the payload (ProjectStatus, BuildingType, ...). */
  constants: Record<string, unknown>;
};

// ---------------------------------------------------------------------------
// Path helpers

export function getPath(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const key of path.split(".")) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

export function setPath(obj: Values, path: string, value: unknown) {
  const keys = path.split(".");
  let cur: Record<string, unknown> = obj;
  for (const key of keys.slice(0, -1)) {
    if (cur[key] == null || typeof cur[key] !== "object" || Array.isArray(cur[key])) cur[key] = {};
    cur = cur[key] as Record<string, unknown>;
  }
  cur[keys[keys.length - 1]] = value;
}

export function resolve<T>(v: Dyn<T>, values: Values): T {
  return typeof v === "function" ? (v as (values: Values) => T)(values) : v;
}

// ---------------------------------------------------------------------------
// Visibility

export function isStepVisible(step: StepDef, values: Values) {
  return !step.visibleWhen || step.visibleWhen(values);
}

export function isFieldVisible(field: FieldDef, values: Values) {
  return !field.visibleWhen || field.visibleWhen(values);
}

export function visibleSteps(schema: FlowSchema, values: Values) {
  return schema.steps.filter((s) => isStepVisible(s, values));
}

export function visibleFields(step: StepDef, values: Values) {
  return step.fields.filter((f) => isFieldVisible(f, values));
}

// ---------------------------------------------------------------------------
// Validation

const NUMBER_RE = /^[-+]?(\d+\.?\d*|\.\d+)$/;

function isEmpty(value: unknown) {
  return (
    value === undefined ||
    value === null ||
    value === false ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0)
  );
}

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : String(+n.toPrecision(6));
}

export function describeRange(r: Range | undefined): string | undefined {
  if (!r) return undefined;
  const lo = r.min !== undefined ? `${r.minExclusive ? "(" : "["}${fmt(r.min)}` : "(-∞";
  const hi = r.max !== undefined ? `${fmt(r.max)}${r.maxExclusive ? ")" : "]"}` : "∞)";
  return `${lo}, ${hi}`;
}

/** Returns an error message, or undefined when the value is valid. */
export function validateField(field: FieldDef, value: unknown, values: Values): string | undefined {
  if (isEmpty(value)) {
    if (!field.required) return undefined;
    if (field.type === "multiselect") return "Select at least one option";
    if (field.type === "select") return "Please choose an option";
    return "This field is required";
  }

  switch (field.type) {
    case "toggle":
      return value === true || value === "Yes" ? undefined : "Invalid value";
    case "multiselect": {
      const opts = resolve(field.options ?? [], values);
      if (!Array.isArray(value)) return "Invalid selection";
      const bad = value.find((v) => !opts.includes(String(v)));
      return bad ? `Unknown option "${bad}"` : undefined;
    }
    case "select": {
      const opts = resolve(field.options ?? [], values);
      return opts.includes(String(value)) ? undefined : "Please choose a valid option";
    }
    case "text":
      return String(value).trim().length > 300 ? "Too long (max 300 characters)" : undefined;
    case "number":
    case "int": {
      const s = String(value).trim();
      if (!NUMBER_RE.test(s)) return "Enter a number (digits and an optional decimal point)";
      const n = Number(s);
      const r = resolve(field.range, values);
      if ((field.type === "int" || r?.integer) && !Number.isInteger(n)) return "Enter a whole number";
      if (r) {
        const tooLow = r.min !== undefined && (r.minExclusive ? n <= r.min : n < r.min);
        const tooHigh = r.max !== undefined && (r.maxExclusive ? n >= r.max : n > r.max);
        if (tooLow || tooHigh) return `Must be in range ${describeRange(r)}`;
      }
      return undefined;
    }
  }
}

export type FieldErrors = Record<string, string>;

export function validateStep(step: StepDef, values: Values): FieldErrors {
  const errors: FieldErrors = {};
  for (const f of visibleFields(step, values)) {
    const msg = validateField(f, getPath(values, f.name), values);
    if (msg) errors[f.name] = msg;
  }
  return errors;
}

/** Validates every visible step; returns errors keyed by field name plus the first failing step. */
export function validateAll(schema: FlowSchema, values: Values) {
  const errors: FieldErrors = {};
  let firstStep: string | undefined;
  for (const step of visibleSteps(schema, values)) {
    const e = validateStep(step, values);
    if (Object.keys(e).length && !firstStep) firstStep = step.id;
    Object.assign(errors, e);
  }
  return { errors, firstStep, ok: !firstStep };
}

// ---------------------------------------------------------------------------
// Serialization

/**
 * Builds the SLEB request body from form values (or from an already serialized payload,
 * which makes it safe to re-run on the server). Only known, visible fields are kept.
 */
export function serialize(schema: FlowSchema, values: Values): Values {
  const out: Values = {};
  for (const step of visibleSteps(schema, values)) {
    // Selected IEEA systems are required objects even when every field is left blank.
    if (step.id.startsWith("system:")) setPath(out, step.id.slice("system:".length), {});
    for (const f of visibleFields(step, values)) {
      const v = getPath(values, f.name);
      if (isEmpty(v)) continue;
      switch (f.type) {
        case "toggle":
          setPath(out, f.name, "Yes");
          break;
        case "int":
          setPath(out, f.name, parseInt(String(v).trim(), 10));
          break;
        case "multiselect":
          setPath(out, f.name, (v as unknown[]).map(String));
          break;
        case "number":
          setPath(out, f.name, String(Number(String(v).trim())));
          break;
        default:
          setPath(out, f.name, String(v).trim());
      }
    }
  }
  for (const [path, value] of Object.entries(schema.constants)) setPath(out, path, value);
  return orderPayload(out);
}

/** Project fields first, then BuildingData, so the JSON reads like the spec examples. */
function orderPayload(p: Values): Values {
  const { BuildingData, ...rest } = p;
  return BuildingData === undefined ? rest : { ...rest, BuildingData };
}

// ---------------------------------------------------------------------------
// Defaults and sample data

export function defaultValues(schema: FlowSchema): Values {
  const out: Values = {};
  for (const step of schema.steps)
    for (const f of step.fields) {
      const v =
        f.defaultValue !== undefined
          ? f.defaultValue
          : f.type === "toggle"
            ? false
            : f.type === "multiselect"
              ? []
              : "";
      if (getPath(out, f.name) === undefined) setPath(out, f.name, v);
    }
  return out;
}

/**
 * Sample values for the "Fill sample data" button. Fields that share a name across
 * mutually exclusive variants (e.g. per-industry KPIs) take the sample of the variant
 * that is visible once the unconditional samples are applied.
 */
export function sampleValues(schema: FlowSchema): Values {
  const out = defaultValues(schema);
  const all = schema.steps.flatMap((s) => s.fields.map((f) => ({ f, s })));
  for (const { f } of all) if (!f.visibleWhen && f.sample !== undefined) setPath(out, f.name, f.sample);
  for (let pass = 0; pass < 3; pass++) {
    for (const { f, s } of all) {
      if (!f.visibleWhen || f.sample === undefined) continue;
      if (isStepVisible(s, out) && f.visibleWhen(out)) setPath(out, f.name, f.sample);
    }
  }
  return out;
}
