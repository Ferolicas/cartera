import argon2 from "argon2";
import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/http";
import {
  clearLoginRateLimit,
  loginRateLimit,
  requestAddress,
} from "@/lib/rate-limit";
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/session";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: "Origen de solicitud no permitido" },
      { status: 403 },
    );
  }

  const address = requestAddress(request);
  const limit = loginRateLimit(address);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera unos minutos." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Contraseña no válida" }, { status: 400 });
  }

  const hash = process.env.PASSWORD_HASH;
  if (!hash) {
    console.error("PASSWORD_HASH no está configurado");
    return NextResponse.json(
      { error: "El acceso no está configurado" },
      { status: 503 },
    );
  }

  let valid = false;
  try {
    valid = await argon2.verify(hash, parsed.data.password);
  } catch (error) {
    console.error("No se pudo verificar la contraseña", error);
  }

  if (!valid) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  clearLoginRateLimit(address);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    SESSION_COOKIE,
    await createSessionToken(),
    sessionCookieOptions,
  );
  return response;
}
