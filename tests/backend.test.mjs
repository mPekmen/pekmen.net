import assert from "node:assert/strict";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GET as bookingGet, POST as bookingPost } from "../src/pages/api/booking.ts";
import { POST as contactPost } from "../src/pages/api/contact.ts";
import { listBookingEvents, listBusy } from "../src/server/google.ts";
import { POST as cancelPost } from "../src/pages/api/admin/cancel.ts";
import { POST as confirmPost } from "../src/pages/api/admin/confirm.ts";
import { POST as reschedulePost } from "../src/pages/api/admin/reschedule.ts";
import { POST as loginPost } from "../src/pages/api/admin/login.ts";
import { GET as adminBookings } from "../src/pages/api/admin/bookings.ts";
import { adminCsrfToken, createSessionToken, verifySessionToken } from "../src/server/admin.ts";
import { createAdminRefresh } from "../src/admin-refresh.ts";
import { matchesAppointment } from "../src/admin-filters.ts";
import { BookingCoordinator } from "../src/server/booking-worker.ts";

// No dotenv loading. Every external request is intercepted before a handler runs.
Object.assign(process.env, {
  GOOGLE_CLIENT_ID: "test-client",
  GOOGLE_CLIENT_SECRET: "test-secret",
  GOOGLE_REFRESH_TOKEN: "test-refresh",
  GOOGLE_CALENDAR_ID: "test-calendar",
  RESEND_API_KEY: "test-key",
  CONTACT_TO: "owner@example.test",
  CONTACT_FROM: "Pekmen <sender@example.test>",
  ADMIN_PASSWORD: "test-admin-password",
  ADMIN_SESSION_SECRET: "a".repeat(64),
  ADMIN_ORIGIN: "https://pekmen.test",
  BOOKING_TIMEZONE: "Europe/Istanbul",
  BOOKING_WORK_DAYS: "1,2,3,4,5",
  BOOKING_WORK_START: "10",
  BOOKING_WORK_END: "18",
  BOOKING_DURATION_MINUTES: "30",
  BOOKING_STEP_MINUTES: "30",
  BOOKING_BUFFER_MINUTES: "10",
  BOOKING_LEAD_HOURS: "24",
  BOOKING_HORIZON_DAYS: "60",
});

const calendarPath = "/calendar/v3/calendars/test-calendar/events";
const from = new Date("2030-01-07T00:00:00+03:00");
const to = new Date("2030-01-10T00:00:00+03:00");
let client = 0;

function testCoordinator(t, filename = ":memory:") {
  let db;
  let worker;
  let alarm = null;
  function restart() {
    db?.close();
    db = new DatabaseSync(filename);
    worker = new BookingCoordinator({
      storage: {
        sql: { exec: (sql, ...args) => db.prepare(sql).all(...args) },
        transactionSync(work) {
          db.exec("BEGIN");
          try {
            const result = work();
            db.exec("COMMIT");
            return result;
          } catch (error) {
            db.exec("ROLLBACK");
            throw error;
          }
        },
        async sync() {},
        async getAlarm() { return alarm; },
        async setAlarm(time) { alarm = time; },
      },
    });
  }
  restart();
  t.after(() => db.close());
  return {
    locals: {
      bookingCoordinator: {
        idFromName(name) {
          assert.equal(name, "test-calendar");
          return name;
        },
        get: () => ({ fetch: (req) => worker.fetch(req) }),
      },
    },
    restart,
    async alarm() {
      alarm = null;
      await worker.alarm();
    },
  };
}

