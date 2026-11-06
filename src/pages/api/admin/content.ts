import type { APIRoute } from "astro";
import { readAdminPost } from "../../../server/admin";
import { contentRow, original, readContent, reservedPostSlugs, slugPattern, storeCover, writeContent } from "../../../server/studio-content";

export const POST: APIRoute = async (context) => {
  const form = await readAdminPost(context, "content");
  if (form instanceof Response) return form;
  const db = context.locals.studioMessages;
  if (!db) return new Response("Storage unavailable", { status: 503 });
  const kind = form.get("kind");
  const action = form.get("action");
  const slug = kind === "site" ? "home" : form.get("slug");
  const revision = form.get("revision");
  if ((kind !== "project" && kind !== "post" && kind !== "site") ||
    (action !== "save" && action !== "publish" && action !== "archive") ||
    (kind === "site" && action !== "publish") || typeof slug !== "string" || slug.length > 100 ||
    !slugPattern.test(slug) || (kind === "post" && reservedPostSlugs.has(slug)) ||
    typeof revision !== "string") return new Response("Bad request", { status: 400 });

  const section = { project: "projects", post: "content", site: "settings" }[kind];
  const go = (status: string) => context.redirect(`/studio/${section}?${new URLSearchParams({
    ...(kind !== "site" ? { edit: slug } : {}), result: status,
  })}`, 303);
  try {
    const row = await contentRow(db, kind, slug);
    const source = original(kind, slug);
    if ((row?.revision ?? "") !== revision || (form.get("new") === "1" && source)) return go("conflict");
    const previous = row ? JSON.parse(row.draft) : source;
    if (action === "archive" && !previous) return go("invalid");
    const content = action === "archive" ? previous : readContent(kind, slug, form, previous);
    const upload = form.get("cover");
    if (kind === "project" && action !== "archive" && upload instanceof File && upload.size && "image" in content) {
      content.image = await storeCover(db, upload);
    }
    return go(await writeContent(db, kind, slug, revision, JSON.stringify(content), action) ? "saved" : "conflict");
  } catch (error) {
    return go(error instanceof RangeError ? "invalid" : "error");
  }
};
