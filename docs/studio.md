# Pekmen Studio

Overview, Appointments and Settings use the existing calendar snapshot. Projects and Content read the same TypeScript data as the public site. The language preference lives in a cookie scoped to Studio.

## Message storage

Without the optional `STUDIO_MESSAGES` D1 binding, the contact form continues delivering through Resend and Studio shows that storage is disconnected. With the binding, the form saves validated messages in D1 and still attempts Resend delivery. A successful write to either destination accepts the submission. Studio displays messages received after activation, ordered newest first. Archiving hides a message from the inbox and does not delete it.

To enable this in production, provision a dedicated D1 database, apply `migrations/studio/0001_messages.sql` to it and add a `d1_databases` entry to `wrangler.jsonc` with binding `STUDIO_MESSAGES`, the actual database name and ID, and `"migrations_dir": "migrations/studio"`. Apply and verify the migration before the binding is deployed. Establish who handles deletion requests and the existing twelve-month retention commitment for both D1 and email before enabling storage. Existing email messages are not imported.

See [Cloudflare D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/).

## Analytics

The public site receives the Cloudflare Web Analytics beacon at the edge. Studio does not have a reporting API connection. Its Analytics page links to Cloudflare for the existing reports. Displaying metrics directly in Studio requires choosing an available reporting dataset and provisioning server-side read access for it.
