import type { AstroGlobal } from "astro";
import { DEFAULT_LANG, isLang, type Lang } from "./languages";

/** Anything that can tell us which URL was requested and which locale it maps to. */
type LocaleSource = Pick<AstroGlobal, "locals" | "url" | "originPathname">;

/**
 * Resolves the active locale from a URL: `/` and every unprefixed path are
 * English, `/tr/...` is Turkish and `/de/...` is German.
 */
export function currentLang(url: URL | string): Lang {
  const pathname = typeof url === "string" ? url : url.pathname;
  const first = pathname.split("/").filter(Boolean)[0];
  return isLang(first) ? first : DEFAULT_LANG;
}

/**
 * Locale of the current request. The middleware stores it in `locals` before
 * rewriting `/tr/...` and `/de/...` to their unprefixed routes; `originPathname`
 * is the fallback when a page is rendered without going through the middleware.
 */
export function langOf(astro: LocaleSource): Lang {
  if (isLang(astro.locals.lang)) return astro.locals.lang;

  return currentLang(astro.originPathname || astro.url.pathname);
}

/** Current path without its locale prefix, ready to be rebuilt for any language. */
export function pathOf(astro: LocaleSource): string {
  return normalisePath(stripLang(astro.originPathname || astro.url.pathname));
}

/** Picks the string for a locale — used for attributes the L10n tag cannot fill. */
export function pick(lang: Lang, en: string, tr: string, de: string): string {
  return lang === "tr" ? tr : lang === "de" ? de : en;
}

/** Prefixes an internal path for a locale. English stays unprefixed. */
export function localePath(lang: Lang, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (lang === DEFAULT_LANG) return clean;

  return clean === "/" ? `/${lang}/` : `/${lang}${clean}`;
}

/** Removes the locale prefix so the path can be rebuilt for another language. */
export function stripLang(path: string): string {
  const segments = path.split("/").filter(Boolean);
  if (segments.length > 0 && isLang(segments[0])) segments.shift();

  const rest = `/${segments.join("/")}`;
  return rest === "/" ? "/" : rest;
}

/** Matches the trailing-slash form used by the canonical URLs and sitemap. */
export function normalisePath(path: string): string {
  if (path === "/") return "/";
  if (/\.[a-z0-9]+$/i.test(path)) return path;

  return path.endsWith("/") ? path : `${path}/`;
}

/** Absolute canonical URL for the given locale and path. */
export function canonicalUrl(origin: string, lang: Lang, path: string): string {
  return new URL(localePath(lang, normalisePath(stripLang(path))), origin).toString();
}

/** Every locale variant of a path, ready for `hreflang` tags. */
export function alternates(origin: string, path: string) {
  return (["en", "tr", "de"] as const).map((lang) => ({
    lang,
    href: canonicalUrl(origin, lang, path),
  }));
}
