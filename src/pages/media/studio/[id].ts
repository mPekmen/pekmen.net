import type { APIRoute } from "astro";
import { serveCover } from "../../../server/studio-content";

export const GET: APIRoute = ({ locals, params }) => serveCover(locals.studioMessages, params.id ?? "");
