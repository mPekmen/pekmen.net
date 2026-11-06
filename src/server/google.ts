import { env } from "./env";
import { bookingConfig } from "./config";
import {
  formatZonedIso,
  offsetMinutes,
  pad2,
  zonedDateTimeToUtc,
} from "./time";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const REQUEST_TIMEOUT_MS = 10_000;

type TokenCache = {
  value: string;
  expiresAt: number;
};

export type BusyInterval = {
  start: number;
  end: number;
};

export type CalendarEvent = {
  id: string;
  htmlLink: string;
  meetLink: string;
};

export class GoogleError extends Error {
  code: string;
  status: number;
  readonly ambiguous: boolean;

  constructor(code: string, status = 500, ambiguous = false) {
    super(code);
    this.name = "GoogleError";
    this.code = code;
    this.status = status;
    this.ambiguous = ambiguous;
  }
}

let tokenCache: TokenCache | null = null;

async function accessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.value;
  }

  const body = new URLSearchParams({
    client_id: env("GOOGLE_CLIENT_ID"),
    client_secret: env("GOOGLE_CLIENT_SECRET"),
    refresh_token: env("GOOGLE_REFRESH_TOKEN"),
    grant_type: "refresh_token",
  });

  const response = await fetch(TOKEN_URL, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });

  const data = (await response.json().catch(() => null)) as
    | { access_token?: string; expires_in?: number; error?: string }
    | null;

  if (!response.ok || !data?.access_token) {
    throw new GoogleError("google_auth", 502);
  }

  tokenCache = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };

  return tokenCache.value;
}

async function calendarRequest(
  path: string,
  init: RequestInit = {}
): Promise<unknown> {
  const token = await accessToken().catch(() => {
    throw new GoogleError("google_auth", 502);
  });
  const writing = Boolean(init.method && init.method !== "GET");
  let response: Response;
  try {
    response = await fetch(`${CALENDAR_API}${path}`, {
      ...init,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new GoogleError("google_error", 502, writing);
  }

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new GoogleError("not_found", 404);
    }

    if (response.status === 409 || response.status === 412) {
      throw new GoogleError("slot_taken", 409, init.method === "POST" && response.status === 409);
    }

    if (response.status === 401 || response.status === 403) {
      throw new GoogleError("google_auth", 502);
    }

    const ambiguous = writing && (response.status >= 500 || response.status === 408);
    throw new GoogleError("google_error", 502, ambiguous);
  }

  return response.json().catch(() => {
    throw new GoogleError("google_error", 502, writing);
  });
}

export function calendarId(): string {
  return env("GOOGLE_CALENDAR_ID", "primary");
}

