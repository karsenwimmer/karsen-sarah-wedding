"use client";

import { useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { Emblem } from "./emblem";
import { demoInvitations, demoWedding as wedding, emptyResponses, findInvitation, meals,
  readResponse, responseErrors, storageKey, type DemoInvitation, type GuestResponse } from "./demo-data";
import s from "./rsvp.module.css";

export function RsvpDemo() {
  const [code, setCode] = useState("");
  const [invite, setInvite] = useState<DemoInvitation | null>(null);
  const [answers, setAnswers] = useState<GuestResponse[]>([]);
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [persistent, setPersistent] = useState(true);
  const [codeError, setCodeError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resetting, setResetting] = useState(false);
  const [resetNotice, setResetNotice] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const codeInput = useRef<HTMLInputElement>(null);
  const form = useRef<HTMLFormElement>(null);

  function focusHeading() { requestAnimationFrame(() => heading.current?.focus()); }

  function openInvitation(event: FormEvent) {
    event.preventDefault();
    const found = findInvitation(code);
    if (!found) {
      setCodeError("We couldn’t find that invitation. Please check the code on your invite and try again.");
      codeInput.current?.focus();
      return;
    }
    let saved = null;
    let canPersist = true;
    try { saved = readResponse(found, window.localStorage.getItem(storageKey(found))); }
    catch { canPersist = false; }
    setInvite(found);
    setAnswers(saved?.guests ?? emptyResponses(found));
    setNote(saved?.note ?? "");
    setConfirmed(Boolean(saved));
    setPersistent(canPersist);
    setCodeError("");
    setErrors({});
    setResetNotice("");
    focusHeading();
  }

  function updateGuest(id: string, patch: Partial<GuestResponse>) {
    setAnswers((current) => current.map((answer) => answer.guestId === id ? { ...answer, ...patch } : answer));
    setErrors((current) => { const next = { ...current }; delete next[id]; return next; });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!invite) return;
    const nextErrors = responseErrors(invite, answers);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() => {
        const id = Object.keys(nextErrors)[0];
        const answer = answers.find((item) => item.guestId === id);
        form.current?.querySelector<HTMLElement>(answer?.attendance === "yes" ? `#meal-${id}` : `#attendance-${id}-yes`)?.focus();
      });
      return;
    }
    const cleaned = answers.map((answer) => ({ ...answer,
      meal: invite.reception && answer.attendance === "yes" ? answer.meal : "" as const,
      dietary: answer.attendance === "yes" ? answer.dietary.trim() : "" }));
    let canPersist = true;
    try {
      window.localStorage.setItem(storageKey(invite), JSON.stringify({ guests: cleaned, note: note.trim(), savedAt: new Date().toISOString() }));
    } catch { canPersist = false; }
    setAnswers(cleaned);
    setPersistent(canPersist);
    setConfirmed(true);
    setResetNotice("");
    focusHeading();
  }

  function switchInvitation() {
    setInvite(null); setCode(""); setCodeError(""); setResetting(false); setResetNotice("");
    requestAnimationFrame(() => codeInput.current?.focus());
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function resetDemo() {
    let failed = false;
    for (const sample of demoInvitations) {
      try { window.localStorage.removeItem(storageKey(sample)); } catch { failed = true; }
    }
    if (invite) { setAnswers(emptyResponses(invite)); setNote(""); setConfirmed(false); }
    setErrors({}); setResetting(false);
    setResetNotice(failed ? "The current form was reset, but saved browser responses could not be cleared." : "All sample responses in this browser have been cleared.");
    focusHeading();
  }

  const attending = answers.filter((answer) => answer.attendance === "yes").length;

  return <div className={`${s.root} ${!invite ? s.entryRoot : ""}`}>
    <a className={s.skip} href="#demo-main">Skip to invitation</a>
    {invite && <div className={s.demoBar}><span className={s.demoDot} />Wedding invitation demo<span className={s.demoBarDetail}>Fictional guests · No real RSVPs are sent</span></div>}
    <header className={s.header}>
      <a href="/demo/rsvp" className={s.brand} aria-label="Luca and Victoria invitation demo"><Emblem className={s.brandMark} /><span>THE WEDDING OF<br /><strong>LUCA & VICTORIA</strong></span></a>
      {invite ? <nav aria-label="Invitation navigation"><a href="#rsvp">Your RSVP</a><a href="#details">The details</a><button type="button" onClick={switchInvitation}>Change invitation ↗</button></nav> : <span className={s.demoBadge} aria-label="Demonstration only. No real RSVPs are sent.">DEMO</span>}
    </header>

    <main id="demo-main" className={s.main}>
      {!invite ? <>
        <div className={s.entry}>
          <section className={s.invitationArt} aria-label="Sample wedding invitation">
            <div className={s.paperBorder} />
            <div className={s.paintingPanel}>
              <Image src="/images/demo/luca-victoria-oil-courtyard.webp" alt="" fill priority unoptimized sizes="(max-width: 760px) 90vw, 500px" className={s.heroPainting} />
              <div className={s.paintingVeil} />
            </div>
            <div className={s.paperContent}>
              <Emblem className={s.heroEmblem} />
              <p className={s.eyebrow}>YOU’RE INVITED TO CELEBRATE</p>
              <h1>Luca <span>&</span> Victoria</h1>
              <div className={s.paperRule} />
              <p className={s.paperDate}>{wedding.date}</p>
              <p className={s.paperLocation}>Oakville, Ontario</p>
            </div>
          </section>
          <section id="invitation-entry" className={s.entryForm} aria-labelledby="entry-title">
            <h2 id="entry-title"><label htmlFor="invitation-code">Enter your code</label></h2>
            <p id="code-help" className={s.codeExplanation}>You’ll find it on your invitation.</p>
            <form onSubmit={openInvitation}>
              <div className={`${s.codeBar} ${codeError ? s.codeBarError : ""}`}>
                <input ref={codeInput} id="invitation-code" className={s.codeInput} value={code} onChange={(event) => { setCode(event.target.value); setCodeError(""); }} autoCapitalize="characters" autoCorrect="off" autoComplete="off" spellCheck={false} maxLength={24} placeholder="Enter code" aria-invalid={Boolean(codeError)} aria-describedby={codeError ? "code-help code-error" : "code-help"} required />
                <button className={s.codeSubmit} type="submit" aria-label="Open my invitation"><Arrow /></button>
              </div>
              {codeError && <p id="code-error" className={s.error} role="alert">{codeError}</p>}
            </form>
          </section>
        </div>
      </> : <>
        <section className={s.welcome}>
          <p className={s.eyebrow}>{confirmed ? "WITH LOVE & THANKS" : "AN INVITATION FOR"}</p>
          <h1 ref={heading} tabIndex={-1}>{invite.household}</h1>
          <p className={s.welcomeDate}>{wedding.date} <span aria-hidden="true">·</span> {wedding.location}</p>
          <p>{invite.reception ? "We’d love to celebrate our ceremony and reception with you." : "We’d love for you to join us at our wedding ceremony."}</p>
          <span className={s.tag}>{invite.reception ? "CEREMONY & RECEPTION" : "CEREMONY INVITATION"} <span aria-hidden="true">·</span> {invite.guests.length} INVITED GUESTS</span>
        </section>
        <div className={s.inviteGrid}>
          <section id="rsvp" className={s.responsePanel} aria-labelledby="rsvp-title">
            {confirmed ? <>
              <div className={s.check} aria-hidden="true">✓</div>
              <p className={s.eyebrow}>DEMO RESPONSE {persistent ? "SAVED" : "PREVIEW"}</p>
              <h2 id="rsvp-title">{attending ? "A little closer to the big day." : "Thank you for letting us know."}</h2>
              <p className={s.muted}>{persistent ? "Your sample response is saved in this browser. Nothing has been sent to a couple." : "Your browser couldn’t save this response. It’s visible here until you leave the page; nothing has been sent."}</p>
              <div className={s.summary}>{invite.guests.map((guest) => {
                const answer = answers.find((item) => item.guestId === guest.id)!;
                return <div className={s.summaryGuest} key={guest.id}><strong>{guest.name}</strong><span>{answer.attendance === "yes" ? "Joyfully attending" : "Respectfully declining"}</span>{answer.attendance === "yes" && invite.reception && <small>{meals.find((meal) => meal.id === answer.meal)?.label}</small>}{answer.dietary && <small>Dietary requirements: {answer.dietary}</small>}</div>;
              })}</div>
              {note && <div className={s.noteSummary}><strong>Your note</strong><p>{note}</p></div>}
              <button type="button" className={s.primary} onClick={() => { setConfirmed(false); focusHeading(); }}>Edit my response <Arrow /></button>
              <p className={s.fieldHint}>In the live version, guests can update their reply until {wedding.deadline}.</p>
            </> : <>
              <p className={s.eyebrow}>KINDLY REPLY BY {wedding.deadline.toUpperCase()}</p>
              <h2 id="rsvp-title">Will you be joining us?</h2>
              <p className={s.muted}>Please reply for each person on your invitation.{invite.reception ? " Choose a meal for everyone attending." : " This invitation is for the ceremony."}</p>
              <form ref={form} onSubmit={submit} noValidate>
                {invite.guests.map((guest, index) => {
                  const answer = answers.find((item) => item.guestId === guest.id)!;
                  return <fieldset key={guest.id} className={s.guest} aria-describedby={errors[guest.id] ? `error-${guest.id}` : undefined}>
                    <legend><span className={s.guestNumber}>{String(index + 1).padStart(2, "0")}</span>{guest.name}{guest.child && <small>CHILD</small>}</legend>
                    <div className={s.attendance}>{([{ value: "yes", label: "Joyfully attending" }, { value: "no", label: "Respectfully declining" }] as const).map((option) => <label key={option.value} className={answer.attendance === option.value ? s.chosen : ""}><input id={`attendance-${guest.id}-${option.value}`} type="radio" name={`attendance-${guest.id}`} value={option.value} checked={answer.attendance === option.value} onChange={() => updateGuest(guest.id, { attendance: option.value, ...(option.value === "no" ? { meal: "", dietary: "" } : {}) })} aria-invalid={Boolean(errors[guest.id])} aria-describedby={errors[guest.id] ? `error-${guest.id}` : undefined} />{option.label}</label>)}</div>
                    {answer.attendance === "yes" && <div className={s.guestFields}>
                      {invite.reception && <label className={s.field} htmlFor={`meal-${guest.id}`}>Meal for {guest.name.split(" ")[0]}<select id={`meal-${guest.id}`} value={answer.meal} onChange={(event) => updateGuest(guest.id, { meal: event.target.value as GuestResponse["meal"] })} aria-invalid={Boolean(errors[guest.id])} aria-describedby={errors[guest.id] ? `error-${guest.id}` : undefined}><option value="">Select a meal</option>{meals.filter((meal) => guest.child || meal.id !== "children").map((meal) => <option value={meal.id} key={meal.id}>{meal.label}</option>)}</select></label>}
                      <label className={s.field} htmlFor={`dietary-${guest.id}`}>Dietary requirements for {guest.name.split(" ")[0]} <span className={s.optional}>(optional)</span><input id={`dietary-${guest.id}`} value={answer.dietary} onChange={(event) => updateGuest(guest.id, { dietary: event.target.value })} maxLength={300} placeholder="Allergies or anything we should know" /></label>
                    </div>}
                    {errors[guest.id] && <p id={`error-${guest.id}`} className={s.error} role="alert">{errors[guest.id]}</p>}
                  </fieldset>;
                })}
                <label className={s.field} htmlFor="guest-note">A note for the couple <span className={s.optional}>(optional)</span><textarea id="guest-note" rows={3} value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} placeholder="Leave a little love…" /></label>
                <button className={s.primary} type="submit">Save demo RSVP <Arrow /></button>
                <p className={s.fieldHint}>Demo only. No email is sent and no real guest list is updated.</p>
              </form>
            </>}
          </section>
          <aside id="details" className={s.details} aria-label="Wedding details">
            <div className={s.detailsIntro}><p className={s.eyebrow}>THE WEDDING OF</p><h2>Luca <span>&</span> Victoria</h2><p>{wedding.date}</p><div className={s.paperRule} aria-hidden="true" /></div>
            <section className={s.detailBlock}><span className={s.detailIcon} aria-hidden="true">01</span><div><p className={s.eyebrow}>THE CEREMONY · {wedding.ceremony.time}</p><h3>{wedding.ceremony.name}</h3><p>{wedding.ceremony.address}</p><p className={s.fieldHint}>Please arrive 15 minutes before the ceremony.</p></div></section>
            {invite.reception && <section className={s.detailBlock}><span className={s.detailIcon} aria-hidden="true">02</span><div><p className={s.eyebrow}>THE RECEPTION · {wedding.reception.time}</p><h3>{wedding.reception.name}</h3><p>{wedding.reception.address}</p><p className={s.fieldHint}>Dinner, dancing, and a few happy tears.</p></div></section>}
            <section className={s.detailSection}><p className={s.eyebrow}>THE ORDER OF THE DAY</p><ol className={s.timeline}><li><time>1:45 PM</time><span>Arrive & settle in</span></li><li><time>2:00 PM</time><span>We say “I do”</span></li>{invite.reception && <><li><time>4:30 PM</time><span>Cocktails & conversation</span></li><li><time>6:00 PM</time><span>Dinner & toasts</span></li><li><time>8:00 PM</time><span>Meet us on the dance floor</span></li></>}</ol></section>
            <section className={s.detailSection}><p className={s.eyebrow}>WHAT TO WEAR</p><h3>Garden formal</h3><p>Suits, dresses, and whatever makes you feel your best. The garden paths are happiest with comfortable shoes.</p></section>
            <section className={s.detailSection}><p className={s.eyebrow}>A FEW LITTLE DETAILS</p><details><summary>Who is included on my invitation?</summary><p>Everyone listed in your RSVP form is invited. In a live invitation, plus-ones and children would be included here if invited.</p></details><details><summary>Can I change my response?</summary><p>Yes. Return with the same code and choose “Edit my response”. This demo remembers replies in the same browser. A live site would remember them across devices until the RSVP deadline.</p></details><details><summary>Are these real wedding locations?</summary><p>No. The names, addresses, menu, and itinerary are fictional examples for this demonstration.</p></details></section>
          </aside>
        </div>
        <section className={s.demoTools} aria-label="Demo controls">
          <div><strong>Make yourself at home in the demo.</strong><p>Try another invitation or clear the sample responses saved in this browser.</p></div>
          <div className={s.toolButtons}><button type="button" onClick={switchInvitation}>Try another code ↗</button><button type="button" onClick={() => setResetting(true)}>Reset demo</button></div>
          {resetting && <div className={s.resetConfirm} role="group" aria-label="Confirm demo reset"><p>Clear all three sample invitations’ responses in this browser?</p><button type="button" onClick={resetDemo}>Yes, clear demo responses</button><button type="button" onClick={() => setResetting(false)}>Keep responses</button></div>}
          {resetNotice && <p role="status" className={s.resetNotice}>{resetNotice}</p>}
        </section>
      </>}
    </main>
    {invite && <footer className={s.footer}><span>WITH LOVE, LUCA & VICTORIA</span><span>A sample invitation, made for a real celebration.</span><span>DEMONSTRATION ONLY</span></footer>}
  </div>;
}

function Arrow() {
  return <svg className={s.arrow} viewBox="0 0 28 20" fill="none" aria-hidden="true"><path d="M2 10h23M18 3l7 7-7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
