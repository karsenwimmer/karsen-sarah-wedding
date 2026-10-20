# Invitation demonstration

The standalone `/demo/rsvp` route uses fictional wedding details and public sample invitations:

| Code | Invitation |
| --- | --- |
| ROSE24 | Couple, ceremony and reception |
| OAK123 | Family of four, including two children |
| FERN26 | Couple, ceremony only |

Guest responses are saved only in the browser under `wedding-rsvp-demo:v1:<CODE>`.
They do not reach Supabase, send emails, modify real guest records, or synchronize between devices.
Codes are visible demo fixtures, not authentication. Do not replace them with real guest information.
Reset clears only the three demo storage keys after confirmation.

All new UI and styles live inside `src/app/demo/rsvp`. The homepage, mailing form,
admin dashboard, global stylesheet, wedding configuration, and database are unchanged.
The route is not linked from the homepage and has noindex metadata. It is publicly
accessible to anyone with the URL; this is suitable for the fictional demonstration.

For a live version, use a separate deployment/database for the couple and add server-side
invitation verification, durable per-guest responses, RSVP deadline enforcement, confirmation
emails, and admin response reporting/export before accepting real RSVPs.
