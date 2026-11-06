# Technical notes

This is the implementation reference for [pekmen.net](https://pekmen.net). The main README is intentionally short.

## Runtime

- **Astro 7** renders the site on Cloudflare Workers through `@astrojs/cloudflare`.
- **TypeScript** is used across the application.
- The site has English (`/`), Turkish (`/tr/`), and German (`/de/`) routes. Middleware resolves the language and rewrites to the shared page implementation.
- **Cloudflare Durable Objects** coordinate appointment writes. The `BOOKING_COORDINATOR` binding points to `BookingCoordinator` in `src/worker.ts`.
- **Google Calendar** supplies availability and stores appointment requests. **Resend** sends contact and appointment emails.

## Local development

Requires Node.js 22 or later.

```bash
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell, copy the template with `Copy-Item .env.example .env`.

Available scripts:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Astro locally |
| `npm run check` | Astro and TypeScript checks |
| `npm test` | Run backend tests with mocked integrations |
| `npm run build` | Build the Worker output |
| `npm run preview` | Preview the built application |
| `npm run deploy` | Build and deploy via Wrangler |
| `npm run google:auth` | Run the local Google OAuth helper |

The `.env.example` file lists configurable variables. Keep real credentials in ignored local files or Cloudflare encrypted secrets; never commit them. The local `workerd` runtime can use `.dev.vars`.

## App layout

| Path | Responsibility |
| --- | --- |
| `src/pages/` | Portfolio, writing, contact, appointment and admin pages |
| `src/pages/api/` | Contact, booking and administrative endpoints |
| `src/components/` | Shared components and forms |
| `src/data/` | Portfolio content, posts and site metadata |
| `src/i18n/` | Localization utilities |
| `src/middleware.ts` | Locale routing and response security headers |
| `src/server/` | Calendar, email, validation and server helpers |
| `src/worker.ts` | Cloudflare Worker entry point and Durable Object |
| `tests/` | Backend integration tests with mocked external services |

Localized pages share page implementations rather than maintaining three separate copies.

## Appointments

Visitors choose an available slot and submit a request. The server creates a Google Calendar event; the private admin dashboard handles confirmation, rescheduling and cancellation. Notifications use Resend.

The Durable Object serializes potentially conflicting booking operations. Keep its class name, `BOOKING_COORDINATOR` binding and the existing `booking-coordinator-v1` migration compatible when deploying changes. Avoid switching the calendar identity without reviewing existing reservations.

Useful endpoints include:

- `GET /api/booking?action=month&month=YYYY-MM`
- `GET /api/booking?action=availability&date=YYYY-MM-DD`
- `POST /api/booking`
- `POST /api/contact`

Administrative routes under `/api/admin/` require an authenticated session and appropriate request protections.

## Environment and services

- **Resend:** `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM`
- **Google Calendar:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID`
- **Admin:** `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`; optional `ADMIN_ORIGIN`
- **Booking:** timezone, working hours, slot duration, buffer and booking horizon are configurable in `.env.example`.

For the OAuth helper, configure a Google Cloud OAuth client with the local redirect URI `http://localhost:53682/callback` and run `npm run google:auth`. Keep the resulting refresh token private.

## Deployment

The production application runs as a **Cloudflare Worker**, not a static Pages site.

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Production branch: `main`
- Custom domain: `pekmen.net`
- Worker configuration: `wrangler.jsonc`

Set runtime secrets in **Cloudflare → Workers & Pages → pekmen-net → Settings → Variables and Secrets**. Do not place them in repository configuration or commit them.

Git-connected builds are managed from Cloudflare's Builds settings. Test changes before enabling deployment; successful pushes to `main` can trigger a production deployment when builds are enabled.

## Security and maintenance

The admin panel uses an authenticated session; state-changing requests also validate origin and CSRF protections. Response headers include a content security policy and other browser protections. Local in-memory rate limits are not a substitute for edge enforcement: configure Cloudflare WAF rate limiting for `/api/admin/login`, and consider Cloudflare Access for `/admin` and `/api/admin/*`.

Before shipping changes, run:

```bash
npm run check
npm test
npm run build
```

Review dependency updates and image/content permissions separately. A passing test suite or secret scan does not establish that every security or licensing issue is resolved.
