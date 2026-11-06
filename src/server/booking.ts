import {
  bookingConfig,
  type BookingConfig,
} from "./config";
import { createCalendarEvent, listBusy } from "./google";
import { sendBookingReceived, sendOwnerNewBooking, type BookingMail } from "./booking-emails";
import { reservationKey, type BookingCoordination } from "./booking-coordination";
import {
  dateKeyInZone,
  formatZonedIso,
  formatZonedTime,
  isValidDateKey,
  pad2,
  weekdayOfDateKey,
  zoneParts,
  zonedDateTimeToUtc,
} from "./time";

export type Slot = {
  start: string;
  label: string;
};

export type BookingRequest = {
  action?: unknown;
  name?: unknown;
  email?: unknown;
  note?: unknown;
  company?: unknown;
  start?: unknown;
  lang?: unknown;
};

export type BookingConfirmation = {
  start: string;
  end: string;
  htmlLink: string;
  meetLink: string;
  status: "pending" | "confirmed";
};

export class BookingError extends Error {
  code: string;
  status: number;

  constructor(code: string, status = 400) {
    super(code);
    this.name = "BookingError";
    this.code = code;
    this.status = status;
  }
}

export type DayAvailability = {
  date: string;
  count: number;
};

export async function getAvailability(dateKey: string, excludeId?: string): Promise<Slot[]> {
  const config = bookingConfig();

  if (!isValidDateKey(dateKey)) {
    throw new BookingError("invalid_date", 400);
  }

  if (!config.workDays.includes(weekdayOfDateKey(dateKey))) {
    return [];
  }

  const dayStart = zonedDateTimeToUtc(dateKey, 0, 0, config.timeZone);
  const dayEnd = zonedDateTimeToUtc(nextDateKey(dateKey), 0, 0, config.timeZone);
  const busy = await listBusy(dayStart, dayEnd, excludeId);

  return slotsForDay(dateKey, config, busy);
}

/**
 * Availability for a whole month in one calendar query, so the month grid can
 * show which days have free time without thirty round trips.
 */
export async function getMonthAvailability(
  monthKey: string
): Promise<DayAvailability[]> {
  const config = bookingConfig();

  if (!isValidDateKey(`${monthKey}-01`)) {
    throw new BookingError("invalid_month", 400);
  }

  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstKey = `${monthKey}-01`;
  const lastKey = `${monthKey}-${pad2(lastDay)}`;

  const rangeStart = zonedDateTimeToUtc(firstKey, 0, 0, config.timeZone);
  const rangeEnd = zonedDateTimeToUtc(
    nextDateKey(lastKey),
    0,
    0,
    config.timeZone
  );
  const busy = await listBusy(rangeStart, rangeEnd);
  const days: DayAvailability[] = [];

  for (let day = 1; day <= lastDay; day += 1) {
    const dateKey = `${monthKey}-${pad2(day)}`;
    const slots = slotsForDay(dateKey, config, busy);

    if (slots.length > 0) {
      days.push({ date: dateKey, count: slots.length });
    }
  }

  return days;
}

function slotsForDay(
  dateKey: string,
  config: BookingConfig,
  busy: { start: number; end: number }[]
): Slot[] {
  if (!config.workDays.includes(weekdayOfDateKey(dateKey))) {
    return [];
  }

  const durationMs = config.durationMinutes * 60000;
  const bufferMs = config.bufferMinutes * 60000;
  const earliest = Date.now() + config.leadHours * 3600000;
  const latest = Date.now() + config.horizonDays * 86400000;
  const lastStart = config.workEndHour * 60 - config.durationMinutes;
  const slots: Slot[] = [];

  for (
    let minutes = config.workStartHour * 60;
    minutes <= lastStart;
    minutes += config.stepMinutes
  ) {
    const start = zonedDateTimeToUtc(
      dateKey,
      Math.floor(minutes / 60),
      minutes % 60,
      config.timeZone
    );
    const end = new Date(start.getTime() + durationMs);

    if (start.getTime() < earliest || start.getTime() > latest) continue;

    if (!overlaps(start.getTime(), end.getTime(), busy, bufferMs)) {
      slots.push({
        start: formatZonedIso(start, config.timeZone),
        label: formatZonedTime(start, config.timeZone),
      });
    }
  }

  return slots;
}

