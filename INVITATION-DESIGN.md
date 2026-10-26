# Invitation background and layout revision

The `/invitation` route uses `public/images/invitation-sailboats-v1.webp`, generated with the built-in image generation tool from the original save-the-date watercolor and the user’s reference crop. The original artwork remains unchanged. The scene expands the sailboats and pale sky, without the Boathouse building or waterfront boardwalk.

## Generation prompt

Use case: precise-object-edit. Asset type: watercolor background for Karsen and Sarah’s wedding invitation website. Input image 1 is the original save-the-date watercolor, the edit target and authoritative style reference. Input image 2 is a screenshot crop indicating the RIGHT side of that original: pale sky and moored sailboats; ignore and REMOVE all text, countdown, browser edges and UI from that screenshot. Primary request: recompose and expand ONLY that right-hand harbor scene into a wide landscape background, around 3:2 aspect ratio. No boathouse building, no lighthouse, no architecture, no boardwalk, no foreground walkway, no flowers or fences. Preserve the original very light, warm ivory watercolor-paper texture, subtle powder-blue/grey sky washes, subdued sage distant shoreline and delicate softly sketched moored white sailboats with occasional tiny muted blue accents. Composition: upper 60 percent is very pale luminous sky and quiet paper negative space for dark wedding typography. A small group of sailboats stretches naturally across the lower portion, hulls around 80 percent down the canvas, mast tips beginning around 55-60 percent down, all directly BELOW the future main lettering. The bottom 15-20 percent is still pale harbor water with soft reflections fading gently into warm ivory at the bottom edge. Keep the scene airy and closely matched to the original image’s hand-painted watercolor medium and restrained contrast. Sailboats should be clearly recognizable but delicate and must not crowd or overlap the future title area. No text, no monogram, no border, no typography, no interface, no people, no watermark. This is only the clean painting asset, not a screenshot or a website mockup.

## Page structure

Centered, full-width opening → personalized household note → expanded RSVP or compact saved-reply strip → combined schedule and venues → Dress Code → Transportation → FAQs → photos and activity placeholders.

The original RSVP form design is retained. Successful saves collapse the whole form area; editing restores its answers. Canceling an edit restores the last saved response. Failed saves leave the form open and never claim success.

## Response storage

Public sample codes remain fictional and browser-local, with the last selected sample remembered in this browser. No real access codes or live responses are cached in browser storage.

Real invitations use server actions and the existing Supabase database. Only enabled, unrevoked `households.rsvp_short_code` records grant access. Every save rechecks access and validates the current invited guest IDs. Replies are appended to `submission_events` with `event_type=rsvp_response` and `source=formal_invitation`; the latest matching event is authoritative. Household RSVP timestamps are updated after the event is saved. The schema is unchanged, and no fixtures are inserted into the real guest list. New server actions use the existing IP rate-limiting helper.

Real response persistence is implemented and covered by service and UI tests. No real invitation code has been issued or used for a live submission in this task. Real menu selections remain closed until the menu is finalized; attendance and dietary information can be saved for an enabled invitation. Preview menus stay within public fixtures. Confirmation email and admin response reporting remain future work.

Before sending formal invitations: finalize ceremony, addresses, schedule, dress code, transportation, RSVP deadline and meals; issue random individual household codes (8–32 uppercase letters/digits); enable appropriate households; add final deadline enforcement, confirmation emails and reporting. Keep the save-the-date homepage until the couple is ready to switch.
