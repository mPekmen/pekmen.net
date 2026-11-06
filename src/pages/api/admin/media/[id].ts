import type { APIRoute } from "astro";
import { ADMIN_COOKIE, verifySessionToken } from "../../../../server/admin";
import { serveCover } from "../../../../server/studio-content";

export const GET: APIRoute = ({ locals, params, cookies }) => {
  if (!verifySessionToken(cookies.get(ADMIN_COOKIE)?.value)) return new Response(null, { status: 401 });
  return serveCover(locals.studioMessages, params.id ?? "", true);
};
