import { NextResponse, type NextRequest } from "next/server";
import { FLOWS, isFamily } from "@/lib/catalog";
import { ACCESS_COOKIE, accessToken } from "@/lib/access";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Optional access-code gate for public deployments.
  const code = process.env.ACCESS_CODE;
  if (code && pathname !== "/unlock" && pathname !== "/api/unlock") {
    const cookie = request.cookies.get(ACCESS_COOKIE)?.value;
    if (cookie !== (await accessToken(code))) {
      if (pathname.startsWith("/api/"))
        return NextResponse.json({ error: "Access code required." }, { status: 401 });
      const url = new URL("/unlock", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // 2. Unknown /assess/... URLs get a real 404 status (pages stream, so notFound() alone returns 200).
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "assess" && parts.length > 1) {
    const [, family, flow, ...rest] = parts;
    const known =
      isFamily(family) && rest.length === 0 && (flow === undefined || FLOWS.some((f) => f.family === family && f.id === flow));
    if (!known) return NextResponse.rewrite(new URL("/not-found-page", request.url), { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|ico)$).*)"],
};
