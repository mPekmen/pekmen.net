export function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export function isSameOrigin(request: Request): boolean {
  // Browsers label the request; `cross-site` is never a legitimate form post.
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return false;
  }

  const origin = request.headers.get("origin");

  // Same-origin requests from browsers always send Origin for POST; requests
  // without it come from curl, server-to-server calls or older clients.
  if (!origin) return true;

  try {
    const originHost = new URL(origin).host;
    const host =
      request.headers.get("x-forwarded-host") ??
      request.headers.get("host") ??
      new URL(request.url).host;

    return originHost === host;
  } catch {
    return false;
  }
}

export function clientIp(request: Request, platformIp = ""): string {
  // Cloudflare sets this at the edge and overwrites whatever the client sent,
  // so it cannot be spoofed. `x-forwarded-for` is deliberately not consulted:
  // its first entry is client-controlled, which would let anyone bypass the
  // per-IP rate limits by sending a different value on every request.
  const cf = request.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;

  if (platformIp && platformIp !== "unknown") return platformIp;

  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;

  return "unknown";
}

export async function readRequestObject(request: Request): Promise<Record<string, unknown>> {
  const type = request.headers.get("content-type") ?? "";

  if (type.includes("application/json") || type.includes("text/plain")) {
    const body: unknown = await request.json();
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      throw new TypeError("Expected a request object");
    }
    return body as Record<string, unknown>;
  }

  const form = await request.formData();
  return Object.fromEntries(form.entries());
}
