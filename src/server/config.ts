import { env, envInt } from "./env";
import { DEFAULT_TIME_ZONE } from "./time";

export type BookingConfig = {
  timeZone: string;
  durationMinutes: number;
  workStartHour: number;
  workEndHour: number;
  stepMinutes: number;
  bufferMinutes: number;
  leadHours: number;
  horizonDays: number;
  workDays: number[];
};

export function bookingConfig(): BookingConfig {
  const workDays = env("BOOKING_WORK_DAYS", "1,2,3,4,5")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6);

  return {
    timeZone: env("BOOKING_TIMEZONE", DEFAULT_TIME_ZONE),
    durationMinutes: envInt("BOOKING_DURATION_MINUTES", 30),
    workStartHour: envInt("BOOKING_WORK_START", 10),
    workEndHour: envInt("BOOKING_WORK_END", 18),
    stepMinutes: envInt("BOOKING_STEP_MINUTES", 30),
    bufferMinutes: Math.max(0, envInt("BOOKING_BUFFER_MINUTES", 10, 0)),
    leadHours: Math.max(0, envInt("BOOKING_LEAD_HOURS", 24, 0)),
    horizonDays: envInt("BOOKING_HORIZON_DAYS", 60),
    workDays: workDays.length > 0 ? workDays : [1, 2, 3, 4, 5],
  };
}

export function isGoogleConfigured(): boolean {
  return Boolean(
    env("GOOGLE_CLIENT_ID") &&
      env("GOOGLE_CLIENT_SECRET") &&
      env("GOOGLE_REFRESH_TOKEN")
  );
}

export function isBookingConfigured(): boolean {
  return isGoogleConfigured();
}

export function isEmailConfigured(): boolean {
  return Boolean(env("RESEND_API_KEY"));
}

export function contactRecipient(): string {
  return env("CONTACT_TO", "contact@pekmen.net");
}

export function contactSender(): string {
  return env("CONTACT_FROM", "Pekmen <onboarding@resend.dev>");
}
