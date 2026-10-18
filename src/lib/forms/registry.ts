import type { FlowSchema } from "./engine";
import { beeaInOperation, beeaNewDev, beeaRetrofit } from "./beea";
import { ieeaExisting, ieeaNewDev } from "./ieea";

const SCHEMAS: Record<string, FlowSchema> = Object.fromEntries(
  [beeaNewDev, beeaRetrofit, beeaInOperation, ieeaNewDev, ieeaExisting].map((s) => [s.key, s])
);

export function getSchema(family: string, flowId: string): FlowSchema | undefined {
  return SCHEMAS[`${family}/${flowId}`];
}
