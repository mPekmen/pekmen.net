import type { APIRoute } from "astro";
import { ADMIN_COOKIE, verifySessionToken } from "../../../server/admin";
import { readAdminBookings } from "../../../server/admin-bookings";
import { json } from "../../../server/http";

export const prerender = false;

export const GET: APIRoute = async ({ cookies, url }) => {
  if (!verifySessionToken(cookies.get(ADMIN_COOKIE)?.value)) {
    return json({ ok: false, error: "auth" }, 401);
  }

  const snapshot = await readAdminBookings(url.searchParams.get("refresh") === "1");
  if (snapshot.state !== "ready") {
    return json({ ok: false, error: snapshot.state }, snapshot.state === "unconfigured" ? 503 : 502);
  }
  return json({ ok: true, signature: snapshot.signature, checkedAt: snapshot.checkedAt });
};
