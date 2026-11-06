import type { BookingRequest } from "./booking";
import { CoordinationError } from "./booking-coordination";
import { calendarId } from "./google";

export interface BookingNamespace {
  idFromName(name: string): unknown;
  get(id: unknown): { fetch(request: Request): Promise<Response> };
}

export type BookingCommand =
  | { action: "create"; input: BookingRequest }
  | { action: "move"; id: string; start: string; message: string; requestId: string }
  | { action: "confirm" | "cancel"; id: string; message?: string };

export async function coordinateBooking<T>(namespace: BookingNamespace | undefined, command: BookingCommand): Promise<T> {
  if (!namespace) throw new CoordinationError("not_configured", 503);
  const coordinator = namespace.get(namespace.idFromName(calendarId()));
  const response = await coordinator.fetch(new Request("https://booking.internal/", {
    method: "POST",
    body: JSON.stringify(command),
  }));
  if (!response.ok) {
    const failure = await response.json() as { error: string };
    throw new CoordinationError(failure.error, response.status);
  }
  return await response.json() as T;
}
