import { projects as baselineProjects, type Project } from "../data/projects";
import { posts as baselinePosts, type Post } from "../data/posts";
import { LANGS, type Lang } from "../i18n/languages";
import type { StudioDatabase } from "./studio-messages";

export type Localized = Record<Lang, string>;
export type ContentKind = "project" | "post" | "site";
export const siteIntro: Localized = {
  en: "I build digital products.", tr: "Dijital ürünler geliştiriyorum.", de: "Ich baue digitale Produkte.",
};
export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const reservedPostSlugs = new Set(["tag", "cfmoto-450sr-10000-km", "az-javascript", "tek-kisilik-ekip", "sessiz-arayuz"]);
export const projectImages = ["/projects/boyaci.webp", "/projects/barber.webp", "/projects/pekmen-net.webp"];
const uploadPath = /^\/media\/studio\/[a-f0-9-]{36}$/;
const baseline = { project: baselineProjects, post: baselinePosts };
export type ContentRow = {
  kind: ContentKind; slug: string; draft: string; published: string | null; hidden: number; revision: string;
};

export function original(kind: ContentKind, slug: string) {
  return kind === "site" ? siteIntro : baseline[kind].find((item) => item.slug === slug);
}

export async function contentRows(db: StudioDatabase, kind: ContentKind) {
  return (await db.prepare("SELECT * FROM studio_content WHERE kind = ? ORDER BY slug")
    .bind(kind).all<ContentRow>()).results;
}

export async function contentRow(db: StudioDatabase, kind: ContentKind, slug: string) {
  return db.prepare("SELECT * FROM studio_content WHERE kind = ? AND slug = ?")
    .bind(kind, slug).first<ContentRow>();
}

async function published<T extends { slug: string }>(db: StudioDatabase | undefined, kind: "project" | "post", source: T[]) {
  if (!db) return source;
  const items = new Map(source.map((item) => [item.slug, item]));
  const { results } = await db.prepare(
    "SELECT slug, published, hidden FROM studio_content WHERE kind = ? AND (published IS NOT NULL OR hidden = 1)",
  ).bind(kind).all<Pick<ContentRow, "slug" | "published" | "hidden">>();
  for (const row of results) {
    if (row.hidden) items.delete(row.slug);
    else if (row.published) items.set(row.slug, JSON.parse(row.published) as T);
  }
  return [...items.values()];
}

export async function publicProjects(db?: StudioDatabase) {
  return (await published(db, "project", baselineProjects)).slice()
    .sort((a, b) => Number(b.year) - Number(a.year))
    .map((item, i) => ({ ...item, index: String(i + 1).padStart(2, "0") }));
}

export async function publicPosts(db?: StudioDatabase) {
  return (await published(db, "post", baselinePosts)).slice().sort((a, b) => b.date.localeCompare(a.date));
}

export async function publicIntro(db?: StudioDatabase): Promise<Localized> {
  if (!db) return siteIntro;
  const row = await contentRow(db, "site", "home");
  return row?.published ? JSON.parse(row.published) as Localized : siteIntro;
}

function field(form: FormData, name: string, max: number, required = true) {
  const raw = form.get(name);
  const value = typeof raw === "string" ? raw.trim() : "";
  if (value.length > max || (required && !value)) throw new RangeError(name);
  return value;
}

function localized(form: FormData, name: string, max: number): Localized {
  return Object.fromEntries(LANGS.map((lang) => [lang, field(form, `${name}.${lang}`, max)])) as Localized;
}

