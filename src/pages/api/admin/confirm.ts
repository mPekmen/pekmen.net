import type { APIRoute } from "astro";
import { adminBookingReturn, readAdminPost } from "../../../server/admin";
import type { ManageResult } from "../../../server/manage";
import { coordinateBooking } from "../../../server/booking-binding";
import { CoordinationError } from "../../../server/booking-coordination";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const { redirect, locals } = context;
  const form = await readAdminPost(context, "confirm");
  if (form instanceof Response) return form;
  const back = adminBookingReturn(form);
  const id = String(form?.get("id") ?? "");

  if (!/^[A-Za-z0-9_-]{5,1024}$/.test(id)) {
    return redirect(`${back}?error=id`, 303);
  }

  try {
    const result = await coordinateBooking<ManageResult>(locals.bookingCoordinator, { action: "confirm", id });

    if (result.already) {
      return redirect(`${back}?ok=already`, 303);
    }

    return redirect(`${back}?ok=confirmed&mail=${result.mailSent ? "1" : "0"}`, 303);
  } catch (error) {
    const code = error instanceof CoordinationError ? error.code : "booking_in_progress";
    return redirect(`${back}?error=${code}`, 303);
  }
};
