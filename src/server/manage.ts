import { getAvailability } from "./booking";
import {
  sendBookingCanceled,
  sendBookingConfirmed,
  sendBookingRescheduled,
  type BookingMail,
} from "./booking-emails";
import { bookingConfig } from "./config";
import {
  deleteCalendarEvent,
  getBookingEvent,
  updateCalendarEvent,
  type BookingEvent,
} from "./google";
import { dateKeyInZone, formatZonedIso } from "./time";
import { reservationKey, type BookingCoordination } from "./booking-coordination";

export class ManageError extends Error {
  code: string;
  status: number;

  constructor(code: string, status = 400) {
    super(code);
    this.name = "ManageError";
    this.code = code;
    this.status = status;
  }
}

export type ManageResult = {
  event: BookingEvent;
  mailSent: boolean;
  already?: boolean;
};

function mailFor(event: BookingEvent): BookingMail {
  return {
    name: event.name,
    email: event.email,
    start: new Date(event.start),
    end: new Date(event.end),
    note: event.note || undefined,
    lang: event.lang,
    pending: event.bookingStatus === "pending",
  };
}

export async function confirmBooking(id: string): Promise<ManageResult> {
  const event = await getBookingEvent(id);

  if (!event) {
    throw new ManageError("not_found", 404);
  }

  if (event.bookingStatus === "confirmed") {
    return { event, mailSent: false, already: true };
  }

  if (!event.email) {
    throw new ManageError("missing_email", 400);
  }

  const updated = await updateCalendarEvent(id, {
    etag: event.etag,
    attendee: event.email,
    metadata: { ...event.metadata, status: "confirmed" },
    sendUpdates: "all",
  });

  const mailSent = await sendBookingConfirmed({
    ...mailFor(event),
    meetLink: updated.meetLink || event.meetLink,
  });

  return {
    event: { ...event, bookingStatus: "confirmed" },
    mailSent,
  };
}

export async function rescheduleBooking(
  coordination: BookingCoordination,
  id: string,
  startIso: string,
  message: string,
  requestId: string,
): Promise<ManageResult> {
  const config = bookingConfig();
  const start = new Date(startIso);

  if (Number.isNaN(start.getTime())) {
    throw new ManageError("invalid_slot", 400);
  }

  const key = await reservationKey(["move", id, +start, requestId]);
  return coordination.edit(id, async () => {
    const event = await getBookingEvent(id);
    if (!event) throw new ManageError("not_found", 404);

    if (await coordination.replay(key) || event.start === +start) {
      return { event, mailSent: false, already: true };
    }

    const end = new Date(start.getTime() + config.durationMinutes * 60000);
    const confirmed = event.bookingStatus === "confirmed";
    const { event: updated, fresh } = await coordination.reserve(
      { key, start: +start, end: +end, buffer: config.bufferMinutes * 60000, previous: event },
      async () => {
        const dateKey = dateKeyInZone(start, config.timeZone);
        const available = await getAvailability(dateKey, id);
        if (!available.some((slot) => slot.start === startIso)) throw new ManageError("slot_taken", 409);
      },
      (_id, marker) => updateCalendarEvent(id, {
        etag: event.etag,
        start,
        end,
        metadata: { ...event.metadata, bookingOperation: marker },
        sendUpdates: confirmed ? "all" : "none",
      }),
    );

    const mailSent = fresh && await sendBookingRescheduled({
      ...mailFor(event),
      start,
      end,
      previousStart: new Date(event.start),
      meetLink: confirmed ? updated.meetLink || event.meetLink : "",
      message: message.trim() || undefined,
    });

    return {
      event: {
        ...event,
        start: +start,
        end: +end,
        startIso,
        endIso: formatZonedIso(end, config.timeZone),
      },
      mailSent,
      already: !fresh,
    };
  }, key);
}

export async function cancelBooking(
  id: string,
  message = ""
): Promise<ManageResult> {
  const event = await getBookingEvent(id);

  if (!event) {
    throw new ManageError("not_found", 404);
  }

  await deleteCalendarEvent(id);

  const mailSent = await sendBookingCanceled({
    ...mailFor(event),
    message: message.trim() || undefined,
  });

  return { event, mailSent };
}