export function readContent(kind: ContentKind, slug: string, form: FormData, previous: unknown) {
  if (kind === "site") return localized(form, "intro", 160);
  const tags = field(form, "tags", 300, false).split(",").map((tag) => tag.trim()).filter(Boolean);
  if (kind === "post") {
    const date = field(form, "date", 10);
    const time = new Date(date + "T00:00:00Z");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(+time) || time.toISOString().slice(0, 10) !== date) throw new RangeError("date");
    const prose = localized(form, "body", 30_000);
    const paragraphs = LANGS.map((lang) => prose[lang].split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean));
    const body = Array.from({ length: Math.max(...paragraphs.map((p) => p.length)) }, (_, i) =>
      Object.fromEntries(LANGS.map((lang, j) => [lang, paragraphs[j]?.[i] ?? ""])) as Localized);
    return { slug, date, tags, title: localized(form, "title", 140), excerpt: localized(form, "excerpt", 500), body,
      readingMinutes: Math.max(1, Math.ceil(Math.max(...LANGS.map((lang) => prose[lang].split(/\s+/).length)) / 220)) } satisfies Post;
  }
  const old = previous as Project | undefined;
  const year = field(form, "year", 4);
  if (!/^\d{4}$/.test(year)) throw new RangeError("year");
  const image = field(form, "image", 100, false);
  if (image && !projectImages.includes(image) && (!uploadPath.test(image) || old?.image !== image)) throw new RangeError("image");
  const live = field(form, "live", 500, false);
  if (live) {
    try {
      const url = new URL(live);
      if (url.protocol !== "https:" || url.username || url.password) throw new RangeError("live");
    } catch { throw new RangeError("live"); }
  }
  const summary = localized(form, "summary", 500);
  const overview = localized(form, "overview", 4000);
  const cover = form.get("cover");
  const coverAlt = image || (cover instanceof File && cover.size) ? localized(form, "imageAlt", 300)
    : { en: "", tr: "", de: "" };
  return {
    ...old, slug, index: old?.index ?? "", title: field(form, "name", 100), year, tags,
    category: localized(form, "category", 100), role: localized(form, "role", 120), summary, short: summary,
    overview, tagline: localized(form, "tagline", 240), imageAlt: coverAlt,
    sections: old?.sections ?? [], image: image || undefined, live: live || undefined,
    imageCaption: old?.image === image && !(cover instanceof File && cover.size) ? old?.imageCaption : undefined,
    screens: (baselineProjects.find((item) => item.slug === slug)?.screens ?? old?.screens)
      ?.filter((item) => form.getAll("screen").includes(item.src)),
  } satisfies Project;
}

export async function writeContent(db: StudioDatabase, kind: ContentKind, slug: string, revision: string,
  draft: string, action: "save" | "publish" | "archive") {
  const next = crypto.randomUUID();
  const published = action === "publish" ? draft : null;
  const hidden = action === "archive" ? 1 : 0;
  const statement = revision
    ? db.prepare(`UPDATE studio_content SET draft = ?, published = COALESCE(?, published),
        hidden = CASE WHEN ? = 'save' THEN hidden ELSE ? END, revision = ?
        WHERE kind = ? AND slug = ? AND revision = ? RETURNING slug`)
        .bind(draft, published, action, hidden, next, kind, slug, revision)
    : db.prepare(`INSERT INTO studio_content (kind, slug, draft, published, hidden, revision)
        VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING RETURNING slug`)
        .bind(kind, slug, draft, published, hidden, next);
  return Boolean(await statement.first<{ slug: string }>());
}

export async function storeCover(db: StudioDatabase, file: File) {
  if (file.size > 512 * 1024) throw new RangeError("image");
  const data = Buffer.from(await file.arrayBuffer());
  const png = data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = data[0] === 255 && data[1] === 216 && data[2] === 255;
  const webp = data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP";
  const mime = png ? "image/png" : jpeg ? "image/jpeg" : webp ? "image/webp" : null;
  if (!mime) throw new RangeError("image");
  const id = crypto.randomUUID();
  const result = await db.prepare("INSERT INTO studio_media (id, mime, content) VALUES (?, ?, ?)")
    .bind(id, mime, data.toString("base64")).run();
  if (!result.success) throw new Error("Media write failed");
  return `/media/studio/${id}`;
}

export async function serveCover(db: StudioDatabase | undefined, id: string, preview = false) {
  const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex", "X-Content-Type-Options": "nosniff" };
  const missing = () => new Response(null, { status: 404, headers });
  if (!db || !/^[a-f0-9-]{36}$/.test(id)) return missing();
  try {
    if (!preview) {
      const visible = await db.prepare(
        "SELECT 1 FROM studio_content WHERE kind = 'project' AND hidden = 0 AND json_extract(published, '$.image') = ? LIMIT 1",
      ).bind(`/media/studio/${id}`).first();
      if (!visible) return missing();
    }
    const row = await db.prepare("SELECT mime, content FROM studio_media WHERE id = ?").bind(id)
      .first<{ mime: string; content: string }>();
    if (!row || !["image/jpeg", "image/png", "image/webp"].includes(row.mime)) return missing();
    return new Response(Uint8Array.from(Buffer.from(row.content, "base64")), {
      headers: { ...headers, "Content-Type": row.mime },
    });
  } catch {
    return new Response(null, { status: 503, headers });
  }
}
