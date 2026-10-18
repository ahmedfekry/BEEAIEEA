import { NextResponse } from "next/server";
import { getToken, SlebError } from "@/lib/sleb-client";

// Dev helper: confirms the server can log in to SLEB. Never returns the token itself.
export async function GET() {
  try {
    const token = await getToken(true);
    return NextResponse.json({
      ok: true,
      message: "Login succeeded",
      tokenLength: token.length,
    });
  } catch (e) {
    const err = e as SlebError;
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: err.status ?? 500 }
    );
  }
}
