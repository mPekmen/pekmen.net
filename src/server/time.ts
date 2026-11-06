export const DEFAULT_TIME_ZONE = "Europe/Istanbul";

type ZoneParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

export function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function zoneParts(date: Date, timeZone: string): ZoneParts {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const read = (type: string): number => {
    const part = parts.find((item) => item.type === type);
    return Number(part?.value ?? 0);
  };

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
    second: read("second"),
  };
}

export function dateKeyInZone(date: Date, timeZone: string): string {
  const parts = zoneParts(date, timeZone);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

export function offsetMinutes(date: Date, timeZone: string): number {
  const parts = zoneParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return Math.round((asUtc - date.getTime()) / 60000);
}

/**
 * Converts a wall-clock time in `timeZone` to the matching UTC instant.
 * The offset is evaluated twice so daylight-saving transitions are handled.
 */
export function zonedDateTimeToUtc(
  dateKey: string,
  hour: number,
  minute: number,
  timeZone: string
): Date {
  const guess = new Date(`${dateKey}T${pad2(hour)}:${pad2(minute)}:00Z`);
  const firstOffset = offsetMinutes(guess, timeZone);
  let result = new Date(guess.getTime() - firstOffset * 60000);
  const secondOffset = offsetMinutes(result, timeZone);

  if (secondOffset !== firstOffset) {
    result = new Date(guess.getTime() - secondOffset * 60000);
  }

  return result;
}

export function formatZonedIso(date: Date, timeZone: string): string {
  const parts = zoneParts(date, timeZone);
  const offset = offsetMinutes(date, timeZone);
  const sign = offset >= 0 ? "+" : "-";
  const absolute = Math.abs(offset);

  return (
    `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}` +
    `T${pad2(parts.hour)}:${pad2(parts.minute)}:${pad2(parts.second)}` +
    `${sign}${pad2(Math.floor(absolute / 60))}:${pad2(absolute % 60)}`
  );
}

export function formatZonedTime(date: Date, timeZone: string): string {
  const parts = zoneParts(date, timeZone);
  return `${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

export function weekdayOfDateKey(dateKey: string): number {
  return new Date(`${dateKey}T12:00:00Z`).getUTCDay();
}

export function isValidDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T12:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}
