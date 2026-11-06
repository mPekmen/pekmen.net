import type { APIContext } from "astro";
import { isLang, type Lang } from "../i18n/languages";

export { studioT } from "../i18n/studio-copy";

export const studioSections = {
  overview: { en: "Overview", tr: "Genel bakış", de: "Übersicht" },
  appointments: { en: "Appointments", tr: "Randevular", de: "Termine" },
  messages: { en: "Messages", tr: "Mesajlar", de: "Nachrichten" },
  analytics: { en: "Analytics", tr: "İstatistikler", de: "Statistiken" },
  projects: { en: "Projects", tr: "Projeler", de: "Projekte" },
  content: { en: "Content", tr: "İçerik", de: "Inhalte" },
  settings: { en: "Settings", tr: "Ayarlar", de: "Einstellungen" },
};

export type StudioSection = keyof typeof studioSections;
export const studioPath = (section: StudioSection) => section === "overview" ? "/studio" : `/studio/${section}`;

export function studioLocale({ url, cookies }: Pick<APIContext, "url" | "cookies">): Lang {
  const requested = url.searchParams.get("lang");
  if (requested && isLang(requested)) {
    cookies.set("studio_lang", requested, {
      path: "/studio", sameSite: "lax", httpOnly: true, secure: url.protocol === "https:", maxAge: 31_536_000,
    });
    return requested;
  }
  const stored = cookies.get("studio_lang")?.value;
  return stored && isLang(stored) ? stored : "tr";
}
