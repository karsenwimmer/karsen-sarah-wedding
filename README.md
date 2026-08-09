# Karsen & Sarah Wedding Website

Production site: https://thewimmers.ca

Canonical domain: thewimmers.ca

Sending domain: wedding@thewimmers.ca

## Current Scope

This repository currently contains the save-the-date, mailing form, email notifications, and first private admin dashboard:

- Next.js App Router with TypeScript
- Tailwind CSS design tokens
- Central wedding configuration in `src/config/wedding.ts`
- Static save-the-date layout
- Generated Bronte Harbour watercolor artwork at `public/images/bronte-harbour-watercolour.webp`
- Click-to-open envelope intro with a linen envelope, wax seal, letter zoom transition, and session storage
- Hero section with venue copy and a timezone-correct countdown
- Household mailing-information form
- Supabase SQL migration for household storage, household members, submission events, and future RSVP fields
- Server-side form validation, rate limiting, create/update persistence, and no anonymous Supabase table access
- Resend guest confirmation emails and couple notification emails
- Password-protected private admin dashboard at `/admin`
- Static Updates and FAQ sections
- Noindex metadata and `robots.txt`
- Vercel redirect config for `www.thewimmers.ca` to `thewimmers.ca`

RSVP flows, RSVP emails, invitation tokens, and dashboard editing controls are intentionally not implemented yet.

## Local Setup

Install dependencies:

```bash
npm install
```

Run the local site:

```bash
npm run dev
```

Open the local URL printed by Next.js, usually:

```text
http://localhost:3000
```

Copy `.env.example` to `.env.local` and fill in the Supabase values before testing real submissions:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...
RESEND_FROM_EMAIL=wedding@thewimmers.ca
COUPLE_NOTIFICATION_EMAIL=...
ADMIN_DASHBOARD_PASSWORD=...
```

Apply the Supabase migration in:

```text
supabase/migrations/202608060001_initial_household_schema.sql
```

Until Supabase is connected, the form will render locally but show a connection message when submitted.

## Review Checklist

- Confirm the watercolor direction feels like Bronte Harbour and The Boathouse.
- Review the click-to-open envelope animation.
- Check the hero at desktop and phone widths.
- Confirm the countdown reads naturally and does not dominate the layout.
- Review the wording in Updates, FAQ, and the mailing-information form.
- Submit a test household after Supabase env vars and the migration are in place.

To replay the envelope in the same browser session, clear session storage for the local site or open a fresh private browsing window.

## Domain And Vercel Notes

Use `https://thewimmers.ca` for canonical metadata, Open Graph URLs, confirmation email links, RSVP links, admin links, and `NEXT_PUBLIC_SITE_URL` in production.

The Vercel project should connect to this GitHub repository:

```text
karsenwimmer/karsen-sarah-wedding
```

The custom domain `thewimmers.ca` should be attached to that Vercel project. `www.thewimmers.ca` is configured to permanently redirect to `https://thewimmers.ca`.

Guest confirmations and couple notifications send from `wedding@thewimmers.ca` through Resend. The admin dashboard uses `ADMIN_DASHBOARD_PASSWORD` and a secure HTTP-only cookie.

Formal RSVP links, RSVP token handling, RSVP short codes, invitation QR codes, meal selections, and admin RSVP controls remain future work.
