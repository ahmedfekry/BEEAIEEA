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

export function isMockMode() {
  const v = process.env.SLEB_MOCK?.toLowerCase();
  return v === "1" || v === "true";
}

const REQUEST_TIMEOUT_MS = 120_000;
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "User-Agent": "sleb-demo/1.0 (+server)",
};

/** Turns a non-JSON SLEB response into a readable error (Cloudflare challenge, HTML error page, ...). */
function nonJsonError(res: Response, text: string, what: string) {
  if (res.headers.get("cf-mitigated") === "challenge" || /<title>Just a moment/i.test(text)) {
    return new SlebError(
      "The SLEB API is behind a Cloudflare bot challenge, which blocks server-to-server calls " +
        `(HTTP ${res.status}). Ask SLEB to allowlist this server's IP or exempt /slebapi/* from the ` +
        "challenge. To demo without the live API, set SLEB_MOCK=1.",
      502
    );
  }
  return new SlebError(`${what} returned a non-JSON response (HTTP ${res.status}): ${text.slice(0, 200)}`, 502);
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
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ username, password }),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
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
    throw nonJsonError(res, text, "SLEB login");
  }

  const token = body.data?.token;
  if (!res.ok || Number(body.result?.errcode) !== 0 || !token) {
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
      headers: { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

  let res: Response;
  try {
    res = await attempt(await getToken());
    if (res.status === 401) res = await attempt(await getToken(true));
  } catch (e) {
    if (e instanceof SlebError) throw e;
    if ((e as Error).name === "TimeoutError")
      throw new SlebError("The SLEB API did not respond in time. Please try again.", 504);
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
    throw nonJsonError(res, text, "SLEB");
  }

  if (!res.ok || (body.result && Number(body.result.errcode) !== 0)) {
    throw new SlebError(
      body.result?.errmsg || `SLEB request failed (HTTP ${res.status}).`,
      res.ok ? 422 : res.status
    );
  }
  return body;
}
