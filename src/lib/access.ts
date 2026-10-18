/** Optional access-code gate (enabled when ACCESS_CODE is set). Shared by proxy and the unlock route. */
export const ACCESS_COOKIE = "sleb_access";

export async function accessToken(code: string) {
  const data = new TextEncoder().encode(`sleb-demo:${code}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}
