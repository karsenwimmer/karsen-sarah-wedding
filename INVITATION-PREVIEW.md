# Karsen & Sarah invitation preview

Route: `/invitation`. The homepage and `/demo/rsvp` are unchanged and do not link to it.
All implementation files are scoped to `src/app/invitation/`. Existing fonts, monogram and
Bronte Harbour watercolor are reused in a new stationery layout with ivory, sage and powder blue.

Public sample codes: HARBOUR (couple), FAMILY (four guests, two children), CHURCH (church celebration).
These are fictional fixtures, not credentials or real invited households. The route has noindex metadata,
but is publicly accessible to anyone with the URL. Noindex is not access control.

Preview replies are saved only in `localStorage`, using `ks-invitation-preview:v1:<CODE>`.
They do not reach Supabase, send email, synchronize across devices, or update the admin dashboard.
The site explains this on entry, in the RSVP form, and after saving. Browser storage failures are shown.
Real guest records and the existing demo storage are not read or modified.

The wedding date and reception venue come from the existing project. Ceremony, addresses, times,
dress code, deadline, transportation, accommodation, final meals and activity links remain unconfirmed
and are presented as forthcoming. The tentative church is not displayed as a confirmed venue.
Calendar links create an all-day event; no invented start time is used.

Before accepting real RSVPs: finalize those details, connect server-side invitation verification and
durable per-guest responses, enforce invitation packages and deadlines on the server, generate real
invitation codes/QR links, add confirmation email and admin reporting/export. Public fixtures must
never be replaced with real household data in browser code. Build server access instead.

The main save-the-date should only be replaced when the couple is ready to send formal invitations.
