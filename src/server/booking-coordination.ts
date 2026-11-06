import { getBookingEvent, GoogleError, type CalendarEvent } from "./google";

type SqlValue = string | number | null;

export interface CoordinationStorage {
  sql: {
    exec<T extends Record<string, SqlValue>>(query: string, ...bindings: SqlValue[]): Iterable<T>;
  };
  transactionSync<T>(callback: () => T): T;
  sync(): Promise<void>;
  getAlarm(): Promise<number | null>;
  setAlarm(time: number): Promise<void>;
}

type Operation = {
  key: string;
  event_id: string;
  marker: string;
  start: number;
  end: number;
  old_start: number | null;
  old_end: number | null;
  buffer: number;
  expires: number;
  state: string;
  result: string | null;
  checked: number;
};

type Reservation = {
  key: string;
  start: number;
  end: number;
  buffer: number;
  previous?: { id: string; start: number; end: number };
};

const RECHECK_MS = 60_000;
const PREPARE_MS = 120_000;
const REPLAY_MS = 86_400_000;

export class CoordinationError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status: number) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

export async function reservationKey(parts: unknown[]): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(parts)));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** The coordinator owns the local write ledger. Google remains the calendar. */
export class BookingCoordination {
  private readonly active = new Set<string>();
  private readonly editing = new Set<string>();
  private readonly storage: CoordinationStorage;

