"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { weddingConfig as wedding } from "@/config/wedding";
import { createGoogleCalendarUrl, createIcsCalendarFile, createOutlookCalendarUrl, type CalendarEvent } from "@/lib/calendar";
import { blankAnswers, cleanAnswers, findInvite, invitations, mealOptions, readReply, replyKey, validateAnswers, type Answer, type Invite, type Reply } from "./preview-data";
import { lookupInvitation, saveInvitationReply } from "./actions";
import s from "./invitation.module.css";

const ACTIVE_PREVIEW = "ks-invitation-preview:active";
function Seal({ large = false }: { large?: boolean }) {
  return <Image className={large ? s.sealLarge : s.seal} src="/images/seals/ks-flat-seal-transparent.png" alt="Karsen and Sarah monogram" width={large ? 120 : 52} height={large ? 120 : 52} priority />;
}
function Sprig() {
  return <svg width="95" height="40" viewBox="0 0 95 40" fill="none" aria-hidden="true"><path d="M4 30Q48 37 91 7M27 31L21 15M46 27L43 9M62 21L65 5M75 15L86 18" stroke="currentColor" strokeWidth=".8"/><path d="M23 24C9 21 13 10 13 10C24 10 27 18 23 24ZM44 19C32 14 37 4 37 4C48 7 49 14 44 19ZM63 15C56 6 66 1 66 1C72 8 68 13 63 15ZM78 15C87 9 93 17 93 17C84 24 78 20 78 15ZM47 27C38 34 29 30 29 30C34 23 41 23 47 27ZM65 22C57 31 49 29 49 29C52 21 58 19 65 22Z" fill="currentColor" opacity=".5"/></svg>;
}
function SectionHeading({ label, title }: { label: string; title: string }) {
  return <div className={s.sectionHeading}><p className={s.eyebrow}>{label}</p><h2>{title}</h2></div>;
}

