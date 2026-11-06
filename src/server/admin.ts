import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { APIContext } from "astro";
import { site } from "../data/site";
import { env, hasEnv } from "./env";

export const ADMIN_COOKIE = "pekmen_admin";
export const ADMIN_LOGIN_COOKIE = "pekmen_admin_login";

/** Sessions stay valid for twelve hours, then the panel asks again. */
const SESSION_MS = 12 * 60 * 60 * 1000;
const LOGIN_MS = 10 * 60 * 1000;
type TokenPurpose = "session" | "login";

export function isAdminConfigured(): boolean {
  const key = env("ADMIN_SESSION_SECRET");
  return hasEnv("ADMIN_PASSWORD") && /^[a-f0-9]{64}$/i.test(key) &&
    key.toLowerCase() !== env("ADMIN_PASSWORD").toLowerCase();
}

function sign(purpose: string, value: string): Buffer {
  return createHmac("sha256", Buffer.from(env("ADMIN_SESSION_SECRET"), "hex"))
    .update(purpose).update("\0").update(value).digest();
}

/** Compares two values without leaking their length or timing. */
function safeEqual(a: string, b: string): boolean {
  const left = sign("password", a);
  const right = sign("password", b);

  return left.length === right.length && timingSafeEqual(left, right);
}

export function checkPassword(input: string): boolean {
  if (!isAdminConfigured()) return false;
  if (!input) return false;

  return safeEqual(input, env("ADMIN_PASSWORD"));
}

export function createSessionToken(purpose: TokenPurpose = "session"): string {
  const duration = purpose === "login" ? LOGIN_MS : SESSION_MS;
  const payload = `${Date.now() + duration}.${randomBytes(16).toString("hex")}`;
  return `${payload}.${sign(purpose, payload).toString("hex")}`;
}

export function verifySessionToken(token: string | undefined, purpose: TokenPurpose = "session"): boolean {
  if (!token || !isAdminConfigured()) return false;
  const match = /^(\d{13})\.([a-f0-9]{32})\.([a-f0-9]{64})$/.exec(token);
  if (!match || Number(match[1]) <= Date.now()) return false;
  const [, expires, nonce, signature] = match;
  return timingSafeEqual(Buffer.from(signature!, "hex"), sign(purpose, `${expires}.${nonce}`));
}

export function adminCsrfToken(session: string, action: string): string {
  return sign(`csrf:${action}`, session).toString("hex");
}

export function adminBookingReturn(form: FormData): string {
  return form.get("returnTo") === "appointments" ? "/admin/appointments" : "/admin";
}

export function verifyAdminCsrf(token: FormDataEntryValue | null, session: string, action: string): boolean {
  return typeof token === "string" && /^[a-f0-9]{64}$/.test(token) &&
    timingSafeEqual(Buffer.from(token, "hex"), sign(`csrf:${action}`, session));
}

export function adminPostOrigin(request: Request): boolean {
  const url = new URL(request.url);
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const expected = env("ADMIN_ORIGIN", loopback ? url.origin : site.url);
  const fetchSite = request.headers.get("sec-fetch-site");
  return request.headers.get("origin") === expected &&
    (!fetchSite || fetchSite === "same-origin");
}

export async function readAdminPost(
  context: Pick<APIContext, "request" | "cookies" | "redirect">,
  action: string,
): Promise<FormData | Response> {
  const { request, cookies, redirect } = context;
  if (!adminPostOrigin(request)) return new Response("Forbidden", { status: 403 });

  const login = action === "login";
  const session = cookies.get(login ? ADMIN_LOGIN_COOKIE : ADMIN_COOKIE)?.value;
  if (!session || !verifySessionToken(session, login ? "login" : "session")) {
    return redirect(`/admin?error=${login ? "csrf" : "auth"}`, 303);
  }

  const form = await request.formData().catch(() => null);
  const token = form?.get("csrf");
  if (!form || !verifyAdminCsrf(token ?? null, session, action)) {
    return new Response("Forbidden", { status: 403 });
  }
  return form;
}

export function sessionCookieOptions(url: URL, purpose: TokenPurpose = "session"): {
  httpOnly: true;
  sameSite: "lax";
  path: string;
  secure: boolean;
  maxAge: number;
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: url.protocol === "https:",
    maxAge: (purpose === "login" ? LOGIN_MS : SESSION_MS) / 1000,
  };
}
