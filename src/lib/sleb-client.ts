import "server-only";

/**
 * Server-side client for the SLEB BEEA & IEEA API.
 * Credentials come from environment variables and never reach the browser.
 * The access token is cached in memory and refreshed on expiry / 401.
 */

const BASE_URL = process.env.SLEB_BASE_URL ?? "https://sleb.sg/slebapi/beea";

type SlebEnvelope<T = unknown> = {
  result?: { errcode?: number; errmsg?: string };
  data?: T;
};

export class SlebError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "SlebError";
    this.status = status;
  }
}

let cachedToken: { value: string; fetchedAt: number } | null = null;
// The docs don't state a token lifetime, so refresh proactively and also on 401.
const TOKEN_TTL_MS = 25 * 60 * 1000;

async function login(): Promise<string> {
  const username = process.env.SLEB_USERNAME;
  const password = process.env.SLEB_PASSWORD;
  if (!username || !password) {
    throw new SlebError(
      "SLEB_USERNAME / SLEB_PASSWORD are not configured on the server.",
      500
    );
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      cache: "no-store",
    });
  } catch (e) {
    throw new SlebError(
      `Could not reach the SLEB API: ${(e as Error).message}`,
      502
    );
  }

  const text = await res.text();
  let body: SlebEnvelope<{ token?: string }> = {};
  try {
    body = JSON.parse(text);
  } catch {
    throw new SlebError(
      `SLEB login returned a non-JSON response (HTTP ${res.status}).`,
      502
    );
  }

  const token = body.data?.token;
  if (!res.ok || body.result?.errcode !== 0 || !token) {
    throw new SlebError(
      `SLEB login failed: ${body.result?.errmsg || `HTTP ${res.status}`}`,
      401
    );
  }
  cachedToken = { value: token, fetchedAt: Date.now() };
  return token;
}

export async function getToken(force = false): Promise<string> {
  if (
    !force &&
    cachedToken &&
    Date.now() - cachedToken.fetchedAt < TOKEN_TTL_MS
  ) {
    return cachedToken.value;
  }
  return login();
}

/** POST a JSON payload to an authenticated SLEB endpoint, retrying once on 401. */
export async function slebPost<T = unknown>(
  path: string,
  payload: unknown
): Promise<SlebEnvelope<T>> {
  const attempt = async (token: string) =>
    fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

  let res: Response;
  try {
    res = await attempt(await getToken());
    if (res.status === 401) res = await attempt(await getToken(true));
  } catch (e) {
    if (e instanceof SlebError) throw e;
    throw new SlebError(
      `Could not reach the SLEB API: ${(e as Error).message}`,
      502
    );
  }

  const text = await res.text();
  let body: SlebEnvelope<T>;
  try {
    body = JSON.parse(text);
  } catch {
    throw new SlebError(
      `SLEB returned a non-JSON response (HTTP ${res.status}): ${text.slice(0, 200)}`,
      502
    );
  }

  if (!res.ok || (body.result && body.result.errcode !== 0)) {
    throw new SlebError(
      body.result?.errmsg || `SLEB request failed (HTTP ${res.status}).`,
      res.ok ? 422 : res.status
    );
  }
  return body;
}