export async function createBooking(
  input: BookingRequest,
  coordination: BookingCoordination,
): Promise<BookingConfirmation> {
  if (readString(input.company, 200)) {
    throw new BookingError("rejected", 400);
  }

  const name = readString(input.name, 120);
  const email = readString(input.email, 200);
  const note = readString(input.note, 2000);
  const lang = normalizeLang(input.lang);

  if (!name || !isEmail(email)) {
    throw new BookingError("invalid_details", 400);
  }

  const start = new Date(readString(input.start, 80));

  if (Number.isNaN(start.getTime())) {
    throw new BookingError("invalid_slot", 400);
  }

  const config = bookingConfig();
  const dateKey = dateKeyInZone(start, config.timeZone);

  const requested = formatZonedIso(start, config.timeZone);
  const end = new Date(start.getTime() + config.durationMinutes * 60000);
  const key = await reservationKey(["create", +start, name, email.toLowerCase(), note, lang]);
  const { event, fresh } = await coordination.reserve(
    { key, start: +start, end: +end, buffer: config.bufferMinutes * 60000 },
    async () => {
      if (!isValidGridStart(start, config)) throw new BookingError("invalid_slot", 400);
      const available = await getAvailability(dateKey);
      if (!available.some((slot) => slot.start === requested)) throw new BookingError("slot_taken", 409);
    },
    (id, marker) => createCalendarEvent({
      id,
      summary: `Call — ${name}`,
      description: buildDetails(name, email, note, config),
      start,
      end,
      sendUpdates: "none",
      metadata: { name, email, note: note.slice(0, 900), lang, status: "pending", bookingOperation: marker },
    }),
  );

  if (fresh) {
    const mail: BookingMail = { name, email, start, end, note, lang, meetLink: event.meetLink };
    await sendBookingReceived(mail);
    await sendOwnerNewBooking(mail);
  }

  return {
    start: requested,
    end: formatZonedIso(end, config.timeZone),
    htmlLink: fresh ? event.htmlLink : "",
    meetLink: fresh ? event.meetLink : "",
    status: "pending",
  };
}

function isValidGridStart(date: Date, config: BookingConfig): boolean {
  if (Number.isNaN(date.getTime())) return false;
  if (date.getMilliseconds() !== 0) return false;

  const dateKey = dateKeyInZone(date, config.timeZone);
  if (!isValidDateKey(dateKey)) return false;
  if (!config.workDays.includes(weekdayOfDateKey(dateKey))) return false;

  const parts = zoneParts(date, config.timeZone);
  const minutes = parts.hour * 60 + parts.minute;

  if (parts.second !== 0) return false;
  if (minutes < config.workStartHour * 60) return false;
  if (minutes + config.durationMinutes > config.workEndHour * 60) return false;
  if ((minutes - config.workStartHour * 60) % config.stepMinutes !== 0) {
    return false;
  }

  const now = Date.now();
  if (date.getTime() < now + config.leadHours * 3600000) return false;
  if (date.getTime() > now + config.horizonDays * 86400000) return false;

  return true;
}

function overlaps(
  start: number,
  end: number,
  busy: { start: number; end: number }[],
  bufferMs: number
): boolean {
  const from = start - bufferMs;
  const to = end + bufferMs;

  return busy.some((interval) => from < interval.end && to > interval.start);
}

function nextDateKey(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function readString(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeLang(value: unknown): "en" | "tr" | "de" {
  return value === "tr" || value === "de" || value === "en" ? value : "en";
}

function buildDetails(
  name: string,
  email: string,
  note: string,
  config: BookingConfig
): string {
  return [
    "Booked via pekmen.net",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    note ? `Note: ${note}` : "",
    "",
    `Duration: ${config.durationMinutes} minutes`,
    `Time zone: ${config.timeZone}`,
  ]
    .filter(Boolean)
    .join("\n");
}
