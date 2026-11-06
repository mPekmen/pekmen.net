type MetaEnv = Record<string, string | boolean | undefined>;

/**
 * Reads a server-side environment variable.
 *
 * At runtime (Node, Cloudflare) `process.env` wins. During `astro dev`, Vite
 * has already loaded `.env` into `import.meta.env`, so that is used as the
 * fallback. The fallback is dev-only: in a production build `.env` values must
 * not be inlined into the server bundle, where they would be shipped to the
 * host instead of being read from the platform's secret store.
 */
export function env(key: string, fallback = ""): string {
  const runtime =
    typeof process !== "undefined" ? process.env[key] : undefined;

  if (typeof runtime === "string" && runtime.length > 0) {
    return runtime;
  }

  const meta = import.meta as ImportMeta & { env?: MetaEnv };
  const buildTime = meta.env?.DEV ? meta.env?.[key] : undefined;

  if (typeof buildTime === "string" && buildTime.length > 0) {
    return buildTime;
  }

  return fallback;
}

export function envInt(key: string, fallback: number, min = 1): number {
  const raw = env(key).trim();

  if (!raw) {
    return fallback;
  }

  const value = Number(raw);

  if (!Number.isFinite(value) || value < min) {
    return fallback;
  }

  return Math.floor(value);
}

export function hasEnv(key: string): boolean {
  return env(key).trim().length > 0;
}
