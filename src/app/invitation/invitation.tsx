"use client";

import { useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { weddingConfig as wedding } from "@/config/wedding";
import { createGoogleCalendarUrl, createIcsCalendarFile, createOutlookCalendarUrl, type CalendarEvent } from "@/lib/calendar";
import { blankAnswers, cleanAnswers, findInvite, invitations, mealOptions, readReply, replyKey, validateAnswers, type Answer, type Invite } from "./preview-data";
import s from "./invitation.module.css";

function Seal({ large = false }: { large?: boolean }) {
  return <Image className={large ? s.sealLarge : s.seal} src="/images/seals/ks-flat-seal-transparent.png" alt="Karsen and Sarah monogram" width={large ? 120 : 52} height={large ? 120 : 52} priority />;
}
function Sprig({ className = "" }: { className?: string }) {
  return <svg className={className} width="95" height="40" viewBox="0 0 95 40" fill="none" aria-hidden="true"><path d="M4 30Q48 37 91 7M27 31L21 15M46 27L43 9M62 21L65 5M75 15L86 18" stroke="currentColor" strokeWidth=".8"/><path d="M23 24C9 21 13 10 13 10C24 10 27 18 23 24ZM44 19C32 14 37 4 37 4C48 7 49 14 44 19ZM63 15C56 6 66 1 66 1C72 8 68 13 63 15ZM78 15C87 9 93 17 93 17C84 24 78 20 78 15ZM47 27C38 34 29 30 29 30C34 23 41 23 47 27ZM65 22C57 31 49 29 49 29C52 21 58 19 65 22Z" fill="currentColor" opacity=".5"/></svg>;
}
function SectionHeading({ number, label, title }: { number: string; label: string; title: string }) {
  return <div className={s.sectionHeading}><p className={s.eyebrow}><span>{number}</span>{label}</p><h2>{title}</h2></div>;
}

export function Invitation() {
  const [code, setCode] = useState("");
  const [invite, setInvite] = useState<Invite | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [note, setNote] = useState("");
  const [codeError, setCodeError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [persisted, setPersisted] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const responseHeading = useRef<HTMLHeadingElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const codeInput = useRef<HTMLInputElement>(null);

  function openInvitation(event: FormEvent) {
    event.preventDefault();
    const found = findInvite(code);
    if (!found) { setCodeError("That code isn’t part of this preview. Try HARBOUR, FAMILY or CHURCH."); codeInput.current?.focus(); return; }
    let saved = null;
    try { saved = readReply(found, window.localStorage.getItem(replyKey(found))); } catch { /* Form remains usable without storage. */ }
    setInvite(found); setAnswers(saved?.answers ?? blankAnswers(found)); setNote(saved?.note ?? "");
    setConfirmed(Boolean(saved)); setPersisted(true); setErrors({}); setCodeError(""); setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
    requestAnimationFrame(() => heading.current?.focus());
  }
  function changeInvitation() {
    setInvite(null); setCode(""); setCodeError(""); setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
    requestAnimationFrame(() => codeInput.current?.focus());
  }
  function updateAnswer(id: string, patch: Partial<Answer>) {
    setAnswers(current => current.map(answer => answer.id === id ? { ...answer, ...patch } : answer));
    setErrors(current => { const next = { ...current }; delete next[id]; return next; });
  }
  function submit(event: FormEvent) {
    event.preventDefault(); if (!invite) return;
    const nextErrors = validateAnswers(invite, answers); setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      const id = Object.keys(nextErrors)[0];
      const answer = answers.find(item => item.id === id);
      requestAnimationFrame(() => form.current?.querySelector<HTMLElement>(answer?.attending === "yes" ? `#meal-${id}` : `#attendance-${id}-yes`)?.focus());
      return;
    }
    const cleaned = cleanAnswers(invite, answers); let saved = true;
    try { window.localStorage.setItem(replyKey(invite), JSON.stringify({ answers: cleaned, note: note.trim(), savedAt: new Date().toISOString() })); }
    catch { saved = false; }
    setAnswers(cleaned); setPersisted(saved); setConfirmed(true);
    requestAnimationFrame(() => responseHeading.current?.focus());
  }
  const calendar: CalendarEvent = {
    title: "Karsen & Sarah’s Wedding", startDate: "2027-07-17", endDate: "2027-07-18",
    location: invite?.reception ? "Bronte Harbour, Oakville, Ontario" : "Oakville, Ontario",
    description: "Celebrate with Karsen & Sarah. Please check your invitation for the final schedule.",
    url: "https://thewimmers.ca/invitation"
  };
  function downloadCalendar() {
    const url = URL.createObjectURL(new Blob([createIcsCalendarFile(calendar)], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "karsen-and-sarah.ics"; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const attending = answers.filter(answer => answer.attending === "yes").length;

  return <div className={s.root}>
    <a className={s.skip} href="#invitation-main">Skip to invitation</a>
    <div className={s.previewBar}><span>INVITATION PREVIEW</span><p>Sample households · Real RSVPs are not open yet</p></div>
    <header className={s.header}>
      <a className={s.brand} href="#invitation-main" aria-label="Karsen and Sarah invitation"><Seal /><span>KARSEN <i>&</i> SARAH</span></a>
      {invite ? <>
        <button className={s.menuToggle} type="button" aria-expanded={menuOpen} aria-controls="invitation-nav" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "Close" : "Menu"}<span aria-hidden="true">{menuOpen ? "−" : "+"}</span></button>
        <nav id="invitation-nav" className={`${s.nav} ${menuOpen ? s.navOpen : ""}`} aria-label="Wedding navigation" onClick={() => setMenuOpen(false)}><a href="#the-day">The day</a><a href="#the-details">The details</a><a href="#questions">Questions</a><a className={s.navRsvp} href="#your-rsvp">Your RSVP <span aria-hidden="true">↗</span></a></nav>
      </> : <p className={s.headerDate}>JULY 17, 2027 <span>·</span> OAKVILLE</p>}
    </header>
    <main id="invitation-main">
      {!invite ? <section className={s.entry} aria-labelledby="entry-title">
        <div className={s.entryArt}>
          <div className={s.entryArtTop}><span>THE WEDDING OF</span><span>07.17.27</span></div>
          <div className={s.entryNames}><Seal large /><h1 id="entry-title">Karsen <span>& Sarah</span></h1><p>With full hearts, we invite you to celebrate.</p></div>
          <div className={s.entryPainting} role="img" aria-label="Watercolor of Bronte Harbour and the waterfront" />
          <div className={s.entryArtFoot}><span>OAKVILLE, ONTARIO</span><Sprig /><span>TOGETHER WITH YOU</span></div>
        </div>
        <div className={s.entryAside}>
          <p className={s.eyebrow}><span>01</span> YOUR INVITATION</p>
          <h2>A day to remember.<br /><em>A place for you.</em></h2>
          <p className={s.entryIntro}>All the little details, and the people who make them matter. Open your invitation to explore our day and share your reply.</p>
          <form onSubmit={openInvitation} className={s.codeForm}>
            <label htmlFor="invitation-code">Your invitation code</label>
            <div className={s.codeBar}><input id="invitation-code" ref={codeInput} value={code} onChange={event => { setCode(event.target.value); setCodeError(""); }} placeholder="Enter your code" maxLength={24} autoCapitalize="characters" autoComplete="off" autoCorrect="off" spellCheck={false} aria-invalid={Boolean(codeError)} aria-describedby={codeError ? "code-help code-error" : "code-help"} required /><button type="submit" aria-label="Open invitation"><span aria-hidden="true">↗</span></button></div>
            <p id="code-help" className={s.hint}>You’ll find this on your printed invitation.</p>
            {codeError && <p className={s.error} id="code-error" role="alert">{codeError}</p>}
          </form>
          <details className={s.previewCodes}><summary>Explore the preview</summary><p>These fictional invitations let us try each guest experience.</p><div>{invitations.map(sample => <button type="button" key={sample.code} onClick={() => { setCode(sample.code); setCodeError(""); codeInput.current?.focus(); }}><span>{sample.code}</span><small>{sample.code === "HARBOUR" ? "A couple" : sample.code === "FAMILY" ? "A family" : "Church celebration"}</small></button>)}</div></details>
          <div className={s.entrySignoff}><Sprig /><p>We can’t wait to celebrate with you.</p><span>Karsen & Sarah</span></div>
        </div>
      </section> : <>
        <section className={s.hero} aria-labelledby="wedding-title">
          <div className={s.heroCopy}>
            <p className={s.eyebrow}>TOGETHER WITH OUR FAMILIES</p>
            <h1 id="wedding-title" ref={heading} tabIndex={-1}>Karsen <span>& Sarah</span></h1>
            <p className={s.heroInvitation}>joyfully invite you to celebrate<br />our wedding day</p>
            <div className={s.heroDate}><span>SATURDAY</span><strong>July 17, 2027</strong><span>OAKVILLE, ONTARIO</span></div>
            <a className={s.primary} href="#your-rsvp">Kindly reply <span aria-hidden="true">↗</span></a>
            <a className={s.exploreLink} href="#the-day">Discover the day <span aria-hidden="true">↓</span></a>
          </div>
          <div className={s.heroArt}><div className={s.heroPainting} role="img" aria-label="A watercolor view of Bronte Harbour" /><div className={s.artCaption}><span>A SUMMER CELEBRATION</span><span>JULY · 2027</span></div><div className={s.heroSeal}><Seal large /></div></div>
        </section>
        <section className={s.personalNote} aria-label="Your invited household"><Sprig /><div><p className={s.eyebrow}>AN INVITATION FOR</p><h2>{invite.name}</h2><p>{invite.reception ? "Please join us for our ceremony and reception." : "Please join us for our church celebration."}</p></div><button type="button" className={s.textButton} onClick={changeInvitation}>Change invitation <span aria-hidden="true">↗</span></button></section>

        <section className={s.daySection} id="the-day">
          <div className={s.sectionIntro}><SectionHeading number="01" label="THE DAY" title="Every moment, together." /><p>Saturday, July 17, 2027<br />A celebration made sweeter by sharing it with you.</p></div>
          <ol className={s.timeline}>
            <li><span className={s.timelineNumber}>I.</span><p className={s.eyebrow}>THE CEREMONY</p><h3>The beginning.</h3><p>Join us as we exchange our vows.</p><span className={s.pending}>Location & time to follow</span></li>
            {invite.reception && <><li><span className={s.timelineNumber}>II.</span><p className={s.eyebrow}>THE RECEPTION</p><h3>By the harbour.</h3><p>A warm welcome at The Boathouse.</p><span className={s.pending}>Arrival time to follow</span></li><li><span className={s.timelineNumber}>III.</span><p className={s.eyebrow}>DINNER & CELEBRATION</p><h3>Stay a little longer.</h3><p>Dinner, toasts, and time with our favourite people.</p><span className={s.pending}>Full itinerary to follow</span></li></>}
          </ol>
          <div className={s.calendar}><span>KEEP THE DAY FOR US</span><div><a href={createGoogleCalendarUrl(calendar)} target="_blank" rel="noreferrer">Google <span aria-hidden="true">↗</span></a><a href={createOutlookCalendarUrl(calendar)} target="_blank" rel="noreferrer">Outlook <span aria-hidden="true">↗</span></a><button type="button" onClick={downloadCalendar}>Apple / iCal <span aria-hidden="true">↓</span></button></div></div>
        </section>

        <section className={s.detailsSection} id="the-details">
          <div className={s.locationArt}><div className={s.locationPainting} role="img" aria-label="Watercolor buildings and boats at Bronte Harbour" /><p>SUMMER IN OAKVILLE <span>ONTARIO · CANADA</span></p></div>
          <div className={s.locationCopy}><SectionHeading number="02" label="THE SETTING" title={invite.reception ? "Meet us by the water." : "Join us for our vows."} />
            <div className={s.venueRow}><span>01</span><div><p className={s.eyebrow}>CEREMONY</p><h3>A promise, witnessed by you.</h3><p>We’ll share the confirmed church, address, and arrival time here before invitations are sent.</p></div></div>
            {invite.reception && <div className={s.venueRow}><span>02</span><div><p className={s.eyebrow}>RECEPTION</p><h3>The Boathouse</h3><p>Restaurant & Event Venue<br />Bronte Harbour · Oakville, Ontario</p><p className={s.hint}>Exact address and directions will be added once confirmed.</p></div></div>}
          </div>
        </section>

        <section className={s.goodToKnow} aria-labelledby="details-title"><div className={s.smallHeading}><p className={s.eyebrow}>THE LITTLE THINGS</p><h2 id="details-title">Make yourself at home.</h2></div><div className={s.detailGrid}>
          <article><span className={s.detailGlyph} aria-hidden="true">✧</span><h3>What to wear</h3><p>Dress code and any colour guidance will be shared here when finalized.</p></article>
          {invite.reception && <article><span className={s.detailGlyph} aria-hidden="true">❦</span><h3>A seat at our table</h3><p>Choose a sample meal in the RSVP preview. Our final menu will follow; there’s space to note allergies and dietary needs.</p></article>}
          <article><span className={s.detailGlyph} aria-hidden="true">⌁</span><h3>Getting here</h3><p>Parking, transport, and nearby accommodation details will be added as plans are confirmed.</p></article>
        </div></section>

        <section className={s.rsvpSection} id="your-rsvp">
          <aside className={s.rsvpAside}><p className={s.eyebrow}><span>03</span> YOUR REPLY</p><h2>We’ve saved<br />a place <em>for you.</em></h2><Sprig /><p>Please reply for each person on your invitation. We’re looking forward to celebrating together.</p><div className={s.rsvpNote}><span>BEFORE YOU REPLY</span><p>This is a design preview. Names and meal choices are samples. No real RSVP or email will be sent.</p><p>The RSVP deadline will be added before invitations go out.</p></div><a href={`mailto:${wedding.contact.email}`} className={s.textLink}>A question for us? <span aria-hidden="true">↗</span></a></aside>
          <div className={s.responsePaper}>
            <div className={s.paperTop}><span>K & S</span><span>17 JULY 2027</span></div>
            {confirmed ? <div className={s.confirmation}><div className={s.confirmationMark} aria-hidden="true">✓</div><p className={s.eyebrow}>{persisted ? "PREVIEW REPLY SAVED" : "PREVIEW REPLY"}</p><h3 ref={responseHeading} tabIndex={-1}>{attending ? "A little closer to the day." : "Thank you for letting us know."}</h3><p>{persisted ? "Your sample response is saved in this browser. You can reopen this invitation and edit it here." : "Your browser couldn’t save this sample response. You can still review it below, but it won’t be available after leaving this page."}</p><ul className={s.replySummary}>{invite.guests.map(guest => { const answer = answers.find(item => item.id === guest.id)!; return <li key={guest.id}><strong>{guest.name}</strong><span>{answer.attending === "yes" ? "Attending" : "Declining"}{answer.meal ? ` · ${mealOptions.find(meal => meal.value === answer.meal)?.label}` : ""}</span>{answer.dietary && <small>Dietary requirements: {answer.dietary}</small>}</li>; })}</ul>{note.trim() && <p className={s.savedNote}><strong>Your note</strong><br />{note.trim()}</p>}<button className={s.primary} type="button" onClick={() => setConfirmed(false)}>Edit my reply <span aria-hidden="true">↗</span></button><p className={s.hint}>Preview only · No email sent</p></div> : <form ref={form} onSubmit={submit} noValidate>
              <p className={s.eyebrow}>{invite.name}</p><h3>Will you be joining us?</h3><p className={s.formIntro}>{invite.reception ? "Your invitation includes our ceremony and reception." : "Your invitation includes our church celebration."}</p>
              {invite.guests.map((guest, index) => { const answer = answers.find(item => item.id === guest.id)!; const error = errors[guest.id]; return <fieldset key={guest.id} className={s.guest} aria-describedby={error ? `error-${guest.id}` : undefined}><legend><span>0{index + 1}</span>{guest.name}{guest.child && <small>CHILD</small>}</legend><div className={s.attendance}>{[{ value: "yes", label: "Joyfully accepts" }, { value: "no", label: "Regretfully declines" }].map(option => <label key={option.value} className={answer.attending === option.value ? s.selected : ""}><input id={`attendance-${guest.id}-${option.value}`} type="radio" name={`attendance-${guest.id}`} value={option.value} checked={answer.attending === option.value} onChange={() => updateAnswer(guest.id, { attending: option.value as "yes" | "no" })} aria-invalid={Boolean(error)} /><span>{option.label}</span></label>)}</div>
                {answer.attending === "yes" && <div className={s.guestDetails}>{invite.reception && <div><label htmlFor={`meal-${guest.id}`}>Meal for {guest.name.split(" ")[0]} <small>SAMPLE MENU</small></label><select id={`meal-${guest.id}`} value={answer.meal} onChange={event => updateAnswer(guest.id, { meal: event.target.value })} aria-invalid={Boolean(error)} aria-describedby={error ? `error-${guest.id}` : undefined}><option value="">Choose a meal</option>{mealOptions.filter(meal => guest.child || meal.value !== "children").map(meal => <option key={meal.value} value={meal.value}>{meal.label}</option>)}</select></div>}<div><label htmlFor={`dietary-${guest.id}`}>Dietary requirements for {guest.name.split(" ")[0]} <small>OPTIONAL</small></label><input id={`dietary-${guest.id}`} value={answer.dietary} maxLength={300} onChange={event => updateAnswer(guest.id, { dietary: event.target.value })} placeholder="Allergies or anything we should know" /></div></div>}
                {error && <p className={s.error} id={`error-${guest.id}`} role="alert">{error}</p>}
              </fieldset>; })}
              <div className={s.messageField}><label htmlFor="couple-note">A little note for us <small>OPTIONAL</small></label><textarea id="couple-note" value={note} maxLength={1000} rows={3} onChange={event => setNote(event.target.value)} placeholder="We’d love to hear from you…" /></div><button className={`${s.primary} ${s.submit}`} type="submit">Save preview reply <span aria-hidden="true">↗</span></button><p className={s.saveHint}>Saved only in this browser. This does not submit a real RSVP.</p>
            </form>}
            <div className={s.paperBottom}><Sprig /><span>WITH LOVE, KARSEN & SARAH</span></div>
          </div>
        </section>

        <section className={s.faqSection} id="questions"><div><SectionHeading number="04" label="A FEW ANSWERS" title="Wondering about something?" /><p>If you can’t find what you need, we’re only an email away.</p><a className={s.textLink} href={`mailto:${wedding.contact.email}`}>{wedding.contact.email} <span aria-hidden="true">↗</span></a></div><div className={s.faqList}>{[
          ["Who is included on my invitation?", "The names shown in your RSVP are the people included on your invitation. Please contact us if anything looks incorrect."],
          ["Can I change my response?", "In this preview, reopen the same code in this browser and choose ‘Edit my reply’. When real RSVPs open, the final deadline and update instructions will be shown here."],
          ["When will the full schedule be available?", "We’re still confirming the details. Ceremony information, arrival times, and the final itinerary will be added before formal invitations are sent."],
          ...(invite.reception ? [["What if I have an allergy or dietary requirement?", "Please use the dietary requirements field beside your name. The meals in this preview are examples; the final menu will be added before real RSVPs open."]] : []),
          ["Is this my official RSVP?", "Not yet. This page is a preview using fictional households. No real RSVP is recorded and no confirmation email is sent."]
        ].map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
        <section className={s.memories}><Sprig /><p className={s.eyebrow}>A LITTLE MORE TO COME</p><h2>The moments in between.</h2><p>{invite.reception ? "A place for your photos and a little wedding-day fun. We’ll share our guest photo album and activity links here when they’re ready." : "We’ll share a guest photo album here so we can remember the day through your eyes."}</p><div><span>GUEST PHOTO ALBUM · COMING SOON</span>{invite.reception && <span>WEDDING QUIZ · COMING SOON</span>}</div></section>
      </>}
    </main>
    <footer className={s.footer}><div><span className={s.footerNames}>Karsen & Sarah</span><p>July 17, 2027 · Oakville, Ontario</p></div><span>WITH LOVE, ALWAYS.</span>{invite && <button className={s.textButton} type="button" onClick={changeInvitation}>Change invitation <span aria-hidden="true">↗</span></button>}</footer>
  </div>;
}
