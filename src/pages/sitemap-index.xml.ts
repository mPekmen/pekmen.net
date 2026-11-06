import type { APIRoute } from "astro";
import { site } from "../data/site";
import { LANGS } from "../i18n/languages";
import { localePath } from "../i18n/locale";

import { publicProjects, publicPosts } from "../server/studio-content";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const projects = await publicProjects(locals.studioMessages);
  const posts = await publicPosts(locals.studioMessages);
  const base = site.url.replace(/\/$/, "");
  const paths = [
    "/",
    "/about/",
    "/projects/",
    "/blog/",
    "/contact/",
    "/appointment/",
    "/privacy/",
    "/terms/",
    ...projects.map((project) => `/projects/${project.slug}/`),
    ...posts.map((post) => `/blog/${post.slug}/`),
  ];

  const urls = paths.flatMap((path) => {
    const priority = path === "/" ? "1.0" : path === "/about/" ? "0.8" : "0.7";
    const alternates = [
      ...LANGS.map(
        (lang) =>
          `    <xhtml:link rel="alternate" hreflang="${lang}" href="${base}${localePath(lang, path)}" />`,
      ),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${base}${localePath("en", path)}" />`,
    ].join("\n");

    return LANGS.map(
      (lang) =>
        `  <url>\n    <loc>${base}${localePath(lang, path)}</loc>\n${alternates}\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
    );
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": locals.studioMessages ? "no-store" : "public, max-age=3600",
    },
  });
};