  constructor(storage: CoordinationStorage) {
    this.storage = storage;
    storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS booking_operations (
        key TEXT PRIMARY KEY, event_id TEXT NOT NULL, marker TEXT NOT NULL,
        start INTEGER NOT NULL, end INTEGER NOT NULL,
        old_start INTEGER, old_end INTEGER, buffer INTEGER NOT NULL,
        expires INTEGER NOT NULL, state TEXT NOT NULL, result TEXT,
        checked INTEGER NOT NULL DEFAULT 0
      )
    `);
  }

  private find(key: string): Operation | undefined {
    return Array.from(this.storage.sql.exec<Operation>(
      "SELECT * FROM booking_operations WHERE key = ?", key,
    ))[0];
  }

  private cleanup(now: number): void {
    this.storage.sql.exec(
      "DELETE FROM booking_operations WHERE expires <= ? AND state IN ('preparing', 'sent')",
      now,
    );
    this.storage.sql.exec(
      "DELETE FROM booking_operations WHERE expires <= ? AND state IN ('done', 'released')",
      now - REPLAY_MS,
    );
  }

  private complete(row: Operation, event: CalendarEvent): void {
    this.storage.transactionSync(() => {
      this.release(row.event_id);
      this.storage.sql.exec(
        "UPDATE booking_operations SET state = 'done', result = ?, expires = ? WHERE key = ?",
        JSON.stringify(event), row.end + row.buffer, row.key,
      );
    });
  }

  release(id: string): void {
    this.storage.sql.exec(
      "UPDATE booking_operations SET state = 'released' WHERE event_id = ? AND state = 'done'", id,
    );
  }

  private async reconcile(row: Operation): Promise<CalendarEvent | null> {
    this.storage.sql.exec("UPDATE booking_operations SET checked = ? WHERE key = ?", Date.now(), row.key);
    try {
      const event = await getBookingEvent(row.event_id);
      if (event?.metadata.bookingOperation !== row.marker || event.start !== row.start || event.end !== row.end) {
        return null;
      }
      const result = { id: event.id, htmlLink: event.htmlLink, meetLink: event.meetLink };
      this.complete(row, result);
      return result;
    } catch {
      return null;
    }
  }

  private async schedule(): Promise<void> {
    const next = Date.now() + RECHECK_MS;
    const existing = await this.storage.getAlarm();
    if (existing === null || existing > next) await this.storage.setAlarm(next);
  }

  async alarm(): Promise<void> {
    this.cleanup(Date.now());
    const rows = Array.from(this.storage.sql.exec<Operation>(
      "SELECT * FROM booking_operations WHERE state = 'sent' ORDER BY checked LIMIT 8",
    ));
    await Promise.all(rows.map(async (row) => {
      if (this.active.has(row.key)) return;
      this.active.add(row.key);
      try {
        await this.reconcile(row);
      } finally {
        this.active.delete(row.key);
      }
    }));
    const remaining = Array.from(this.storage.sql.exec<{ expires: number }>(
      "SELECT MIN(expires + CASE WHEN state IN ('done', 'released') THEN ? ELSE 0 END) AS expires FROM booking_operations HAVING COUNT(*) > 0",
      REPLAY_MS,
    ))[0];
    if (remaining) {
      const next = rows.length ? Date.now() + RECHECK_MS : Math.max(Date.now() + 1, remaining.expires);
      // A request may already have scheduled an earlier alarm during reconciliation.
      const existing = await this.storage.getAlarm();
      if (existing === null || existing > next) await this.storage.setAlarm(next);
    }
  }

  async edit<T>(id: string, work: () => Promise<T>, retryKey?: string): Promise<T> {
    const busy = Array.from(this.storage.sql.exec(
      "SELECT 1 FROM booking_operations WHERE event_id = ? AND state = 'sent' AND expires > ? AND key <> ? LIMIT 1",
      id, Date.now(), retryKey ?? "",
    )).length > 0;
    if (busy || this.editing.has(id)) throw new CoordinationError("booking_in_progress", 503);
    this.editing.add(id);
    try {
      return await work();
    } finally {
      this.editing.delete(id);
    }
  }

  async replay(key: string): Promise<CalendarEvent | null> {
    this.cleanup(Date.now());
    const row = this.find(key);
    if (!row) return null;
    if (row.result) return JSON.parse(row.result) as CalendarEvent;
    if (!this.active.has(key) && row.state === "sent") {
      this.active.add(key);
      try {
        const event = await this.reconcile(row);
        if (event) return event;
      } finally {
        this.active.delete(key);
      }
    }
    throw new CoordinationError("booking_in_progress", 503);
  }

  async reserve(
    reservation: Reservation,
    check: () => Promise<void>,
    write: (eventId: string, marker: string) => Promise<CalendarEvent>,
  ): Promise<{ event: CalendarEvent; fresh: boolean }> {
    const { key, start, end, buffer, previous } = reservation;
    const replay = await this.replay(key);
    if (replay) return { event: replay, fresh: false };

    const marker = crypto.randomUUID().replaceAll("-", "");
    const eventId = previous?.id ?? marker;
    const expiry = Math.max(end, previous?.end ?? end) + buffer;
    this.storage.transactionSync(() => {
      const now = Date.now();
      this.cleanup(now);
      if (this.find(key)) throw new CoordinationError("booking_in_progress", 503);
      const conflicts = Array.from(this.storage.sql.exec(`
        SELECT 1 FROM booking_operations
        WHERE expires > ? AND state <> 'released' AND event_id <> ?
          AND ((start < ? + MAX(buffer, ?) AND end > ? - MAX(buffer, ?))
            OR (state <> 'done' AND old_start < ? + MAX(buffer, ?) AND old_end > ? - MAX(buffer, ?)))
        LIMIT 1
      `, now, eventId, end, buffer, start, buffer, end, buffer, start, buffer));
      if (conflicts.length) throw new CoordinationError("slot_taken", 409);
      this.storage.sql.exec(`
        INSERT INTO booking_operations (key, event_id, marker, start, end, old_start, old_end, buffer, expires, state)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'preparing')
      `, key, eventId, marker, start, end, previous?.start ?? null, previous?.end ?? null, buffer, now + PREPARE_MS);
    });

    this.active.add(key);
    try {
      try {
        await this.schedule();
        await check();
        const row = this.find(key);
        if (row?.marker !== marker || row.expires <= Date.now()) {
          throw new CoordinationError("booking_in_progress", 503);
        }
      } catch (error) {
        this.storage.sql.exec("DELETE FROM booking_operations WHERE key = ? AND marker = ?", key, marker);
        throw error;
      }

      // Persist the intent before sending anything that could change Google.
      this.storage.sql.exec(
        "UPDATE booking_operations SET state = 'sent', expires = ? WHERE key = ? AND marker = ?",
        expiry, key, marker,
      );
      await this.storage.sync();
      const row = this.find(key);
      if (!row || row.marker !== marker || row.expires <= Date.now()) {
        throw new CoordinationError("booking_in_progress", 503);
      }

      let event: CalendarEvent;
      try {
        event = await write(eventId, marker);
      } catch (error) {
        if (error instanceof GoogleError && !error.ambiguous) {
          this.storage.sql.exec("DELETE FROM booking_operations WHERE key = ? AND marker = ?", key, marker);
          throw error;
        }
        const resolved = await this.reconcile(row);
        if (resolved) return { event: resolved, fresh: true };
        throw new CoordinationError("booking_in_progress", 503);
      }
      this.complete(row, event);
      return { event, fresh: true };
    } finally {
      this.active.delete(key);
    }
  }
}
