import { env } from "./env";

type Metric = { label: string; value: number };
const dimensions = { daily: "date", pages: "requestPath", countries: "countryName", devices: "deviceType" } as const;
type Group = keyof typeof dimensions;
type Report = { state: "disconnected" | "unavailable" } |
  { state: "ready"; days: number; groups: Partial<Record<Group, Metric[]>> };

let cached: { key: string; expires: number; result: Promise<Report> } | undefined;

export function readStudioAnalytics(days: 7 | 30): Promise<Report> {
  const token = env("STUDIO_ANALYTICS_TOKEN");
  const account = env("STUDIO_ANALYTICS_ACCOUNT");
  const site = env("STUDIO_ANALYTICS_SITE");
  if (!token || !/^[a-f0-9]{32}$/i.test(account) || !/^[a-f0-9]{32}$/i.test(site)) {
    return Promise.resolve({ state: "disconnected" });
  }
  const now = Date.now();
  const end = new Date(now - 86_400_000).toISOString().slice(0, 10);
  const start = new Date(now - days * 86_400_000).toISOString().slice(0, 10);
  const key = `${account}:${site}:${end}:${days}`;
  if (cached?.key === key && cached.expires > now) return cached.result;
  const result = query(token, account, site, start, end, days);
  cached = { key, expires: now + 60_000, result };
  return result;
}

async function query(token: string, account: string, site: string, start: string, end: string, days: number): Promise<Report> {
  const fields = Object.entries(dimensions).map(([group, dimension]) => `
    ${group}: rumPageloadEventsAdaptiveGroups(
      limit: ${group === "daily" ? days : 10}
      filter: { siteTag: "${site}", requestHost: "pekmen.net", date_geq: "${start}", date_leq: "${end}" }
      orderBy: [${group === "daily" ? "date_ASC" : "sum_visits_DESC"}]
    ) { dimensions { label: ${dimension} } sum { visits } }`).join("\n");
  try {
    const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: `{ viewer { accounts(filter: { accountTag: "${account}" }) { ${fields} } } }` }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return { state: "unavailable" };
    const payload = await response.json() as {
      data?: { viewer?: { accounts?: Partial<Record<Group, unknown>>[] } };
    };
    const accountData = payload.data?.viewer?.accounts?.[0];
    const groups: Partial<Record<Group, Metric[]>> = {};
    for (const group of Object.keys(dimensions) as Group[]) {
      const rows = accountData?.[group];
      if (!Array.isArray(rows)) continue;
      const parsed: Metric[] = [];
      for (const row of rows) {
        const label = row?.dimensions?.label;
        const value = row?.sum?.visits;
        if (typeof label === "string" && typeof value === "number" && Number.isFinite(value) && value >= 0) {
          parsed.push({ label, value });
        }
      }
      if (parsed.length === rows.length) groups[group] = parsed;
    }
    return Object.keys(groups).length ? { state: "ready", days, groups } : { state: "unavailable" };
  } catch {
    return { state: "unavailable" };
  }
}