type CalendarEventItem = {
  id?: string;
  status?: string;
  transparency?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

export async function listBusy(
  from: Date,
  to: Date,
  excludeId?: string
): Promise<BusyInterval[]> {
  const config = bookingConfig();
  const params = new URLSearchParams();

  params.set("timeMin", formatZonedIso(from, config.timeZone));
  params.set("timeMax", formatZonedIso(to, config.timeZone));
  params.set("singleEvents", "true");
  params.set("orderBy", "startTime");
  params.set("maxResults", "250");
  params.set("fields", "items(id,status,transparency,start,end),nextPageToken");

  const path = `/calendars/${encodeURIComponent(calendarId())}/events`;
  const busy: BusyInterval[] = [];
  let pageToken: string | undefined;

  do {
    if (pageToken) params.set("pageToken", pageToken);

    const data = (await calendarRequest(`${path}?${params}`)) as {
      items?: CalendarEventItem[];
      nextPageToken?: string;
    } | null;

    for (const item of data?.items ?? []) {
      if (excludeId && item.id === excludeId) continue;
      if (item.status === "cancelled") continue;
      if (item.transparency === "transparent") continue;

      const start = parseEventDate(item.start, config.timeZone);
      const end = parseEventDate(item.end, config.timeZone);

      if (!start || !end || end.getTime() <= start.getTime()) continue;

      busy.push({ start: start.getTime(), end: end.getTime() });
    }

    pageToken = data?.nextPageToken;
  } while (pageToken);

  return busy;
}

function parseEventDate(
  value: { dateTime?: string; date?: string } | undefined,
  timeZone: string
): Date | null {
  if (!value) return null;

  if (value.dateTime) {
    const date = new Date(value.dateTime);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (value.date) {
    // Google already gives an exclusive end date for all-day events.
    const date = zonedDateTimeToUtc(value.date, 0, 0, timeZone);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

export async function createCalendarEvent(input: {
  id: string;
  summary: string;
  description: string;
  start: Date;
  end: Date;
  attendee?: string;
  sendUpdates?: "all" | "none";
  metadata?: Record<string, string>;
}): Promise<CalendarEvent> {
  const config = bookingConfig();
  const requestId = `pekmen-${input.start.getTime()}-${randomId()}`;

  const body = {
    id: input.id,
    summary: input.summary,
    description: input.description,
    start: {
      dateTime: formatZonedIso(input.start, config.timeZone),
      timeZone: config.timeZone,
    },
    end: {
      dateTime: formatZonedIso(input.end, config.timeZone),
      timeZone: config.timeZone,
    },
    attendees: input.attendee ? [{ email: input.attendee }] : undefined,
    extendedProperties: {
      private: { pekmen: "booking", ...(input.metadata ?? {}) },
    },
    conferenceData: {
      createRequest: {
        requestId,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
    reminders: { useDefault: true },
  };

  const path =
    `/calendars/${encodeURIComponent(calendarId())}/events` +
    `?conferenceDataVersion=1&sendUpdates=${input.sendUpdates ?? "all"}`;

  const created = (await calendarRequest(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })) as {
    id?: string;
    htmlLink?: string;
    hangoutLink?: string;
    conferenceData?: { entryPoints?: { entryPointType?: string; uri?: string }[] };
  } | null;

  if (created?.id !== input.id) throw new GoogleError("google_error", 502, true);
  return {
    id: created.id,
    htmlLink: created?.htmlLink ?? "",
    meetLink: meetLink(created),
  };
}

export type BookingStatus = "pending" | "confirmed";

export type BookingEvent = {
  id: string;
  etag: string;
  summary: string;
  description: string;
  start: number;
  end: number;
  startIso: string;
  endIso: string;
  meetLink: string;
  htmlLink: string;
  name: string;
  email: string;
  note: string;
  lang: string;
  bookingStatus: BookingStatus;
  status: string;
  metadata: Record<string, string>;
};

type BookingEventItem = {
  id?: string;
  etag?: string;
  status?: string;
  summary?: string;
  description?: string;
  htmlLink?: string;
  hangoutLink?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: { email?: string; displayName?: string }[];
  conferenceData?: { entryPoints?: { entryPointType?: string; uri?: string }[] };
  extendedProperties?: { private?: Record<string, string> };
};

const BOOKING_FIELDS =
  "id,etag,status,summary,description,htmlLink,hangoutLink,conferenceData,start,end,attendees,extendedProperties";

function isSiteBooking(item: BookingEventItem): boolean {
  const marker = item.extendedProperties?.private?.pekmen;
  if (marker !== undefined) return marker === "booking";

  // Older bookings identify themselves in the first line of the description.
  return item.description?.split(/\r?\n/, 1)[0] === "Booked via pekmen.net";
}

function toBookingEvent(item: BookingEventItem): BookingEvent | null {
  const config = bookingConfig();

  if (!item.id) return null;
  if (item.status === "cancelled") return null;

  const start = parseEventDate(item.start, config.timeZone);
  const end = parseEventDate(item.end, config.timeZone);

  if (!start || !end) return null;

  const meta = item.extendedProperties?.private ?? {};
  const fallbackName = (item.summary ?? "").replace(/^Call\s+—\s+/, "");
  const hasAttendee = (item.attendees?.length ?? 0) > 0;
  const confirmed =
    meta.status === "confirmed" || (!meta.status && hasAttendee);

  return {
    id: item.id,
    etag: item.etag ?? "",
    summary: item.summary ?? "Call",
    description: item.description ?? "",
    start: start.getTime(),
    end: end.getTime(),
    startIso: formatZonedIso(start, config.timeZone),
    endIso: formatZonedIso(end, config.timeZone),
    meetLink: meetLink(item),
    htmlLink: item.htmlLink ?? "",
    name: meta.name ?? (fallbackName || "Call"),
    email: meta.email ?? item.attendees?.[0]?.email ?? "",
    note: meta.note ?? "",
    lang: meta.lang ?? "en",
    bookingStatus: confirmed ? "confirmed" : "pending",
    status: item.status ?? "confirmed",
    metadata: meta,
  };
}

/**
 * Bookings created by this site. Current events carry a private
 * `pekmen=booking` property; older ones are recognised by the description the
 * booking flow writes. Filtering here keeps unrelated calendar entries out of
 * the panel.
 */
export async function listBookingEvents(
  from: Date,
  to: Date
): Promise<BookingEvent[]> {
  const config = bookingConfig();
  const params = new URLSearchParams();

  params.set("timeMin", formatZonedIso(from, config.timeZone));
  params.set("timeMax", formatZonedIso(to, config.timeZone));
  params.set("singleEvents", "true");
  params.set("orderBy", "startTime");
  params.set("maxResults", "250");
  params.set("fields", `items(${BOOKING_FIELDS}),nextPageToken`);

  const events: BookingEvent[] = [];
  let pageToken: string | undefined;

  do {
    if (pageToken) params.set("pageToken", pageToken);

    const path =
      `/calendars/${encodeURIComponent(calendarId())}/events?` +
      params.toString();

    const data = (await calendarRequest(path)) as {
      items?: BookingEventItem[];
      nextPageToken?: string;
    } | null;

    for (const item of data?.items ?? []) {
      if (!isSiteBooking(item)) continue;

      const event = toBookingEvent(item);
      if (event) events.push(event);
    }

    pageToken = data?.nextPageToken;
  } while (pageToken);

  return events;
}

export async function getBookingEvent(
  id: string
): Promise<BookingEvent | null> {
  const path =
    `/calendars/${encodeURIComponent(calendarId())}/events/` +
    `${encodeURIComponent(id)}?fields=${encodeURIComponent(BOOKING_FIELDS)}`;

  let data: BookingEventItem | null = null;

  try {
    data = (await calendarRequest(path)) as BookingEventItem | null;
  } catch (error) {
    if (error instanceof GoogleError && error.code === "not_found") {
      return null;
    }

    throw error;
  }

  return data && isSiteBooking(data) ? toBookingEvent(data) : null;
}

export async function updateCalendarEvent(
  id: string,
  input: {
    etag?: string;
    start?: Date;
    end?: Date;
    attendee?: string;
    metadata?: Record<string, string>;
    sendUpdates?: "all" | "none";
  }
): Promise<CalendarEvent> {
  const config = bookingConfig();
  const body: Record<string, unknown> = {};

  if (input.start && input.end) {
    body.start = {
      dateTime: formatZonedIso(input.start, config.timeZone),
      timeZone: config.timeZone,
    };
    body.end = {
      dateTime: formatZonedIso(input.end, config.timeZone),
      timeZone: config.timeZone,
    };
  }

  if (input.attendee) {
    body.attendees = [{ email: input.attendee }];
  }

  if (input.metadata) {
    body.extendedProperties = { private: input.metadata };
  }

  const path =
    `/calendars/${encodeURIComponent(calendarId())}/events/` +
    `${encodeURIComponent(id)}?conferenceDataVersion=1` +
    `&sendUpdates=${input.sendUpdates ?? "none"}`;

  const updated = (await calendarRequest(path, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(input.etag ? { "If-Match": input.etag } : {}),
    },
    body: JSON.stringify(body),
  })) as {
    id?: string;
    htmlLink?: string;
    hangoutLink?: string;
    conferenceData?: { entryPoints?: { entryPointType?: string; uri?: string }[] };
  } | null;

  if (updated?.id !== id) throw new GoogleError("google_error", 502, true);
  return {
    id: updated.id,
    htmlLink: updated.htmlLink ?? "",
    meetLink: meetLink(updated),
  };
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  const path =
    `/calendars/${encodeURIComponent(calendarId())}/events/` +
    `${encodeURIComponent(id)}?sendUpdates=all`;

  await calendarRequest(path, { method: "DELETE" });
}

export async function calendarTimeZone(): Promise<string> {
  const data = (await calendarRequest(
    `/calendars/${encodeURIComponent(calendarId())}`
  )) as { timeZone?: string } | null;

  return data?.timeZone ?? "";
}

export async function setCalendarTimeZone(timeZone: string): Promise<void> {
  await calendarRequest(
    `/calendars/${encodeURIComponent(calendarId())}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timeZone }),
    }
  );
}

function meetLink(
  event:
    | {
        hangoutLink?: string;
        conferenceData?: {
          entryPoints?: { entryPointType?: string; uri?: string }[];
        };
      }
    | null
): string {
  if (event?.hangoutLink) return event.hangoutLink;

  for (const point of event?.conferenceData?.entryPoints ?? []) {
    if (point.entryPointType === "video" && point.uri) return point.uri;
  }

  return "";
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

/**
 * Debug helper for the OAuth script and for checking which timezone the
 * server resolves. Not exposed through an API route.
 */
export function describeClock(date = new Date()): string {
  const config = bookingConfig();
  const offset = offsetMinutes(date, config.timeZone);
  const sign = offset >= 0 ? "+" : "-";
  const absolute = Math.abs(offset);

  return `${formatZonedIso(date, config.timeZone)} (${sign}${pad2(
    Math.floor(absolute / 60)
  )}:${pad2(absolute % 60)})`;
}
