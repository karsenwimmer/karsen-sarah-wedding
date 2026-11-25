# Victoria & Luca invitation design

Route: `/demo/rsvp` on https://thewimmers.ca. Changes are scoped to the invitation demo; the save-the-date homepage and separate `/invitation` route are preserved.

## Visual direction

Warm ivory paper (#FAF8F1), sage ink (#536542), light sage header and form (#E9EDDF), muted antique-gold accents (#92713B and #C7B486), Cormorant Garamond display type and Source Sans 3 controls. The hero uses uppercase full names, the approved transparent V | L wildflower PNG, and the approved portrait with photographic facial detail and painted garden surroundings. The date is August 28, 2027. No location details appear before code entry.

Desktop pairs invitation text and code entry with the portrait. Mobile stacks monogram, names, date, a softly faded portrait crop and code entry. The entrance fits standard phone screens, with natural overflow available for enlarged text and error messages.

The mobile portrait panel is 50–60px taller on typical phones, with a slightly lower crop and a shorter bottom fade to show more of the dress, legs and bench. Centering the taller composition moves the monogram and invitation text upward by roughly 25–30px. Short screens receive a smaller 25px increase. Desktop composition and the approved portrait asset are unchanged.

## Invitation flow

Entering a valid code keeps the hero visible and reveals the household invitation below it. An interruptible 1.15-second glide lands above the welcome section; reduced-motion users land immediately. Landing positions account for the pinned header. The household eyebrow is retained above the names.

The RSVP has vertically centered sticky instructions on the left and a light sage response form on the right. The instructions release at the end of the form. Mobile and short windows use normal stacked flow. Locations, Itinerary, Dress code and FAQs have centered headings and spacious, continuous ivory backgrounds, without repeated floral dividers.

Guest names and attendance controls use consistent grouping. Supporting text, placeholders and field boundaries have readable contrast. Selection controls, focus, press feedback and native FAQ disclosure share the sage palette. Hover effects apply only to pointing devices. The portrait loads with high fetch priority.

## Event details and demo behavior

Ceremony: August 28, 2027 at 12:00 PM, Saints Peter and Paul Parish, 4070 Central Parkway East, Mississauga, Ontario L4Z 1T6. Reception and antipasto bar begin at 5:30 PM at The Venetian Banquet Hall, 219 Romina Drive, Concord, Ontario L4K 4V3; dinner follows without an invented exact time. Further itinerary details, dress code and RSVP deadline are still to come.

1234 demonstrates a couple, 5678 a family with children, and 9012 a ceremony-only invitation. The hero uses four outlined digit boxes backed by one accessible numeric text field, with phone keypad, paste and keyboard editing support. Original storage identifiers are retained so saved demo replies survive the code-format change. Guest names are fictional fixtures. The standard menu includes chicken and beef. Attending reception guests can provide optional dietary requirements or allergies in a personal write-in field; no meal dropdown or unconfirmed children’s menu is offered. A blank field records the standard menu with no dietary requirements provided. Earlier saved alternative choices are preserved as dietary notes when no explicit note existed. Responses are saved only in the current browser; no real RSVP records or emails are created. Attendance validation, saved-response editing, invite-specific reception visibility and demo-only storage reset are preserved. This remains a demonstration rather than a real RSVP backend.

## Active assets

- `public/images/demo/luca-victoria-wildflower-monogram.png`: 512 × 512 transparent PNG.
- `public/images/demo/luca-victoria-watercolour-portrait-v3.webp`: 1000 × 1250 optimized WebP, using the approved close-up-referenced likeness.

## Validation

All 74 tests and the production build pass. Browser checks covered 320 × 568, 390 × 700, 1000 × 800 and 1440 × 900, invalid-code recovery, keyboard radio selection, dietary-note persistence and attendance focus recovery, saved-response editing, keyboard FAQ disclosure and console errors. Measured name-to-control gaps are consistently 16px. Calculated contrast is 4.88:1 for supporting text on sage, 5.65:1 for input placeholders and 3.03:1 for field boundaries against sage.

## Motion refinement

The code-entry underline is removed. All four digit-box borders are consistently antique gold. Their narrow glow pulses gently in synchrony over a 3.6-second cycle, replacing the travelling highlight. Only the border overlays change opacity; box fills and layout remain still. Offscreen and hidden-tab playback pauses through the existing visibility observer. Typing, errors and reduced motion disable the decorative glow, preserving the static cell borders and active-cell focus treatment. The paper has one gentle arrival. Editorial headings settle by 12px over 1.1 seconds and supporting text by 8px over 900ms, using a gentler easing that remains perceptible. Reveals explicitly require at least 55% intersection inside a viewport region inset from the bottom by 18% of viewport height (capped at 180px). The callback checks the ratio rather than treating an initial barely-intersecting notification as a trigger, so scroll reveals do not finish at the edge of the screen. Each plays once. Progressive enhancement marks supported, below-screen text as pending until that trigger, avoiding a visible flash before a reveal. Existing on-screen text stays visible; cleanup and reduced motion restore all pending text, while unsupported browsers and blocks taller than the available viewport keep the readable default. The household name is the personal focal moment: a slower 1.6-second entrance with a 14px settle and a bounded 3px soft focus that clears during the first half. Welcome details follow with a short 280ms offset. Whole words remain intact, controls stay responsive, and existing nodes do not replay when an invitation opens or a section re-enters view. The old full-section opacity animation is removed to avoid stacking fades. Content stays visible by default if observation or animation is unavailable. New dietary fields appear over 220ms, the confirmation check draws once, and the arrow responds subtly to a precise pointer. No parallax, new dependencies or changes to RSVP logic are introduced. Switching to reduced motion cancels active heading reveals.

## Gold accents

Gold appears in the fine desktop hero frame, the synchronized gold digit-box border glow, decorative date/time separators and a short hairline beneath each centered detail-section heading. Sage continues to carry names, headings, body text, controls and the monogram. The approved portrait, page flow and motion are preserved.

## Section navigation

The sage header stays pinned at the top with 86% opacity and a bounded backdrop blur. The header always shows RSVP, Locations, Itinerary, Dress code and FAQs, with the dropdown available before code entry on mobile. The old DEMO badge is removed from the header. Selecting a locked section focuses the code field with a short prompt; after a valid code the requested section opens. Smaller screens use an expandable menu that closes on section selection or Escape. Section links focus their headings and scroll smoothly with a header offset; the RSVP link scrolls the form section rather than its sticky instruction heading; reduced motion uses immediate movement. Invitation details remain gated behind code entry. Hero text uses an entrance observer without the lower-page trigger inset, so its code instructions remain visible on a one-screen composition.

## Guest planning and stationery refinement — November 24, 2026

The portrait-led hero, fonts, colours, existing name reveal, gold code pulse and separate save-the-date/invitation pages remain intact. No new animation choreography is added: the open state gains a static gold confirmation seal. The sage form gains finer gold separators, clearer selected attendance controls, a live answered-guest count, and an attending/declining count in the saved response with a link to the itinerary. Left instructions remain sticky on desktop and stack on phones.

Locations now pair the two venues with restrained gold line icons and individual driving-direction links. A single lazy-loaded, non-interactive regional map uses MapLibre GL JS 6.19.0 from its documented CDN and OpenFreeMap Positron data recoloured in paper and sage. No API key, billing account or per-guest routing request is needed. The locally stored route geometry was retrieved once from OSRM on November 24, 2026; it is explicitly a planning preview, with live Google Maps directions below and no fixed travel-time claim. OpenFreeMap/OpenMapTiles/OpenStreetMap attribution remains visible. The map has loading and failure messages, and ordinary directions links remain usable if WebGL, the CDN or tiles are unavailable. Ceremony-only guests see only the church view and no reception directions, calendar or dietary fields.

Map sources: parish address and map link at https://stspeterandpaulmi.archtoronto.org/en/contact-us/parish-information/ ; church polygon centroid (OpenStreetMap way 28235193) at 43.60231,-79.62847 ; reception coordinates 43.8172461,-79.5298814 linked from https://www.thevenetian.ca/contact ; route geometry https://router.project-osrm.org/route/v1/driving/-79.62847,43.60231;-79.5298814,43.8172461?overview=full&geometries=geojson&steps=false . Map setup follows https://openfreemap.org/quick_start/ and https://maplibre.org/maplibre-gl-js/docs/examples/display-a-map/ .

The itinerary has a gold timeline with event names, venue names, short descriptions and calendar choices for the ceremony and reception. Start times are 12:00 PM and 5:30 PM America/Toronto (16:00Z and 21:30Z). Google, Outlook and downloadable Apple/ICS options include the confirmed start and venue; unknown end times are not invented. Dinner stays “To follow” without a calendar event or exact time. Calendar menus work by keyboard and close on Escape. Apple/ICS links use ordinary same-origin .ics downloads for browser compatibility, with checked file contents matching the event helper.

FAQs cover named invitees, reply date, edits, parking, transport, dietary requirements and confirmed details. The reply deadline, parking, transport arrangements, further itinerary and dress code remain explicitly unconfirmed. No email address or phone number is invented; the contact note asks guests to reach Victoria or Luca directly. Dress-code illustrations are excluded as requested. The existing standard chicken-and-beef menu with optional per-attending-guest dietary notes is preserved.

Validation: 74 tests pass, including confirmed calendar start times/ICS folding, exact direction endpoints, gated planning tools, ceremony-only visibility, RSVP progress, persistence and editing. Production build passes. Native browser checks covered the desktop page, mobile timeline/calendar menu, 390×844 map labels and saved response, 320×568 hero and ceremony-only data, and no horizontal page overflow or console errors. Browser reduced-motion emulation is unavailable; existing reduced-motion behavior remains covered by the prior source/tests.
