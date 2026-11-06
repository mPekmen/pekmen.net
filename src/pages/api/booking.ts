import type { APIRoute } from "astro";
import { bookingConfig, isBookingConfigured } from "../../server/config";
import {
  BookingError,
  getAvailability,
  getMonthAvailability,
  type BookingRequest,
  type BookingConfirmation,
} from "../../server/booking";
import { coordinateBooking } from "../../server/booking-binding";
import { CoordinationError } from "../../server/booking-coordination";
import { GoogleError } from "../../server/google";
import { clientIp, isSameOrigin, json, readRequestObject } from "../../server/http";
import { rateLimit } from "../../server/rate-limit";

export const prerender = false;

export const GET: APIRoute = async ({ request, clientAddress }) => {
  const url = new URL(request.url);
  const action = url.searchParams.get("action") ?? "availability";

  if (action === "ping") {
    return json({
      ok: true,
      service: "pekmen-booking",
    });
  }

  if (action !== "availability" && action !== "month") {
    return json({ ok: false, error: "unknown_action" }, 400);
  }

  if (!isBookingConfigured()) {
    return json({ ok: false, error: "not_configured" }, 503);
  }

  const ip = clientIp(request, clientAddress);

  if (!rateLimit(`availability:${ip}`, 120, 60_000)) {
    return json({ ok: false, error: "rate_limited" }, 429);
  }

  try {
    if (action === "month") {
      const month = url.searchParams.get("month") ?? "";

      return json({
        ok: true,
        month,
        timezone: bookingConfig().timeZone,
        days: await getMonthAvailability(month),
      });
    }

    const date = url.searchParams.get("date") ?? "";
    const slots = await getAvailability(date);

    return json({
      ok: true,
      date,
      timezone: bookingConfig().timeZone,
      slots,
    });
  } catch (error) {
    return errorResponse(error);
  }
};

export const POST: APIRoute = async ({ request, clientAddress, locals }) => {
  if (!isSameOrigin(request)) {
    return json({ ok: false, error: "forbidden" }, 403);
  }

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 32_000) {
    return json({ ok: false, error: "too_large" }, 413);
  }

  if (!isBookingConfigured()) {
    return json({ ok: false, error: "not_configured" }, 503);
  }

  const ip = clientIp(request, clientAddress);

  if (!rateLimit(`book:${ip}`, 10, 10 * 60_000)) {
    return json({ ok: false, error: "rate_limited" }, 429);
  }

  let body: BookingRequest;

  try {
    body = await readRequestObject(request);
  } catch {
    return json({ ok: false, error: "invalid_body" }, 400);
  }

  if (body.action !== undefined && body.action !== "book") {
    return json({ ok: false, error: "unknown_action" }, 400);
  }

  try {
    const event = await coordinateBooking<BookingConfirmation>(locals.bookingCoordinator, { action: "create", input: body });
    return json({ ok: true, event });
  } catch (error) {
    return errorResponse(error);
  }
};

function errorResponse(error: unknown): Response {
  if (error instanceof BookingError || error instanceof CoordinationError) {
    return json({ ok: false, error: error.code }, error.status);
  }

  if (error instanceof GoogleError) {
    return json({ ok: false, error: error.code }, error.status);
  }

  return json({ ok: false, error: "server_error" }, 500);
}
