import type { APIRoute } from "astro";
import { json } from "../../server/http";

export const prerender = false;

/**
 * Uptime probe. It deliberately says nothing about which secrets are set:
 * configuration details are not useful to a visitor and only help an attacker
 * map the deployment.
 */
export const GET: APIRoute = () =>
  json({
    ok: true,
    service: "pekmen",
  });
