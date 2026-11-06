import type { APIRoute } from "astro";
import { ADMIN_COOKIE, adminBookingReturn, readAdminPost, verifyAdminCsrf } from "../../../server/admin";
import type { ManageResult } from "../../../server/manage";
import { coordinateBooking } from "../../../server/booking-binding";
import { CoordinationError } from "../../../server/booking-coordination";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const { cookies, redirect, locals } = context;
  const form = await readAdminPost(context, "cancel");
  if (form instanceof Response) return form;
  const back = adminBookingReturn(form);
  const id = String(form?.get("id") ?? "");
  const message = String(form?.get("message") ?? "").slice(0, 500);

  if (!/^[A-Za-z0-9_-]{5,1024}$/.test(id)) {
    return redirect(`${back}?error=id`, 303);
  }
  const session = cookies.get(ADMIN_COOKIE)?.value ?? "";
  if (!verifyAdminCsrf(form.get("confirm"), session, `cancel-confirm:${id}`)) {
    return redirect(`${back}?error=cancel_confirmation`, 303);
  }

  try {
    const result = await coordinateBooking<ManageResult>(locals.bookingCoordinator, { action: "cancel", id, message });

    return redirect(
      `${back}?ok=canceled&mail=${result.mailSent ? "1" : "0"}`,
      303
    );
  } catch (error) {
    const code = error instanceof CoordinationError ? error.code : "booking_in_progress";
    return redirect(`${back}?error=${code}`, 303);
  }
};
