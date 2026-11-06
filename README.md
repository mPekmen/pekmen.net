# pekmen.net

My personal corner of the web.

A place for the things I've built, the occasional note, and a way to get in touch. Designed and developed by me, with an emphasis on typography, speed, and keeping things simple.

**[pekmen.net](https://pekmen.net)**

## Built with

- Astro & TypeScript
- Cloudflare Workers
- Cloudflare Durable Objects
- Google Calendar API
- Resend

The site is server-rendered and available in English, Turkish, and German.

## A little more than a portfolio

Alongside the usual project pages, there's a booking system connected to Google Calendar.

Visitors can request a meeting, and I can review, confirm, reschedule, or cancel it from a private dashboard.

Durable Objects coordinate reservations to prevent overlapping bookings.

## Running locally

Node.js 22 or newer is required.

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` and configure the services you want to use.

To check the project:

```bash
npm run check
npm test
npm run build
```

Additional setup notes are in [technical documentation](docs/technical.md).

## Usage

The source is public for reference and learning. No permission to reuse or redistribute the code or included assets is granted.

---

Built and maintained by Mert Pekmen.