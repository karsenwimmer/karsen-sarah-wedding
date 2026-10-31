# Invitation background and layout revision

The `/invitation` route uses `public/images/invitation-sailboats-v1.webp`, generated with the built-in image generation tool from the original save-the-date watercolor and the user’s reference crop. The original artwork remains unchanged. The scene expands the sailboats and pale sky, without the Boathouse building or waterfront boardwalk.

## Generation prompt

Use case: precise-object-edit. Asset type: watercolor background for Karsen and Sarah’s wedding invitation website. Input image 1 is the original save-the-date watercolor, the edit target and authoritative style reference. Input image 2 is a screenshot crop indicating the RIGHT side of that original: pale sky and moored sailboats; ignore and REMOVE all text, countdown, browser edges and UI from that screenshot. Primary request: recompose and expand ONLY that right-hand harbor scene into a wide landscape background, around 3:2 aspect ratio. No boathouse building, no lighthouse, no architecture, no boardwalk, no foreground walkway, no flowers or fences. Preserve the original very light, warm ivory watercolor-paper texture, subtle powder-blue/grey sky washes, subdued sage distant shoreline and delicate softly sketched moored white sailboats with occasional tiny muted blue accents. Composition: upper 60 percent is very pale luminous sky and quiet paper negative space for dark wedding typography. A small group of sailboats stretches naturally across the lower portion, hulls around 80 percent down the canvas, mast tips beginning around 55-60 percent down, all directly BELOW the future main lettering. The bottom 15-20 percent is still pale harbor water with soft reflections fading gently into warm ivory at the bottom edge. Keep the scene airy and closely matched to the original image’s hand-painted watercolor medium and restrained contrast. Sailboats should be clearly recognizable but delicate and must not crowd or overlap the future title area. No text, no monogram, no border, no typography, no interface, no people, no watermark. This is only the clean painting asset, not a screenshot or a website mockup.

## Page structure

Centered, full-width opening → personalized RSVP section or compact saved-reply strip → combined schedule and venues → Dress Code → Transportation → FAQs → photos and activity placeholders.

The RSVP introduction greets the household by name and explains that choices are made for each guest. It stays sticky on the left while the form scrolls naturally on the right, matching the save-the-date contact layout. On narrow or short screens it stays in normal document flow. Household identity also remains on the saved-reply strip; Change invitation is available with the introduction and in the footer. The separate household banner is removed. Successful saves collapse the whole form area; editing restores its answers. Canceling an edit restores the last saved response. Failed saves leave the form open and never claim success.

## Response storage

Public sample codes remain fictional and browser-local. During design trials, every visit starts at code entry, including browsers with a previously remembered sample code. Saved sample replies remain available after re-entering the same code. No real access codes or live responses are cached in browser storage.

Real invitations use server actions and the existing Supabase database. Only enabled, unrevoked `households.rsvp_short_code` records grant access. Every save rechecks access and validates the current invited guest IDs. Replies are appended to `submission_events` with `event_type=rsvp_response` and `source=formal_invitation`; the latest matching event is authoritative. Household RSVP timestamps are updated after the event is saved. The schema is unchanged, and no fixtures are inserted into the real guest list. New server actions use the existing IP rate-limiting helper.

Real response persistence is implemented and covered by service and UI tests. No real invitation code has been issued or used for a live submission in this task. Real menu selections remain closed until the menu is finalized; attendance and dietary information can be saved for an enabled invitation. Preview menus stay within public fixtures. Confirmation email and admin response reporting remain future work.

Before sending formal invitations: finalize ceremony, addresses, schedule, dress code, transportation, RSVP deadline and meals; issue random individual household codes (8–32 uppercase letters/digits); enable appropriate households; add final deadline enforcement, confirmation emails and reporting. Keep the save-the-date homepage until the couple is ready to switch.

## Simple code entrance

The opening reuses the save-the-date monogram, exact script name and date styling, serif RSVP label and shared live Countdown component. Code entry sits immediately beneath the timer, with an Unlock button and line-art lock icon. A recognized code opens the lock for 650ms, then reveals the page and smoothly scrolls to the RSVP form or saved reply, moving keyboard focus to its heading. Invalid codes keep the lock closed. Reduced-motion guests skip the animation and scroll instantly. The transition timer cleans up on unmount. There is no envelope animation. The rest of the page and footer render only for a recognized invitation.

Before entry, wheel, touch, keyboard and inner-scroll attempts add a temporary gold outline/glow to the code field and update its help text. Typing clears the highlight. The locked root fills the viewport; on short or zoomed screens, only the introduction can scroll so the field remains reachable. A valid code removes the gate and restores normal page scrolling. Listeners and timers clean up on entry and unmount.