function request(path, body, contentType = "application/json", locals = {}) {
  return {
    locals,
    clientAddress: `test-${++client}`,
    request: new Request(`https://pekmen.test/api/${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { "content-type": contentType },
      body,
    }),
  };
}

function mockFetch(t, respond) {
  return t.mock.method(globalThis, "fetch", async (input, init = {}) => {
    const url = new URL(input);
    if (url.href === "https://oauth2.googleapis.com/token") {
      assert.equal(init.method, "POST");
      return Response.json({ access_token: "test-token", expires_in: 3600 });
    }
    return respond(url, init);
  });
}

test("availability keeps exclusive all-day end dates and follows every page", async (t) => {
  const allDay = { start: { date: "2030-01-07" }, end: { date: "2030-01-08" } };
  const timed = {
    start: { dateTime: "2030-01-08T12:00:00+03:00" },
    end: { dateTime: "2030-01-08T13:00:00+03:00" },
  };
  const seen = [];
  mockFetch(t, (url, init) => {
    assert.equal(url.origin, "https://www.googleapis.com");
    assert.equal(url.pathname, calendarPath);
    assert.equal(init.method, undefined);
    assert.equal(url.searchParams.get("timeMin"), "2030-01-07T00:00:00+03:00");
    assert.equal(url.searchParams.get("singleEvents"), "true");
    const token = url.searchParams.get("pageToken");
    seen.push(token);
    if (!token) return Response.json({ items: [allDay], nextPageToken: "page-2" });
    if (token === "page-2") return Response.json({ items: [], nextPageToken: "page-3" });
    return Response.json({ items: [timed, { ...timed, transparency: "transparent" }, { ...timed, status: "cancelled" }] });
  });

  assert.deepEqual(await listBusy(from, to), [
    { start: +from, end: Date.parse("2030-01-08T00:00:00+03:00") },
    { start: Date.parse(timed.start.dateTime), end: Date.parse(timed.end.dateTime) },
  ]);
  assert.deepEqual(seen, [null, "page-2", "page-3"]);
});

test("admin listing follows tokens past page eight and preserves existing booking recognition", async (t) => {
  mockFetch(t, (url) => {
    assert.equal(url.pathname, calendarPath);
    const page = Number(url.searchParams.get("pageToken") ?? 1);
    if (page < 9) return Response.json({ items: [], nextPageToken: String(page + 1) });
    const dates = { start: { date: "2030-01-07" }, end: { date: "2030-01-08" } };
    return Response.json({ items: [
      { id: "other", ...dates },
      { id: "legacy", description: "Booked via pekmen.net", ...dates },
    ] });
  });

  const bookings = await listBookingEvents(from, to);
  assert.deepEqual(bookings.map(({ id, endIso }) => ({ id, endIso })), [
    { id: "legacy", endIso: "2030-01-08T00:00:00+03:00" },
  ]);
});

function adminRequest(id, authenticated = true, locals = {}, start = "2030-01-08T10:00:00+03:00") {
  return { id, authenticated, locals, start };
}

function adminContext(action, { id, authenticated, locals, start }, options = {}) {
  const session = options.session ?? createSessionToken(action === "login" ? "login" : "session");
  const form = new URLSearchParams({ id, start, csrf: adminCsrfToken(session, action) });
  if (action === "cancel") form.set("confirm", adminCsrfToken(session, `cancel-confirm:${id}`));
  options.editForm?.(form);
  const url = new URL("https://pekmen.test/api/admin/" + action);
  return {
    locals, url, clientAddress: "test-admin",
    request: new Request(url, {
      method: "POST",
      headers: options.origin === null ? {} : { origin: options.origin ?? url.origin },
      body: form,
    }),
    cookies: { get: () => authenticated ? { value: session } : undefined },
    redirect: (location, status) => new Response(null, { status, headers: { location } }),
  };
}

const adminCancel = (context) => cancelPost(adminContext("cancel", context));
const adminConfirm = (context) => confirmPost(adminContext("confirm", context));
const adminReschedule = (context) => reschedulePost(adminContext("reschedule", context));

test("admin POSTs require the expected origin, the right session, and explicit cancellation", async (t) => {
  const external = t.mock.method(globalThis, "fetch", () => { throw new Error("Unexpected request"); });
  const { locals } = testCoordinator(t);
  const form = adminRequest("target-event", true, locals);
  const check = (options) => cancelPost(adminContext("cancel", form, options));
  for (const origin of [null, "http://pekmen.test", "https://other.example"]) {
    assert.equal((await check({ origin })).status, 403);
  }
  assert.equal((await check({ editForm: (body) => body.delete("csrf") })).status, 403);
  const otherSession = createSessionToken();
  assert.equal((await check({
    editForm: (body) => body.set("csrf", adminCsrfToken(otherSession, "cancel")),
  })).status, 403);
  for (const editForm of [
    (body) => body.delete("confirm"),
    (body) => body.set("id", "another-event"),
  ]) {
    const response = await check({ editForm });
    assert.equal(response.headers.get("location"), "/admin?error=cancel_confirmation");
  }
  assert.equal((await adminBookings({ cookies: { get: () => undefined } })).status, 401);
  for (const [destination, expected] of [["appointments", "/admin/appointments"], ["//example.test", "/admin"]]) {
    const response = await check({ editForm: (body) => {
      body.delete("confirm");
      body.set("returnTo", destination);
    } });
    assert.equal(response.headers.get("location"), expected + "?error=cancel_confirmation");
  }
  assert.equal(external.mock.callCount(), 0);
});

test("appointment filters combine status, inclusive dates and case-insensitive names or email", () => {
  const booking = { status: "pending", date: "2030-01-08", name: "Işık Örnek", email: "Visitor@example.test" };
  const filter = { status: "pending", from: "2030-01-08", to: "2030-01-08", search: " ışık " };
  assert.equal(matchesAppointment(booking, filter), true);
  assert.equal(matchesAppointment(booking, { ...filter, search: "VISITOR@" }), true);
  assert.equal(matchesAppointment(booking, { ...filter, status: "confirmed" }), false);
  assert.equal(matchesAppointment(booking, { ...filter, to: "2030-01-07" }), false);
  assert.equal(matchesAppointment(booking, { ...filter, search: "başka" }), false);
});

test("login CSRF is tied to a separate pre-login token and issues a fresh authenticated session", async () => {
  const login = createSessionToken("login");
  assert.equal(verifySessionToken(login), false);
  assert.equal(verifySessionToken(login, "login"), true);
  assert.equal(verifySessionToken("1893999999999." + "a".repeat(64)), false);
  const form = adminRequest("login");
  const bad = await loginPost(adminContext("login", form, { session: createSessionToken() }));
  assert.equal(bad.headers.get("location"), "/admin?error=csrf");

  const context = adminContext("login", form, {
    session: login,
    editForm: (body) => body.set("password", "test-admin-password"),
  });
  let issued;
  context.cookies.delete = () => {};
  context.cookies.set = (_name, session) => { issued = session; };
  assert.equal((await loginPost(context)).headers.get("location"), "/admin");
  assert.equal(verifySessionToken(issued), true);
  assert.notEqual(issued, login);
});

test("booking summaries distinguish configuration, Calendar errors, and cached empty data", async (t) => {
  let result = 503;
  let reads = 0;
  mockFetch(t, (url) => {
    assert.equal(url.pathname, calendarPath);
    reads += 1;
    if (result !== 200) return new Response(null, { status: result });
    return Response.json({ items: [] });
  });
  const session = createSessionToken();
  const summary = (refresh = false) => adminBookings({
    cookies: { get: () => ({ value: session }) },
    url: new URL("https://pekmen.test/api/admin/bookings" + (refresh ? "?refresh=1" : "")),
  });
  const previous = process.env.GOOGLE_CLIENT_ID;
  try {
    delete process.env.GOOGLE_CLIENT_ID;
    const missing = await summary();
    assert.equal(missing.status, 503);
    assert.deepEqual(await missing.json(), { ok: false, error: "unconfigured" });
  } finally {
    process.env.GOOGLE_CLIENT_ID = previous;
  }
  const unavailable = await summary(true);
  assert.equal(unavailable.status, 502);
  assert.deepEqual(await unavailable.json(), { ok: false, error: "unavailable" });
  assert.equal((await summary()).status, 502);
  assert.equal(reads, 1);

  result = 200;
  const [fresh, concurrent] = await Promise.all([summary(true), summary(true)]);
  assert.equal(fresh.status, 200);
  const snapshot = await fresh.json();
  assert.match(snapshot.signature, /^[0-9a-f]{64}$/);
  assert.equal(typeof snapshot.checkedAt, "number");
  assert.deepEqual(await concurrent.json(), snapshot);
  assert.deepEqual(await (await summary()).json(), snapshot);
  assert.equal(reads, 2);
});

test("admin refresh pauses when editing, backs off on failures, and resets after a manual refresh", async () => {
  const scheduled = [];
  const checks = [];
  let available = false;
  const refresh = createAdminRefresh({
    canCheck: () => available,
    check: async (manual) => { checks.push(manual); return manual; },
    schedule: (delay) => scheduled.push(delay),
  });
  await refresh();
  assert.deepEqual(checks, []);
  available = true;
  for (let index = 0; index < 4; index += 1) await refresh();
  available = false;
  await Promise.all([refresh(true), refresh(true)]);
  assert.deepEqual(checks, [false, false, false, false, true]);
  assert.deepEqual(scheduled, [45000, 90000, 180000, 300000, 300000, 45000]);
});

test("calendar success and notification failure are independent, and timeouts stay uncertain", async (t) => {
  const { locals } = testCoordinator(t);
  let timeout = false;
  mockFetch(t, (url, init) => {
    if (url.href === "https://api.resend.com/emails") return new Response(null, { status: 503 });
    assert.equal(url.pathname, calendarPath + "/marked");
    if (init.method === "PATCH") {
      if (timeout) throw new DOMException("Timed out", "TimeoutError");
      return Response.json({ id: "marked" });
    }
    return Response.json({
      id: "marked",
      start: { dateTime: "2030-01-07T10:00:00+03:00" },
      end: { dateTime: "2030-01-07T10:30:00+03:00" },
      extendedProperties: { private: { pekmen: "booking", email: "visitor@example.test" } },
    });
  });
  const confirmed = await adminConfirm(adminRequest("marked", true, locals));
  assert.equal(confirmed.headers.get("location"), "/admin?ok=confirmed&mail=0");
  timeout = true;
  const uncertain = await adminConfirm(adminRequest("marked", true, locals));
  assert.equal(uncertain.headers.get("location"), "/admin?error=booking_in_progress");
});

test("admin mutations reject unrelated events and still require an authenticated session", async (t) => {
  const { locals } = testCoordinator(t);
  let reads = 0;
  mockFetch(t, (url, init) => {
    assert.equal(url.origin, "https://www.googleapis.com");
    assert.equal(init.method, undefined);
    const id = url.pathname.split("/").at(-1);
    assert.ok(["title-only", "similar-description", "other-marker"].includes(id));
    reads += 1;
    return Response.json({
      id,
      summary: "Call — Other meeting",
      description: id === "other-marker" ? "Booked via pekmen.net" : "Booked via pekmen.net.example",
      extendedProperties: id === "other-marker" ? { private: { pekmen: "other" } } : undefined,
      start: { dateTime: "2030-01-07T10:00:00+03:00" },
      end: { dateTime: "2030-01-07T10:30:00+03:00" },
    });
  });

  for (const handler of [adminConfirm, adminReschedule, adminCancel]) {
    const unauthenticated = await handler(adminRequest("title-only", false));
    assert.equal(unauthenticated.headers.get("location"), "/admin?error=auth");
    for (const id of ["title-only", "similar-description", "other-marker"]) {
      const response = await handler(adminRequest(id, true, locals));
      assert.equal(response.status, 303);
      assert.equal(response.headers.get("location"), "/admin?error=not_found");
    }
  }
  assert.equal(reads, 9);
});

test("admin can manage marked and legacy bookings", async (t) => {
  const { locals } = testCoordinator(t);
  t.mock.method(Date, "now", () => Date.parse("2030-01-06T09:00:00+03:00"));
  const writes = [];
  mockFetch(t, (url, init) => {
    if (url.href === "https://api.resend.com/emails") return Response.json({ id: "mock-email" });
    assert.equal(url.origin, "https://www.googleapis.com");
    if (url.pathname === calendarPath) return Response.json({ items: [] });
    const id = url.pathname.split("/").at(-1);
    assert.ok(["marked", "legacy"].includes(id));
    if (init.method) {
      writes.push([id, init.method]);
      return init.method === "DELETE" ? new Response(null, { status: 204 }) : Response.json({ id });
    }
    return Response.json({
      id,
      description: id === "legacy" ? "Booked via pekmen.net\r\nName: Visitor" : "Updated description",
      extendedProperties: { private: {
        email: "visitor@example.test",
        ...(id === "marked" ? { pekmen: "booking" } : {}),
      } },
      start: { dateTime: "2030-01-07T10:00:00+03:00" },
      end: { dateTime: "2030-01-07T10:30:00+03:00" },
    });
  });

  for (const id of ["marked", "legacy"]) {
    for (const [handler, status] of [[adminConfirm, "confirmed"], [adminReschedule, "rescheduled"], [adminCancel, "canceled"]]) {
      const response = await handler(adminRequest(id, true, locals));
      assert.equal(response.headers.get("location"), `/admin?ok=${status}&mail=1`);
    }
  }
  assert.deepEqual(writes, [
    ["marked", "PATCH"], ["marked", "PATCH"], ["marked", "DELETE"],
    ["legacy", "PATCH"], ["legacy", "PATCH"], ["legacy", "DELETE"],
  ]);
});

test("form endpoints reject invalid bodies and details before external calls", async (t) => {
  const { locals } = testCoordinator(t);
  const external = t.mock.method(globalThis, "fetch", () => {
    throw new Error("Unexpected external request");
  });

  for (const [path, handler] of [["contact", contactPost], ["booking", bookingPost]]) {
    for (const body of ["null", "[]", '"text"', "false", "12", "{"]) {
      const response = await handler(request(path, body));
      assert.equal(response.status, 400, `${path}: ${body}`);
      assert.deepEqual(await response.json(), { ok: false, error: "invalid_body" });
    }
    const response = await handler(request(path, '{"name":[],"email":"bad"}', "application/json", locals));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, "invalid_details");
  }

  const action = await bookingPost(request("booking", '{"action":false}'));
  assert.equal(action.status, 400);
  assert.equal((await action.json()).error, "unknown_action");
  const month = await bookingGet(request("booking?action=month&month=2030-13"));
  assert.equal(month.status, 400);
  assert.equal((await month.json()).error, "invalid_month");
  assert.equal(external.mock.callCount(), 0);
});

test("contact still sends a valid form to Resend with the visitor as reply-to", async (t) => {
  const external = mockFetch(t, (url, init) => {
    assert.equal(url.href, "https://api.resend.com/emails");
    assert.equal(init.method, "POST");
    const email = JSON.parse(init.body);
    assert.deepEqual(email.to, ["owner@example.test"]);
    assert.equal(email.reply_to, "visitor@example.test");
    assert.match(email.text, /Hello/);
    return Response.json({ id: "mock-email" });
  });

  const body = new URLSearchParams({ name: "Visitor", email: "visitor@example.test", message: "Hello" });
  const response = await contactPost(request("contact", body, "application/x-www-form-urlencoded"));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(external.mock.callCount(), 1);
});

test("booking holds the slot without inviting the guest and attempts both emails", async (t) => {
  const { locals } = testCoordinator(t);
  t.mock.method(Date, "now", () => Date.parse("2030-01-06T09:00:00+03:00"));
  const recipients = [];
  let calendarEvent;
  mockFetch(t, (url, init) => {
    if (url.href === "https://api.resend.com/emails") {
      recipients.push(...JSON.parse(init.body).to);
      return Response.json({ id: "mock-email" });
    }
    assert.equal(url.origin, "https://www.googleapis.com");
    assert.equal(url.pathname, calendarPath);
    if (!init.method) return Response.json({ items: [] });
    assert.equal(init.method, "POST");
    assert.equal(url.searchParams.get("sendUpdates"), "none");
    calendarEvent = JSON.parse(init.body);
    return Response.json({ id: calendarEvent.id });
  });

  const start = "2030-01-07T10:00:00+03:00";
  const response = await bookingPost(request("booking", JSON.stringify({
    action: "book", name: "Visitor", email: "visitor@example.test", start, lang: "tr",
  }), "application/json", locals));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).event.status, "pending");
  assert.equal(calendarEvent.start.dateTime, start);
  assert.equal(calendarEvent.end.dateTime, "2030-01-07T10:30:00+03:00");
  assert.equal(calendarEvent.attendees, undefined);
  assert.equal(calendarEvent.extendedProperties.private.status, "pending");
  assert.deepEqual(recipients, ["visitor@example.test", "owner@example.test"]);
});

const firstSlot = "2030-01-07T10:00:00+03:00";
const adjacentSlot = "2030-01-07T10:30:00+03:00";

function postBooking(locals, start = firstSlot, name = "Visitor") {
  return bookingPost(request("booking", JSON.stringify({
    action: "book", name, email: "visitor@example.test", start,
  }), "application/json", locals));
}

function mockBookingCalendar(t, behavior = {}) {
  const events = new Map();
  const writes = [];
  const emails = [];
  mockFetch(t, (url, init) => {
    if (url.href === "https://api.resend.com/emails") {
      emails.push(JSON.parse(init.body));
      return Response.json({ id: "mock-email" });
    }
    assert.equal(url.origin, "https://www.googleapis.com");
    if (url.pathname === calendarPath && !init.method) {
      return Response.json({ items: behavior.staleList ? [] : [...events.values()] });
    }
    if (url.pathname === calendarPath && init.method === "POST") {
      const event = JSON.parse(init.body);
      writes.push(event);
      if (behavior.insert) return behavior.insert(event, events, init);
      events.set(event.id, event);
      return Response.json(event);
    }
    assert.ok(url.pathname.startsWith(calendarPath + "/"));
    const id = url.pathname.split("/").at(-1);
    if (init.method === "PATCH") {
      const update = JSON.parse(init.body);
      writes.push(update);
      assert.equal(init.headers["If-Match"], '"legacy-version"');
      return behavior.patch(update, events, init);
    }
    if (init.method === "DELETE") {
      events.delete(id);
      return new Response(null, { status: 204 });
    }
    assert.equal(init.method, undefined);
    const event = events.get(id);
    return event ? Response.json(event) : new Response(null, { status: 404 });
  });
  return { events, writes, emails };
}

test("parallel creates reject the same slot and a buffer overlap even with a stale Google listing", async (t) => {
  t.mock.method(Date, "now", () => Date.parse("2030-01-06T09:00:00+03:00"));
  const { locals } = testCoordinator(t);
  let release;
  let started;
  const writing = new Promise((resolve) => { started = resolve; });
  const gate = new Promise((resolve) => { release = resolve; });
  const { writes, emails } = mockBookingCalendar(t, {
    staleList: true,
    async insert(event) {
      started();
      await gate;
      return Response.json(event);
    },
  });

  const first = postBooking(locals);
  await writing;
  try {
    for (const slot of [firstSlot, adjacentSlot]) {
      const conflict = await postBooking(locals, slot, "Second visitor");
      assert.equal(conflict.status, 409);
      assert.equal((await conflict.json()).error, "slot_taken");
    }
    const replay = await postBooking(locals);
    assert.equal(replay.status, 503);
    assert.equal((await replay.json()).error, "booking_in_progress");
  } finally {
    release();
  }
  assert.equal((await first).status, 200);
  assert.equal((await postBooking(locals)).status, 200);
  assert.equal(writes.length, 1);
  assert.equal(emails.length, 2);
});

test("a definitive Google rejection releases the reservation for retry", async (t) => {
  t.mock.method(Date, "now", () => Date.parse("2030-01-06T09:00:00+03:00"));
  const { locals } = testCoordinator(t);
  let reject = true;
  const { writes, emails } = mockBookingCalendar(t, {
    insert(event) {
      if (reject) return new Response(null, { status: 403 });
      return Response.json(event);
    },
  });
  const denied = await postBooking(locals);
  assert.equal(denied.status, 502);
  assert.equal((await denied.json()).error, "google_auth");
  assert.equal(emails.length, 0);
  reject = false;
  assert.equal((await postBooking(locals)).status, 200);
  assert.equal(writes.length, 2);
});

test("an ambiguous create survives a SQLite restart and reconciles without a second insert", async (t) => {
  t.mock.method(Date, "now", () => Date.parse("2030-01-06T09:00:00+03:00"));
  const directory = mkdtempSync(join(tmpdir(), "pekmen-booking-"));
  const coordinator = testCoordinator(t, join(directory, "bookings.sqlite"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const { locals } = coordinator;
  const { writes, events, emails } = mockBookingCalendar(t, {
    staleList: true,
    insert(_event, _events, init) {
      assert.ok(init.signal instanceof AbortSignal);
      throw new DOMException("Request timed out", "TimeoutError");
    },
  });

  const uncertain = await postBooking(locals);
  assert.equal(uncertain.status, 503);
  assert.equal((await uncertain.json()).error, "booking_in_progress");
  coordinator.restart();
  assert.equal((await postBooking(locals)).status, 503);
  assert.equal((await postBooking(locals, adjacentSlot, "Second visitor")).status, 409);
  events.set(writes[0].id, writes[0]);
  await coordinator.alarm();
  coordinator.restart();
  const replay = await postBooking(locals);
  assert.equal(replay.status, 200);
  assert.equal((await replay.json()).event.status, "pending");
  assert.equal(writes.length, 1);
  assert.equal(emails.length, 0);
});

test("failed and uncertain moves preserve the old event and block the correct ranges", async (t) => {
  let now = Date.parse("2030-01-06T09:00:00+03:00");
  t.mock.method(Date, "now", () => now);
  const { locals, alarm } = testCoordinator(t);
  let status = 412;
  const { writes, events, emails } = mockBookingCalendar(t, {
    staleList: true,
    patch() { return new Response(null, { status }); },
  });
  const original = {
    id: "legacy-event",
    etag: '"legacy-version"',
    description: "Booked via pekmen.net\nName: Visitor",
    start: { dateTime: firstSlot },
    end: { dateTime: adjacentSlot },
    attendees: [{ email: "visitor@example.test" }],
  };
  events.set(original.id, original);
  const target = "2030-01-08T10:00:00+03:00";
  const move = () => adminReschedule(adminRequest(original.id, true, locals, target));

  assert.equal((await move()).headers.get("location"), "/admin?error=slot");
  assert.equal(events.get(original.id), original);
  assert.equal(emails.length, 0);

  status = 503;
  assert.equal((await move()).headers.get("location"), "/admin?error=booking_in_progress");
  assert.equal((await move()).headers.get("location"), "/admin?error=booking_in_progress");
  for (const slot of [firstSlot, target]) {
    assert.equal((await postBooking(locals, slot)).status, 409);
  }
  assert.equal(writes.length, 2);
  assert.equal(events.get(original.id), original);
  assert.equal(emails.length, 0);

  now = Date.parse("2030-01-08T10:41:00+03:00");
  await alarm();
  const canceled = await adminCancel(adminRequest(original.id, true, locals));
  assert.equal(canceled.headers.get("location"), "/admin?ok=canceled&mail=1");
});

test("an in-flight legacy move and a create compete for the same buffered range", async (t) => {
  t.mock.method(Date, "now", () => Date.parse("2030-01-06T09:00:00+03:00"));
  const { locals } = testCoordinator(t);
  let started;
  let release;
  const writing = new Promise((resolve) => { started = resolve; });
  const gate = new Promise((resolve) => { release = resolve; });
  const original = {
    id: "legacy-event",
    etag: '"legacy-version"',
    description: "Booked via pekmen.net",
    start: { dateTime: "2030-01-07T14:00:00+03:00" },
    end: { dateTime: "2030-01-07T14:30:00+03:00" },
    attendees: [{ email: "visitor@example.test" }],
  };
  const { writes, events, emails } = mockBookingCalendar(t, {
    staleList: true,
    async patch(update, calendar) {
      started();
      await gate;
      const moved = { ...original, ...update };
      calendar.set(original.id, moved);
      return Response.json(moved);
    },
  });
  events.set(original.id, original);
  const move = () => adminReschedule(adminRequest(original.id, true, locals, firstSlot));
  const pending = move();
  await writing;
  try {
    assert.equal((await postBooking(locals, adjacentSlot)).status, 409);
  } finally {
    release();
  }
  assert.equal((await pending).headers.get("location"), "/admin?ok=rescheduled&mail=1");
  assert.equal((await move()).headers.get("location"), "/admin?ok=rescheduled&mail=skipped");
  assert.equal(writes.length, 1);
  assert.equal(emails.length, 1);
  assert.equal(events.get(original.id).start.dateTime, firstSlot);
});
