# Pekmen Studio

## Production cutover for v1.1

1. In Cloudflare Zero Trust, add `pekmen.net/studio` and `pekmen.net/studio/*` to the existing protected Studio application. Also protect `pekmen.net/api/admin` and `pekmen.net/api/admin/*` with the same operator policy. Keep the existing `/admin` protection for old bookmarks. The API namespace stays `/api/admin`.
2. Verify with a signed-out browser and direct HTTP requests that both Studio paths and the admin APIs are intercepted by Access. Test an allowed operator session on a protected staging or preview environment where available. Do this before merging to the auto-deploying main branch. The application also checks its signed session and checks origin plus action-bound CSRF on writes. Alternate Worker hostnames cannot serve Studio.
3. If activating D1, apply both migrations before deploying the binding. Existing databases that already applied `0001_messages.sql` need only the pending `0002_management.sql` migration. Keep existing message records, and do not change booking Durable Object bindings.
4. After release, verify that signed-in operators can open `/studio` and that old `/admin` links redirect to the matching section. Check the public sitemap, RSS, and project and blog URLs. Cloudflare cache rules must respect `no-store` on managed HTML, feeds and Studio media.

See [Cloudflare Access application paths](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/).

Overview, Appointments and Settings use the existing calendar snapshot. Projects and Content read the same TypeScript data as the public site. The language preference lives in a cookie scoped to Studio.

## Message storage

Without the optional `STUDIO_MESSAGES` D1 binding, the contact form continues delivering through Resend and Studio shows that storage is disconnected. With the binding, the form saves validated messages in D1 and still attempts Resend delivery. A successful write to either destination accepts the submission. Studio displays messages received after activation, ordered newest first. Archiving hides a message from the inbox and does not delete it.

To enable this in production, provision a dedicated D1 database and add a `d1_databases` entry to `wrangler.jsonc` with binding `STUDIO_MESSAGES`, the actual database name and ID, and `"migrations_dir": "migrations/studio"`. Apply and verify the migrations before the binding is deployed. Establish who handles deletion requests and the existing twelve-month retention commitment for D1 messages, replies and email. Existing email messages are not imported. Replies require the existing Resend configuration. “Accepted by Resend” records API acceptance. Unverified results should be checked in Resend before an operator sends again.

See [Cloudflare D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/).

## Publishing

Project and blog source files provide initial public content. Studio stores drafts and published snapshots separately. Saving a draft leaves the live snapshot in place. Publish updates the server-rendered public lists, details, sitemap and RSS on the next request. Unpublishing removes the public entry and keeps its draft and original source files. URLs stay stable through edits.

Blog text uses plain paragraphs. Text is escaped in previews, public pages, email and structured data. Project cover uploads accept PNG, JPEG or WebP up to 512 KB and are stored in D1. An uploaded image is public only while referenced by a published project. Gallery controls apply to the existing project screenshots. Booking settings remain read-only because the public scheduler and Durable Object must enforce the same rules. Settings can publish the localized homepage introduction.

## Analytics

The public site receives the Cloudflare Web Analytics beacon at the edge. To connect Studio, set `STUDIO_ANALYTICS_ACCOUNT` to the Cloudflare account ID and `STUDIO_ANALYTICS_SITE` to the Web Analytics site tag. Set `STUDIO_ANALYTICS_TOKEN` as a Worker secret. Use a custom account-scoped token with Account Analytics Read, restricted to the relevant resources. Verify the account can query `rumPageloadEventsAdaptiveGroups` before enabling it. Studio reports Cloudflare visits for the last 7 or 30 completed UTC days and handles unavailable groups separately. Visits are not unique people.

See [Cloudflare Analytics token configuration](https://developers.cloudflare.com/analytics/graphql-api/getting-started/authentication/api-token-auth/).
