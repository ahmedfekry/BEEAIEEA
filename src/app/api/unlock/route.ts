import { NextResponse } from "next/server";
import { ACCESS_COOKIE, accessToken } from "@/lib/access";

export async function POST(request: Request) {
  const code = process.env.ACCESS_CODE;
  if (!code) return NextResponse.json({ ok: true });
  const body = await request.json().catch(() => ({}));
  if (typeof body.code !== "string" || body.code !== code)
    return NextResponse.json({ error: "Incorrect access code." }, { status: 401 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACCESS_COOKIE, await accessToken(code), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
