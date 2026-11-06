import type { APIRoute } from "astro";
import {
  contactRecipient,
  contactSender,
  isEmailConfigured,
} from "../../server/config";
import { sendEmail } from "../../server/email";
import { emailLayout } from "../../server/email-template";
import { clientIp, isSameOrigin, json, readRequestObject } from "../../server/http";
import { rateLimit } from "../../server/rate-limit";

export const prerender = false;

const MAX = {
  name: 120,
  email: 200,
  message: 5000,
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!isSameOrigin(request)) {
    return json({ ok: false, error: "forbidden" }, 403);
  }

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 32_000) {
    return json({ ok: false, error: "too_large" }, 413);
  }

  const ip = clientIp(request, clientAddress);

  if (!rateLimit(`contact:${ip}`, 5, 10 * 60_000)) {
    return json({ ok: false, error: "rate_limited" }, 429);
  }

  let body: Record<string, unknown>;

  try {
    body = await readRequestObject(request);
  } catch {
    return json({ ok: false, error: "invalid_body" }, 400);
  }

  // Honeypot: pretend it worked so bots don't retry.
  if (readString(body.botcheck, 200)) {
    return json({ ok: true });
  }

  const name = readString(body.name, MAX.name);
  const email = readString(body.email, MAX.email);
  const message = readString(body.message, MAX.message);

  if (!name || !email || !message) {
    return json({ ok: false, error: "invalid_details" }, 400);
  }

  if (!isEmail(email)) {
    return json({ ok: false, error: "invalid_email" }, 400);
  }

  if (!isEmailConfigured()) {
    return json(
      {
        ok: false,
        error: "not_configured",
        mailto: contactRecipient(),
      },
      503
    );
  }

  const recipient = contactRecipient();
  const sender = contactSender();
  // A name is free text; strip line breaks so it cannot smuggle extra headers
  // into the subject line.
  const safeName = headerSafe(name);

  try {
    await sendEmail({
      to: recipient,
      from: sender,
      replyTo: email,
      subject: `pekmen.net — ${safeName}`,
      text: [
        `New message from pekmen.net`,
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        "",
        message,
      ].join("\n"),
      html: emailLayout({
        preheader: `${name} — ${email}`,
        kicker: "Contact form",
        title: `New message from ${name}`,
        intro: "Sent from the contact form on pekmen.net.",
        rows: [
          { label: "Name", value: name },
          { label: "Email", value: email, href: `mailto:${email}` },
        ],
        quote: message,
        actions: [{ label: "Reply by email", href: `mailto:${email}` }],
        footer: "Reply to this email and it goes straight to the sender.",
      }),
    });

    return json({ ok: true });
  } catch {
    return json({ ok: false, error: "send_failed" }, 502);
  }
};

function readString(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

/** Collapses control characters so user input cannot break email headers. */
function headerSafe(value: string): string {
  return value
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 120);
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
