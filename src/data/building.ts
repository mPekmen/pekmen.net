import type { Localized } from "./projects";

export type BuildStatus = "planning" | "building" | "testing";

export type BuildingEntry = {
  slug: string;
  title: string;
  description: Localized;
  status: BuildStatus;
  visibility: "draft" | "public";
  projectSlug?: string;
};

export const buildStatusLabels: Record<BuildStatus, Localized> = {
  planning: { en: "Planning", tr: "Planlanıyor", de: "In Planung" },
  building: { en: "In development", tr: "Geliştiriliyor", de: "In Entwicklung" },
  testing: { en: "Testing", tr: "Test ediliyor", de: "Im Test" },
};

export const buildingEntries: BuildingEntry[] = [
  {
    slug: "portfolio-showcase",
    title: "pekmen.net",
    description: {
      en: "Improving how this portfolio presents projects, with clearer project pages and room for real product screenshots.",
      tr: "Proje sayfalarını daha anlaşılır hâle getiriyor ve portfolyoda gerçek ürün ekranlarına yer açıyorum.",
      de: "Ich verbessere die Projektseiten dieses Portfolios und gebe echten Produktansichten mehr Platz.",
    },
    status: "building",
    visibility: "public",
    projectSlug: "pekmen-net",
  },
];
