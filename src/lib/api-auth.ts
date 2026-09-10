import "server-only";

import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./session";

export async function hasValidSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export async function requireApiSession() {
  if (await hasValidSession()) return null;
  return Response.json({ error: "Sesión no válida" }, { status: 401 });
}
