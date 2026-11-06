import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";
import type { APIContext, MiddlewareNext } from "astro";
import { DEFAULT_LANG, isLang } from "./i18n/languages";
import { normalisePath } from "./i18n/locale";
import type { StudioDatabase } from "./server/studio-messages";

/**
 * English lives at the unprefixed URL; Turkish and German live under `/tr/`
 * and `/de/`. The pages themselves are language-agnostic and read the active
 * locale from `Astro.locals.lang`, so localized requests are rewritten to the
 * unprefixed route without changing the address in the browser.
 */

/** Pages that were merged into other routes and have no direct replacement. */
const LEGACY_PAGES = new Map<string, string>([["lab", "/"]]);

/** Posts that were removed; the blog index is the closest replacement. */
const REMOVED_POSTS = new Set(["az-javascript", "tek-kisilik-ekip", "sessiz-arayuz"]);

/** Posts whose slug changed; the old URL keeps pointing at the new one. */
const RENAMED_POSTS = new Map<string, string>([
  ["cfmoto-450sr-10000-km", "cfmoto-450sr-25854-km"],
]);

/** Language-neutral routes that must never receive a locale prefix. */
const NEUTRAL_ROUTES = new Set(["api", "admin"]);

/**
 * Headers every response carries. HSTS is safe here: the site is HTTPS-only
 * behind Cloudflare and `includeSubDomains` matches the zone.
 */
const HEADER_CSP =
  "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'";

const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  // frame-ancestors and friends cannot live in the CSP <meta> Astro emits,
  // so they travel as a second, header-only policy.
  "Content-Security-Policy": HEADER_CSP,
};

function redirectTo(pathname: string, search: string, origin: string): Response {
  return new Response(null, {
    status: 301,
    headers: { Location: new URL(`${pathname}${search}`, origin).toString() },
  });
}

function handle(context: APIContext, next: MiddlewareNext): Response | Promise<Response> {
  const { pathname, search, origin } = context.url;
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return next();

  const [first, ...rest] = segments;

  if (NEUTRAL_ROUTES.has(first!)) return next();

  const locale = isLang(first) ? first : null;
  let target = locale ? rest : segments;
  let moved = false;

  // `/tr/api/...` and `/tr/admin/...` belong to the language-neutral routes.
  if (locale && NEUTRAL_ROUTES.has(target[0]!)) {
    return redirectTo(`/${rest.join("/")}`, search, origin);
  }

  if (target.length > 0 && LEGACY_PAGES.has(target[0]!)) {
    const replacement = LEGACY_PAGES.get(target[0]!)!;
    target = replacement === "/" ? [] : [replacement];
    moved = true;
  }

  // Tag archives were dropped; the blog index is the closest replacement.
  if (target[0] === "blog" && target[1] === "tag") {
    target = ["blog"];
    moved = true;
  }

  // Renamed posts keep their old URL working.
  if (target[0] === "blog" && target[1] && RENAMED_POSTS.has(target[1])) {
    target = ["blog", RENAMED_POSTS.get(target[1])!];
    moved = true;
  }

  // Removed posts keep their URLs working by pointing at the blog index.
  if (target[0] === "blog" && target[1] && REMOVED_POSTS.has(target[1])) {
    target = ["blog"];
    moved = true;
  }

  if (moved) {
    const prefix = locale && locale !== DEFAULT_LANG ? `/${locale}` : "";
    return redirectTo(
      normalisePath(`${prefix}/${target.join("/")}`),
      search,
      origin,
    );
  }

  // `/en/...` is not canonical — English is served without a prefix.
  if (locale === DEFAULT_LANG) {
    return redirectTo(normalisePath(`/${target.join("/")}`), search, origin);
  }

  if (!locale) return next();

  // Render the unprefixed page at the localized URL.
  context.locals.lang = locale;
  return context.rewrite(
    new URL(`${normalisePath(`/${rest.join("/")}`)}${search}`, origin),
  );
}

/** Admin and API responses must never be stored or indexed. */
function isPrivate(pathname: string): boolean {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/api/")
  );
}

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.bookingCoordinator = env.BOOKING_COORDINATOR;
  context.locals.studioMessages = (env as typeof env & { STUDIO_MESSAGES?: StudioDatabase }).STUDIO_MESSAGES;
  const response = await handle(context, next);
  const headers = new Headers(response.headers);

  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(name)) headers.set(name, value);
  }

  // Astro emits its own CSP header for HTML pages; add the directives that
  // only make sense in a header (frame-ancestors) as a second policy.
  const csp = headers.get("Content-Security-Policy");
  if (csp && !csp.includes("frame-ancestors")) {
    headers.set("Content-Security-Policy", `${csp}, ${HEADER_CSP}`);
  }

  if (isPrivate(context.url.pathname)) {
    headers.set("Cache-Control", "no-store");
    headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  // 204/304 must not carry a body; passing one would throw.
  const body =
    response.status === 204 || response.status === 304 ? null : response.body;

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
