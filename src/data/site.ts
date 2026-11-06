export const site = {
  name: "Pekmen",
  fullName: "Mert Pekmen",
  url: "https://pekmen.net",
  email: "contact@pekmen.net",
  location: "Istanbul, Türkiye",
  locationShort: "Istanbul, TR",
  socials: [
    { label: "GitHub", href: "https://github.com/mPekmen" },
    { label: "LinkedIn", href: "https://linkedin.com/in/pekmen" },
    { label: "Instagram", href: "https://instagram.com/mpekmen" },
  ],
} as const;

export type Social = (typeof site.socials)[number];
