import type { APIRoute } from "astro";
import { readAdminPost } from "../../../server/admin";
import { isMessageAction, updateMessage } from "../../../server/studio-messages";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const form = await readAdminPost(context, "messages");
  if (form instanceof Response) return form;
  const id = form.get("id");
  const action = form.get("action");
  if (typeof id !== "string" || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(id) || !isMessageAction(action)) {
    return new Response("Bad request", { status: 400 });
  }
  const db = context.locals.studioMessages;
  if (!db) return new Response("Unavailable", { status: 503 });

  const params = new URLSearchParams();
  if (form.get("view") === "archive") params.set("view", "archive");
  try {
    params.set("message", await updateMessage(db, id, action) ? "updated" : "missing");
  } catch {
    params.set("message", "error");
  }
  return context.redirect(`/admin/messages?${params}`, 303);
};
