export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export const privateJsonHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
};

export function invalidRequest(message = "Los datos enviados no son válidos") {
  return Response.json({ error: message }, { status: 400 });
}

export function forbiddenOrigin() {
  return Response.json({ error: "Origen de solicitud no permitido" }, { status: 403 });
}
