import type { APIRoute } from "astro";
import { emailLayout } from "../../server/email-template";

export const prerender = false;

/**
 * Development-only preview of the transactional emails, so the layout can be
 * checked in a browser without sending anything.
 *
 *   /api/email-preview?kind=contact
 *   /api/email-preview?kind=booking
 */
export const GET: APIRoute = ({ url }) => {
  if (!import.meta.env.DEV) {
    return new Response("Not found", { status: 404 });
  }

  const kind = url.searchParams.get("kind") ?? "contact";

  const body =
    kind === "booking"
      ? emailLayout({
          preheader: "Ayşe Yılmaz — 4 Kasım Çarşamba 14:00",
          kicker: "New call",
          title: "Ayşe Yılmaz booked a call",
          intro:
            "The slot is confirmed in Google Calendar and the guest has the invite.",
          rows: [
            {
              label: "When",
              value: "4 Kasım 2026 Çarşamba, 14:00 (Europe/Istanbul)",
            },
            {
              label: "Email",
              value: "ayse@example.com",
              href: "mailto:ayse@example.com",
            },
            {
              label: "Note",
              value:
                "Yeni bir ürün sayfası için Astro üzerinde çalışan bir ekip arıyoruz.",
            },
          ],
          actions: [
            {
              label: "Google Meet",
              href: "https://meet.google.com/abc-defg-hij",
            },
            {
              label: "Calendar event",
              href: "https://calendar.google.com/event?eid=example",
            },
          ],
          footer: "Replying to this email writes to the guest, not to you.",
        })
      : emailLayout({
          preheader: "Ayşe Yılmaz — ayse@example.com",
          kicker: "Contact form",
          title: "New message from Ayşe Yılmaz",
          intro: "Sent from the contact form on pekmen.net.",
          rows: [
            { label: "Name", value: "Ayşe Yılmaz" },
            {
              label: "Email",
              value: "ayse@example.com",
              href: "mailto:ayse@example.com",
            },
          ],
          quote:
            "Merhaba, portfolyodaki BarBer vakasını inceledim. Benzer bir randevu sistemi kurmak istiyoruz — kapsamı konuşabilir miyiz?",
          actions: [
            { label: "Reply by email", href: "mailto:ayse@example.com" },
          ],
          footer: "Reply to this email and it goes straight to the sender.",
        });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Email preview — ${kind}</title>
<style>body{margin:0;background:#ece2cf;}</style>
</head>
<body>${body}</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
};