export function Invitation() {
  const [code, setCode] = useState("");
  const [invite, setInvite] = useState<Invite | null>(null);
  const [preview, setPreview] = useState(true);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [note, setNote] = useState("");
  const [savedReply, setSavedReply] = useState<Reply | null>(null);
  const [codeError, setCodeError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const responseHeading = useRef<HTMLHeadingElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const codeInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Remember only public preview codes here. Real invitation access codes stay out of browser storage.
    try {
      const found = findInvite(window.localStorage.getItem(ACTIVE_PREVIEW) ?? "");
      if (!found) return;
      const saved = readReply(found, window.localStorage.getItem(replyKey(found)));
      setInvite(found); setAnswers(saved?.answers ?? blankAnswers(found)); setNote(saved?.note ?? "");
      setSavedReply(saved); setConfirmed(Boolean(saved));
    } catch { /* Guests can still enter a code when browser storage is unavailable. */ }
  }, []);
  function displayInvitation(found: Invite, saved: Reply | null, isPreview: boolean) {
    setInvite(found); setPreview(isPreview); setAnswers(saved?.answers ?? blankAnswers(found)); setNote(saved?.note ?? "");
    setSavedReply(saved); setConfirmed(Boolean(saved)); setErrors({}); setCodeError(""); setSaveError(""); setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
    requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
  }
  async function openInvitation(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    const found = findInvite(code);
    if (found) {
      let saved = null;
      try { saved = readReply(found, window.localStorage.getItem(replyKey(found))); window.localStorage.setItem(ACTIVE_PREVIEW, found.code); } catch { /* Preview remains usable. */ }
      displayInvitation(found, saved, true); return;
    }
    if (!/^[A-Z0-9]{8,32}$/.test(code.toUpperCase().replace(/[\s-]/g, ""))) {
      setCodeError("That code isn’t part of this preview. Try HARBOUR, FAMILY or CHURCH, or enter the code from your invitation."); codeInput.current?.focus(); return;
    }
    setBusy(true); setCodeError("");
    try {
      const result = await lookupInvitation(code);
      if (result.ok) displayInvitation(result.invite, result.reply, false);
      else { setCodeError(result.message); codeInput.current?.focus(); }
    } catch { setCodeError("We couldn’t open your invitation. Please try again shortly."); }
    finally { setBusy(false); }
  }
  function changeInvitation() {
    if (busy) return;
    try { window.localStorage.removeItem(ACTIVE_PREVIEW); } catch { /* Do not clear replies or unrelated data. */ }
    setInvite(null); setCode(""); setCodeError(""); setMenuOpen(false); setSaveError("");
    window.scrollTo({ top: 0, behavior: "instant" });
    requestAnimationFrame(() => codeInput.current?.focus({ preventScroll: true }));
  }
  function updateAnswer(id: string, patch: Partial<Answer>) {
    setAnswers(current => current.map(answer => answer.id === id ? { ...answer, ...patch } : answer));
    setErrors(current => { const next = { ...current }; delete next[id]; return next; }); setSaveError("");
  }
  function editReply() { setConfirmed(false); setSaveError(""); requestAnimationFrame(() => responseHeading.current?.focus()); }
  function cancelEdit() {
    if (!savedReply) return;
    setAnswers(savedReply.answers); setNote(savedReply.note); setErrors({}); setSaveError(""); setConfirmed(true);
    requestAnimationFrame(() => responseHeading.current?.focus());
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!invite || busy) return;
    const nextErrors = validateAnswers(invite, answers); setErrors(nextErrors); setSaveError("");
    if (Object.keys(nextErrors).length) {
      const id = Object.keys(nextErrors)[0]; const answer = answers.find(item => item.id === id);
      requestAnimationFrame(() => form.current?.querySelector<HTMLElement>(answer?.attending === "yes" ? `#meal-${id}` : `#attendance-${id}-yes`)?.focus()); return;
    }
    let reply: Reply = { answers: cleanAnswers(invite, answers), note: note.trim(), savedAt: new Date().toISOString() };
    if (preview) {
      try { window.localStorage.setItem(replyKey(invite), JSON.stringify(reply)); }
      catch { setSaveError("Your browser couldn’t save this sample response. Your form is still open so you can try again."); return; }
    } else {
      setBusy(true);
      try {
        const result = await saveInvitationReply(invite.code, reply);
        if (!result.ok) { setSaveError(result.message); return; }
        reply = result.reply;
      } catch { setSaveError("We couldn’t save your reply. Your form is still open; please try again."); return; }
      finally { setBusy(false); }
    }
    setAnswers(reply.answers); setNote(reply.note); setSavedReply(reply); setConfirmed(true);
    requestAnimationFrame(() => responseHeading.current?.focus());
  }
  const calendar: CalendarEvent = {
    title: "Karsen & Sarah’s Wedding", startDate: "2027-07-17", endDate: "2027-07-18",
    location: invite?.reception ? "Bronte Harbour, Oakville, Ontario" : "Oakville, Ontario",
    description: "Celebrate with Karsen & Sarah. Please check your invitation for the final schedule.", url: "https://thewimmers.ca/invitation"
  };
  function downloadCalendar() {
    const url = URL.createObjectURL(new Blob([createIcsCalendarFile(calendar)], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "karsen-and-sarah.ics"; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const attending = answers.filter(answer => answer.attending === "yes").length;
  return <div className={s.root}>
    <a className={s.skip} href="#invitation-main">Skip to invitation</a>
    {preview && <div className={s.previewBar}><span>INVITATION PREVIEW</span><p>Sample households · Real invitations are not being sent yet</p></div>}
    <header className={s.header}>
      <a className={s.brand} href="#invitation-main" aria-label="Karsen and Sarah invitation"><Seal /><span>KARSEN <i>&</i> SARAH</span></a>
      {invite ? <><button className={s.menuToggle} type="button" aria-expanded={menuOpen} aria-controls="invitation-nav" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "Close" : "Menu"}<span aria-hidden="true">{menuOpen ? "−" : "+"}</span></button>
        <nav id="invitation-nav" className={`${s.nav} ${menuOpen ? s.navOpen : ""}`} aria-label="Wedding navigation" onClick={() => setMenuOpen(false)}><a className={s.navRsvp} href="#your-rsvp">Your RSVP <span aria-hidden="true">↗</span></a><a href="#the-day">The day</a><a href="#dress-code">Dress code</a><a href="#transportation">Transportation</a><a href="#questions">Questions</a></nav></> : <p className={s.headerDate}>JULY 17, 2027 <span>·</span> OAKVILLE</p>}
    </header>
    <main id="invitation-main">
      <section className={s.hero} aria-labelledby="wedding-title">
        <Image className={s.heroBackground} src="/images/invitation-sailboats-v1.webp" alt="" fill priority sizes="100vw" />
        <div className={s.heroWash} aria-hidden="true" />
        <div className={s.heroContent}><Seal large /><p className={s.eyebrow}>TOGETHER WITH OUR FAMILIES</p><h1 id="wedding-title" ref={heading} tabIndex={-1}>Karsen <span>& Sarah</span></h1><p className={s.heroInvitation}>joyfully invite you to celebrate our wedding</p><div className={s.heroDate}><strong>July 17, 2027</strong><span>SATURDAY · OAKVILLE, ONTARIO</span></div>
          {invite ? <><p className={s.invitedEvents}>{invite.reception ? "Ceremony & reception · Bronte Harbour" : "Church celebration · Oakville"}</p><a className={s.primary} href={confirmed ? "#the-day" : "#your-rsvp"}>{confirmed ? "Explore the day" : "Kindly reply"}<span aria-hidden="true">↓</span></a></> : <a className={s.primary} href="#open-invitation">Open your invitation <span aria-hidden="true">↓</span></a>}
        </div>
      </section>
      {!invite ? <section className={s.entrySection} id="open-invitation" aria-labelledby="entry-title"><Sprig /><p className={s.eyebrow}>YOUR INVITATION</p><h2 id="entry-title">A place for you.</h2><p>Enter the code from your invitation to reply and explore the details of our day.</p><form onSubmit={openInvitation} className={s.codeForm} aria-busy={busy}><label htmlFor="invitation-code">Your invitation code</label><div className={s.codeBar}><input id="invitation-code" ref={codeInput} value={code} onChange={event => { setCode(event.target.value); setCodeError(""); }} placeholder="Enter your code" maxLength={64} autoCapitalize="characters" autoComplete="off" autoCorrect="off" spellCheck={false} aria-invalid={Boolean(codeError)} aria-describedby={codeError ? "code-help code-error" : "code-help"} disabled={busy} required /><button type="submit" aria-label="Open invitation" disabled={busy}><span aria-hidden="true">{busy ? "…" : "↗"}</span></button></div><p id="code-help" className={s.hint}>You’ll find this on your printed invitation.</p>{codeError && <p className={s.error} id="code-error" role="alert">{codeError}</p>}</form><details className={s.previewCodes}><summary>Explore the preview</summary><p>These fictional invitations let us try each guest experience.</p><div>{invitations.map(sample => <button type="button" key={sample.code} onClick={() => { setCode(sample.code); setCodeError(""); codeInput.current?.focus(); }}><span>{sample.code}</span><small>{sample.code === "HARBOUR" ? "A couple" : sample.code === "FAMILY" ? "A family" : "Church celebration"}</small></button>)}</div></details></section> : <>
        <div className={s.householdNote}><p>An invitation for <strong>{invite.name}</strong></p><button type="button" className={s.textButton} onClick={changeInvitation}>Change invitation <span aria-hidden="true">↗</span></button></div>
        {confirmed ? <section className={s.collapsedReply} id="your-rsvp" aria-label="Saved RSVP"><span className={s.savedCheck} aria-hidden="true">✓</span><div><h2 ref={responseHeading} tabIndex={-1}>{preview ? "Your preview RSVP is saved." : "Your RSVP is saved."}</h2><p>{attending ? "We can’t wait to celebrate with you." : "Thank you for letting us know."} <span>{attending} attending · {answers.length - attending} declining</span></p><small>{preview ? "Saved in this browser · No real RSVP or email sent" : "Saved to your invitation · Available when you return with your code"}</small></div><div className={s.editPrompt}><p>Need to make a change? Feel free.</p><button type="button" className={s.textButton} onClick={editReply}>Edit your RSVP <span aria-hidden="true">↗</span></button></div></section> : <section className={s.rsvpSection} id="your-rsvp">
          <aside className={s.rsvpAside}><p className={s.eyebrow}>YOUR REPLY</p><h2>We’ve saved<br />a place <em>for you.</em></h2><Sprig /><p>Please reply for each person on your invitation. We’re looking forward to celebrating together.</p><div className={s.rsvpNote}><span>BEFORE YOU REPLY</span><p>{preview ? "This is a design preview. Names and meal choices are samples. No real RSVP or email will be sent." : "Your response will be saved to your invitation. Return with your code whenever you need to review it."}</p><p>The RSVP deadline will be added before invitations go out.</p></div><a href={`mailto:${wedding.contact.email}`} className={s.textLink}>A question for us? <span aria-hidden="true">↗</span></a></aside>
          <div className={s.responsePaper}><div className={s.paperTop}><span>K & S</span><span>17 JULY 2027</span></div>
<form ref={form} onSubmit={submit} noValidate aria-busy={busy}><fieldset disabled={busy} className={s.formFields}>
              <p className={s.eyebrow}>{invite.name}</p><h3 ref={responseHeading} tabIndex={-1}>Will you be joining us?</h3><p className={s.formIntro}>{invite.reception ? "Your invitation includes our ceremony and reception." : "Your invitation includes our church celebration."}</p>
              {invite.guests.map((guest, index) => { const answer = answers.find(item => item.id === guest.id)!; const error = errors[guest.id]; return <fieldset key={guest.id} className={s.guest} aria-describedby={error ? `error-${guest.id}` : undefined}><legend><span>0{index + 1}</span>{guest.name}{guest.child && <small>CHILD</small>}</legend><div className={s.attendance}>{[{ value: "yes", label: "Joyfully accepts" }, { value: "no", label: "Regretfully declines" }].map(option => <label key={option.value} className={answer.attending === option.value ? s.selected : ""}><input id={`attendance-${guest.id}-${option.value}`} type="radio" name={`attendance-${guest.id}`} value={option.value} checked={answer.attending === option.value} onChange={() => updateAnswer(guest.id, { attending: option.value as "yes" | "no" })} aria-invalid={Boolean(error)} /><span>{option.label}</span></label>)}</div>
                {answer.attending === "yes" && <div className={s.guestDetails}>{invite.reception && invite.mealsOpen !== false && <div><label htmlFor={`meal-${guest.id}`}>Meal for {guest.name.split(" ")[0]} {preview && <small>SAMPLE MENU</small>}</label><select id={`meal-${guest.id}`} value={answer.meal} onChange={event => updateAnswer(guest.id, { meal: event.target.value })} aria-invalid={Boolean(error)} aria-describedby={error ? `error-${guest.id}` : undefined}><option value="">Choose a meal</option>{mealOptions.filter(meal => guest.child || meal.value !== "children").map(meal => <option key={meal.value} value={meal.value}>{meal.label}</option>)}</select></div>}<div><label htmlFor={`dietary-${guest.id}`}>Dietary requirements for {guest.name.split(" ")[0]} <small>OPTIONAL</small></label><input id={`dietary-${guest.id}`} value={answer.dietary} maxLength={300} onChange={event => updateAnswer(guest.id, { dietary: event.target.value })} placeholder="Allergies or anything we should know" /></div></div>}
                {error && <p className={s.error} id={`error-${guest.id}`} role="alert">{error}</p>}
              </fieldset>; })}
              <div className={s.messageField}><label htmlFor="couple-note">A little note for us <small>OPTIONAL</small></label><textarea id="couple-note" value={note} maxLength={1000} rows={3} onChange={event => setNote(event.target.value)} placeholder="We’d love to hear from you…" /></div><button className={`${s.primary} ${s.submit}`} type="submit">{busy ? "Saving…" : preview ? "Save preview reply" : "Send RSVP"} <span aria-hidden="true">↗</span></button><p className={s.saveHint}>{preview ? "Saved only in this browser. This does not submit a real RSVP." : "Your response is saved securely to your invitation."}</p>{saveError && <p className={s.error} role="alert">{saveError}</p>}{savedReply && <button type="button" className={s.cancelEdit} onClick={cancelEdit}>Keep my saved reply</button>}
            </fieldset></form>
            <div className={s.paperBottom}><Sprig /><span>WITH LOVE, KARSEN & SARAH</span></div>
          </div>
        </section>}
        <section className={s.daySection} id="the-day"><div className={s.sectionIntro}><SectionHeading label="THE DAY" title="Every moment, together." /><p>Saturday, July 17, 2027<br />The places to be, and the moments we’ll share.</p></div><ol className={s.eventList}>
          <li><div className={s.eventTime}><span>I.</span><p>TIME TO FOLLOW</p></div><div className={s.eventCopy}><p className={s.eyebrow}>THE CEREMONY</p><h3>Our vows, witnessed by you.</h3><p>Join us as we exchange our vows. We’ll share the confirmed church, address, and arrival time here before invitations are sent.</p></div></li>
          {invite.reception && <li><div className={s.eventTime}><span>II.</span><p>TIME TO FOLLOW</p></div><div className={s.eventCopy}><p className={s.eyebrow}>RECEPTION, DINNER & CELEBRATION</p><h3>The Boathouse</h3><p>Restaurant & Event Venue<br />Bronte Harbour · Oakville, Ontario</p><p>Dinner, toasts, and time with our favourite people. The exact address, directions, and evening itinerary will be added once confirmed.</p></div></li>}
        </ol><div className={s.calendar}><span>KEEP THE DAY FOR US</span><div><a href={createGoogleCalendarUrl(calendar)} target="_blank" rel="noreferrer">Google <span aria-hidden="true">↗</span></a><a href={createOutlookCalendarUrl(calendar)} target="_blank" rel="noreferrer">Outlook <span aria-hidden="true">↗</span></a><button type="button" onClick={downloadCalendar}>Apple / iCal <span aria-hidden="true">↓</span></button></div></div></section>
        <section className={s.dressSection} id="dress-code"><Sprig /><SectionHeading label="DRESS CODE" title="Dressed for the occasion." /><p>Dress code and any colour guidance will be shared here when finalized.</p><span className={s.detailNote}>A LITTLE MORE TO COME</span></section>
        <section className={s.transportSection} id="transportation"><div><SectionHeading label="TRANSPORTATION" title="Your way to the celebration." /><p>We’ll help make the journey a little easier.</p></div><div className={s.transportRows}><article><h3>Getting here & parking</h3><p>Venue directions and parking information will be shared here once confirmed.</p></article>{invite.reception && <article><h3>Between the celebrations</h3><p>Any arrangements for travel between the ceremony and reception will be listed here.</p></article>}<article><h3>Staying nearby</h3><p>Nearby accommodation information will follow as plans are finalized.</p></article></div></section>
        <section className={s.faqSection} id="questions"><div><SectionHeading label="A FEW ANSWERS" title="Wondering about something?" /><p>If you can’t find what you need, we’re only an email away.</p><a className={s.textLink} href={`mailto:${wedding.contact.email}`}>{wedding.contact.email} <span aria-hidden="true">↗</span></a></div><div className={s.faqList}>{[
          ["Who is included on my invitation?", "The names shown in your RSVP are the people included on your invitation. Please contact us if anything looks incorrect."],
          ["Can I change my response?", preview ? "Yes. Your saved preview reply stays collapsed when you return in this browser. Choose ‘Edit your RSVP’ to reopen it with your answers filled in. Preview codes do not synchronize between devices." : "Yes. Enter your invitation code on any device to reopen your saved response, then choose ‘Edit your RSVP’. The final response deadline will be shown here before invitations go out."],
          ["When will the full schedule be available?", "We’re still confirming the details. Ceremony information, arrival times, and the final itinerary will be added before formal invitations are sent."],
          ...(invite.reception ? [["What if I have an allergy or dietary requirement?", "Please use the dietary requirements field beside your name. The final menu will be added when it is confirmed."]] : []),
          ...(preview ? [["Is this my official RSVP?", "Not yet. This is a preview using fictional households. No real RSVP is recorded and no confirmation email is sent."]] : [])
        ].map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
        <section className={s.memories}><Sprig /><p className={s.eyebrow}>A LITTLE MORE TO COME</p><h2>The moments in between.</h2><p>{invite.reception ? "A place for your photos and a little wedding-day fun. We’ll share our guest photo album and activity links here when they’re ready." : "We’ll share a guest photo album here so we can remember the day through your eyes."}</p><div><span>GUEST PHOTO ALBUM · COMING SOON</span>{invite.reception && <span>WEDDING QUIZ · COMING SOON</span>}</div></section>
      </>}
    </main>
    <footer className={s.footer}><div><span className={s.footerNames}>Karsen & Sarah</span><p>July 17, 2027 · Oakville, Ontario</p></div><span>WITH LOVE, ALWAYS.</span>{invite && <button className={s.textButton} type="button" onClick={changeInvitation}>Change invitation <span aria-hidden="true">↗</span></button>}</footer>
  </div>;
}
