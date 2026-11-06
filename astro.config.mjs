import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: "https://pekmen.net",
  output: "server",
  adapter: cloudflare({
    // Images are served from public/ as plain <img> tags, so no
    // Cloudflare Images binding is needed.
    imageService: "passthrough",
  }),
  compressHTML: true,
  security: {
    // Astro hashes the inline scripts and the inlined stylesheet, so the page
    // keeps working without 'unsafe-inline' for scripts. The Cloudflare
    // Web Analytics beacon is injected at the edge, after the build, so its
    // origin has to be listed here.
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self' https://cloudflareinsights.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests",
      ],
      scriptDirective: {
        resources: ["'self'", "https://static.cloudflareinsights.com"],
      },
    },
  },
  build: {
    // One less render-blocking request; the sheet is small enough to inline.
    inlineStylesheets: "always",
  },
  server: {
    port: 3000,
  },
  preview: {
    port: 3000,
  },
  markdown: {
    shikiConfig: {
      theme: "github-light",
    },
  },
});
