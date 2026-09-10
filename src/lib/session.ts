import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "cartera_session";
const ISSUER = "cartera.olcas.app";
const AUDIENCE = "cartera-personal";
const SESSION_SECONDS = 60 * 60 * 24 * 30;

function sessionSecret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("AUTH_SECRET no está configurado correctamente");
  }
  return new TextEncoder().encode(value);
}

export async function createSessionToken() {
  return new SignJWT({ role: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("owner")
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(sessionSecret());
}

export async function verifySessionToken(token?: string) {
  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, sessionSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
      subject: "owner",
    });
    return payload.role === "owner";
  } catch {
    return false;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: SESSION_SECONDS,
  path: "/",
  priority: "high" as const,
};
