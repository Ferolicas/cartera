type Attempt = { count: number; resetAt: number };

const globalForRateLimit = globalThis as unknown as {
  carteraLoginAttempts?: Map<string, Attempt>;
};

const attempts =
  globalForRateLimit.carteraLoginAttempts ?? new Map<string, Attempt>();

if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.carteraLoginAttempts = attempts;
}

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function loginRateLimit(key: string) {
  const now = Date.now();
  const current = attempts.get(key);

  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function clearLoginRateLimit(key: string) {
  attempts.delete(key);
}

export function requestAddress(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
