import { createHash } from "node:crypto";
import { isBookingConfigured } from "./config";
import { listBookingEvents, type BookingEvent } from "./google";

type BookingSnapshot =
  | { state: "ready"; bookings: BookingEvent[]; signature: string; checkedAt: number }
  | { state: "unconfigured" | "unavailable" };

const CACHE_MS = 45_000;
const ERROR_CACHE_MS = 15_000;
let cached: { snapshot: BookingSnapshot; expires: number } | undefined;
let inFlight: Promise<BookingSnapshot> | undefined;

export async function readAdminBookings(refresh = false): Promise<BookingSnapshot> {
  if (!isBookingConfigured()) return { state: "unconfigured" };
  if (inFlight) return inFlight;
  if (!refresh && cached && cached.expires > Date.now()) return cached.snapshot;

  inFlight = (async (): Promise<BookingSnapshot> => {
    let snapshot: BookingSnapshot;
    try {
      const now = new Date(Date.now());
      const bookings = await listBookingEvents(now, new Date(+now + 365 * 86400000));
      const signature = createHash("sha256").update(JSON.stringify(bookings)).digest("hex");
      snapshot = { state: "ready", bookings, signature, checkedAt: Date.now() };
    } catch {
      snapshot = { state: "unavailable" };
    }
    cached = { snapshot, expires: Date.now() + (snapshot.state === "ready" ? CACHE_MS : ERROR_CACHE_MS) };
    return snapshot;
  })();
  try {
    return await inFlight;
  } finally {
    inFlight = undefined;
  }
}
