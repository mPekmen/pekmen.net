import type { APIRoute } from "astro";
import { adminBookingReturn, readAdminPost } from "../../../server/admin";
import type { ManageResult } from "../../../server/manage";
import { coordinateBooking } from "../../../server/booking-binding";
import { CoordinationError } from "../../../server/booking-coordination";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const { redirect, locals } = context;
  const form = await readAdminPost(context, "reschedule");
  if (form instanceof Response) return form;
  const back = adminBookingReturn(form);
  const id = String(form?.get("id") ?? "");
  const start = String(form?.get("start") ?? "").slice(0, 80);
  const message = String(form?.get("message") ?? "").slice(0, 500);
  const requestId = String(form?.get("requestId") ?? "").slice(0, 80);

  if (!/^[A-Za-z0-9_-]{5,1024}$/.test(id)) {
    return redirect(`${back}?error=id`, 303);
  }

  if (!start) {
    return redirect(`${back}?error=slot`, 303);
  }

  try {
    const result = await coordinateBooking<ManageResult>(locals.bookingCoordinator, { action: "move", id, start, message, requestId });

    return redirect(
      `${back}?ok=rescheduled&mail=${result.already ? "skipped" : result.mailSent ? "1" : "0"}`,
      303
    );
  } catch (error) {
    const code = error instanceof CoordinationError ? error.code : "booking_in_progress";
    return redirect(`${back}?error=${code === "slot_taken" ? "slot" : code}`, 303);
  }
};
