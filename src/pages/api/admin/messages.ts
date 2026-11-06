import type { APIRoute } from "astro";
import { readAdminPost } from "../../../server/admin";
import { isMessageAction, updateMessage } from "../../../server/studio-messages";
import { replyId, replyToMessage } from "../../../server/studio-replies";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const form = await readAdminPost(context, "messages");
  if (form instanceof Response) return form;
  const id = form.get("id");
  const action = form.get("action");
  if (typeof id !== "string" || !replyId.test(id) || (!isMessageAction(action) && action !== "reply")) {
    return new Response("Bad request", { status: 400 });
  }
  const db = context.locals.studioMessages;
  if (!db) return new Response("Unavailable", { status: 503 });

  const params = new URLSearchParams();
  if (form.get("view") === "archive") params.set("view", "archive");
  try {
    if (action === "reply") {
      const requestId = form.get("requestId");
      const body = form.get("body");
      if (typeof requestId !== "string" || !replyId.test(requestId) || typeof body !== "string" || !body.trim() || body.length > 5000) {
        return new Response("Bad request", { status: 400 });
      }
      params.set("message", await replyToMessage(db, id, requestId, body.trim()));
      params.set("open", id);
    } else {
      params.set("message", await updateMessage(db, id, action) ? "updated" : "missing");
    }
  } catch {
    params.set("message", "error");
  }
  return context.redirect(`/studio/messages?${params}`, 303);
};
