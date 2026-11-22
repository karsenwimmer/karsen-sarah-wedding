# Victoria & Luca invitation design

Route: `/demo/rsvp` on https://thewimmers.ca. Changes are scoped to the invitation demo; the save-the-date homepage and separate `/invitation` route are preserved.

## Visual direction

Warm ivory paper (#FAF8F1), sage ink (#536542), light sage header and form (#E9EDDF), Cormorant Garamond display type and Source Sans 3 controls. The hero uses uppercase full names, the approved transparent V | L wildflower PNG, and the approved portrait with photographic facial detail and painted garden surroundings. The date is August 28, 2027. No location details appear before code entry.

Desktop pairs invitation text and code entry with the portrait. Mobile stacks monogram, names, date, a softly faded portrait crop and code entry. The entrance fits standard phone screens, with natural overflow available for enlarged text and error messages.

## Invitation flow

Entering a valid code keeps the hero visible and reveals the household invitation below it. An interruptible 1.15-second glide lands above the welcome section; reduced-motion users land immediately. The household eyebrow is retained above the names.

The RSVP has vertically centered sticky instructions on the left and a light sage response form on the right. The instructions release at the end of the form. Mobile and short windows use normal stacked flow. Locations, Itinerary, Dress code and FAQs have centered headings and spacious, continuous ivory backgrounds, without repeated floral dividers.

Guest names and attendance controls use consistent grouping. Supporting text, placeholders and field boundaries have readable contrast. Selection controls, focus, press feedback and native FAQ disclosure share the sage palette. Hover effects apply only to pointing devices. The portrait loads with high fetch priority.

## Event details and demo behavior

Ceremony: August 28, 2027 at 12:00 PM, Saints Peter and Paul Parish, 4070 Central Parkway East, Mississauga, Ontario. Reception is to follow; its venue and timing, dress code and RSVP deadline have not been supplied and are not invented.

ROSE24 demonstrates a couple, OAK123 a family with children, and FERN26 a ceremony-only invitation. Guests and meal choices are fictional fixtures. Responses are saved only in the current browser; no real RSVP records or emails are created. Meal validation, saved-response editing, invite-specific reception visibility and demo-only storage reset are preserved. This remains a demonstration rather than a real RSVP backend.

## Active assets

- `public/images/demo/luca-victoria-wildflower-monogram.png`: 512 × 512 transparent PNG.
- `public/images/demo/luca-victoria-watercolour-portrait-v3.webp`: 1000 × 1250 optimized WebP, using the approved close-up-referenced likeness.

## Validation

All 66 tests and the production build pass. Browser checks covered 320 × 568, 390 × 700, 1000 × 800 and 1440 × 900, invalid-code recovery, keyboard radio selection, meal validation and focus recovery, saved-response editing, keyboard FAQ disclosure and console errors. Measured name-to-control gaps are consistently 16px. Calculated contrast is 4.88:1 for supporting text on sage, 5.65:1 for input placeholders and 3.03:1 for field boundaries against sage.

## Motion refinement

The focal moment is a narrow sage-and-champagne glint along the code-entry underline, replacing the rejected diffuse green halo. At the user’s request it travels left to right and back, taking 3.2 seconds each way with gentle easing. The glint pauses while typing, offscreen or in a hidden tab, and disappears on an error or when reduced motion is enabled; the normal underline and focus treatment remain. The paper has one gentle arrival. Editorial headings settle by 8px over 760ms and supporting text by 5px over 640ms, once as each enters view. The household name is the personal focal moment: a slower 1.6-second entrance with a 14px settle and a bounded 3px soft focus that clears during the first half. Welcome details follow with a short 280ms offset. Whole words remain intact, controls stay responsive, and existing nodes do not replay when an invitation opens or a section re-enters view. The old full-section opacity animation is removed to avoid stacking fades. Content stays visible by default if observation or animation is unavailable. New meal fields appear over 220ms, the confirmation check draws once, and the arrow responds subtly to a precise pointer. No parallax, new dependencies or changes to RSVP logic are introduced. Switching to reduced motion cancels active heading reveals.
