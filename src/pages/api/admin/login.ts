import type { APIRoute } from "astro";
import {
  ADMIN_COOKIE,
  ADMIN_LOGIN_COOKIE,
  checkPassword,
  createSessionToken,
  isAdminConfigured,
  adminPostOrigin,
  readAdminPost,
  sessionCookieOptions,
} from "../../../server/admin";
import { clientIp } from "../../../server/http";
import {
  clearRateLimit,
  isRateLimited,
  rateLimit,
} from "../../../server/rate-limit";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const { request, cookies, redirect, clientAddress, url } = context;
  if (!adminPostOrigin(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  if (!isAdminConfigured()) {
    return redirect("/studio?error=config", 303);
  }

  const ip = clientIp(request, clientAddress || "unknown");
  const key = `admin-login:${ip}`;

  if (isRateLimited(key, 10, 5 * 60_000)) {
    return redirect("/studio?error=rate", 303);
  }

  const form = await readAdminPost(context, "login");
  if (form instanceof Response) return form;
  const password = String(form.get("password") ?? "");

  if (!checkPassword(password)) {
    rateLimit(key, 10, 5 * 60_000);
    return redirect("/studio?error=password", 303);
  }

  clearRateLimit(key);
  cookies.delete(ADMIN_LOGIN_COOKIE, { path: "/" });

  cookies.set(ADMIN_COOKIE, createSessionToken(), sessionCookieOptions(url));

  return redirect("/studio", 303);
};
