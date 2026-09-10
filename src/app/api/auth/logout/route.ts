import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { forbiddenOrigin, isSameOrigin } from "@/lib/http";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

export async function POST(request: Request) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;
  if (!isSameOrigin(request)) return forbiddenOrigin();

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions,
    maxAge: 0,
  });
  return response;
}
