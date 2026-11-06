import type { APIRoute } from "astro";
import { posts } from "../data/posts";
import { site } from "../data/site";

export const prerender = false;

const escape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export const GET: APIRoute = () => {
  const base = site.url.replace(/\/$/, "");

  const items = posts
    .map((post) => {
      const url = `${base}/tr/blog/${post.slug}/`;
      const date = new Date(`${post.date}T09:00:00+03:00`).toUTCString();

      return [
        "    <item>",
        `      <title>${escape(post.title.tr)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${date}</pubDate>`,
        `      <description>${escape(post.excerpt.tr)}</description>`,
        `      <category>${escape(post.tags.join(", "))}</category>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Pekmen — Yazılar</title>
    <link>${base}/tr/blog/</link>
    <description>Hızlı, sade ürünler ve arkalarındaki sistemler üzerine notlar.</description>
    <language>tr</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
