import type { APIRoute } from "astro";
import { ADMIN_COOKIE, readAdminPost } from "../../../server/admin";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const { cookies, redirect } = context;
  const form = await readAdminPost(context, "logout");
  if (form instanceof Response) return form;
  cookies.delete(ADMIN_COOKIE, { path: "/" });

  return redirect("/admin", 303);
};
