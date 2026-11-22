"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { Emblem } from "./emblem";
import { demoInvitations, demoWedding as wedding, emptyResponses, findInvitation,
  readResponse, responseErrors, storageKey, type DemoInvitation, type GuestResponse } from "./demo-data";
import s from "./rsvp.module.css";

export function RsvpDemo() {
  const [code, setCode] = useState("");
  const [codePosition, setCodePosition] = useState(0);
  const [invite, setInvite] = useState<DemoInvitation | null>(null);
  const [answers, setAnswers] = useState<GuestResponse[]>([]);
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [persistent, setPersistent] = useState(true);
  const [codeError, setCodeError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resetting, setResetting] = useState(false);
  const [resetNotice, setResetNotice] = useState("");
  const welcome = useRef<HTMLElement>(null);
  const instructions = useRef<HTMLDivElement>(null);
  const revealRoot = useRef<HTMLDivElement>(null);
  const revealed = useRef(new WeakSet<Element>());
  const scrollFrame = useRef<number | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const responseHeading = useRef<HTMLHeadingElement>(null);
  const codeInput = useRef<HTMLInputElement>(null);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const element = codeInput.current?.parentElement;
    if (!element) return;
    let visible = typeof IntersectionObserver === "undefined";
    const update = () => element.style.setProperty("--code-light-play", visible && !document.hidden ? "running" : "paused");
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer?.observe(element);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [invite]);

  useEffect(() => {
    const stop = () => {
      if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
      scrollFrame.current = null;
    };
    const stopOnKey = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Tab", "Escape"].includes(event.key)) stop();
    };
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("keydown", stopOnKey);
    return () => {
      stop();
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stopOnKey);
    };
  }, []);

  useEffect(() => {
    const element = instructions.current;
    if (!element) return;
    const measure = () => element.style.setProperty("--instructions-height", `${element.getBoundingClientRect().height}px`);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [invite]);

  useEffect(() => {
    const region = revealRoot.current;
    const preference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!region || preference?.matches || typeof IntersectionObserver === "undefined") return;
    const animations = new Set<Animation>();
    const pending = new Set<HTMLElement>();
    const inset = Math.min(180, Math.round(window.innerHeight * .18));
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (preference?.matches) return;
        if (!entry.isIntersecting || entry.intersectionRatio < .55) continue;
        observer.unobserve(entry.target);
        if (revealed.current.has(entry.target)) continue;
        revealed.current.add(entry.target);
        if (typeof entry.target.animate !== "function") continue;
        (entry.target as HTMLElement).removeAttribute("data-reveal-pending");
        pending.delete(entry.target as HTMLElement);
        const kind = (entry.target as HTMLElement).dataset.inviteReveal;
        const personal = kind === "name";
        const title = kind === "heading" || kind === "hero";
        const animation = entry.target.animate(
          personal ? [
            { opacity: .12, transform: "translateY(14px)", filter: "blur(3px)" },
            { opacity: .55, transform: "translateY(6px)", filter: "blur(0px)", offset: .5 },
            { opacity: 1, transform: "translateY(0)", filter: "blur(0px)" }
          ] : [
            { opacity: title ? .18 : .3, transform: `translateY(${title ? 12 : 8}px)` },
            { opacity: 1, transform: "translateY(0)" }
          ],
          { duration: personal ? 1600 : title ? 1100 : 900,
            delay: kind === "welcome-copy" ? 280 : title ? 0 : 100,
            easing: personal ? "cubic-bezier(.4, 0, .2, 1)" : "cubic-bezier(.25, .1, .25, 1)", fill: "backwards" }
        );
        animations.add(animation);
        animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
      }
    }, { threshold: .55, rootMargin: `0px 0px -${inset}px 0px` });
    region.querySelectorAll<HTMLElement>("[data-invite-reveal]").forEach((element) => {
      if (revealed.current.has(element) || typeof element.animate !== "function") return;
      const rect = element.getBoundingClientRect();
      if (rect.height > window.innerHeight - inset) return;
      if (rect.top >= window.innerHeight - inset) {
        element.setAttribute("data-reveal-pending", "");
        pending.add(element);
      }
      observer.observe(element);
    });
    const stop = () => {
      observer.disconnect();
      animations.forEach((animation) => animation.cancel());
      animations.clear();
      pending.forEach((element) => element.removeAttribute("data-reveal-pending"));
      pending.clear();
    };
    const updatePreference = () => { if (preference?.matches) stop(); };
    preference?.addEventListener?.("change", updatePreference);
    return () => {
      stop();
      preference?.removeEventListener?.("change", updatePreference);
    };
  }, [invite]);

  function focusHeading(response = false) {
    if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
    scrollFrame.current = requestAnimationFrame(() => {
      scrollFrame.current = null;
      const target = response ? responseHeading.current : heading.current;
      target?.focus({ preventScroll: true });
      const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (response) {
        target?.scrollIntoView?.({ block: "start", behavior: reducedMotion ? "auto" : "smooth" });
        return;
      }
      if (!welcome.current) return;
      const start = window.scrollY;
      const end = Math.max(0, welcome.current.getBoundingClientRect().top + start - 32);
      if (reducedMotion) {
        window.scrollTo({ top: end, behavior: "instant" });
        return;
      }
      let started: number | undefined;
      const glide = (time: number) => {
        started ??= time;
        const progress = Math.min((time - started) / 1150, 1);
        const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
        window.scrollTo({ top: start + (end - start) * eased, behavior: "instant" });
        scrollFrame.current = progress < 1 ? requestAnimationFrame(glide) : null;
      };
      scrollFrame.current = requestAnimationFrame(glide);
    });
  }

  function openInvitation(event: FormEvent) {
    event.preventDefault();
    if (!/^\d{4}$/.test(code)) {
      setCodeError("Please enter the 4-digit code from your invitation.");
      codeInput.current?.focus();
      return;
    }
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
        form.current?.querySelector<HTMLElement>(`#attendance-${id}-yes`)?.focus();
      });
      return;
    }
    const cleaned = answers.map((answer) => ({ guestId: answer.guestId, attendance: answer.attendance,
      dietary: invite.reception && answer.attendance === "yes" ? answer.dietary.trim() : "" }));
    let canPersist = true;
    try {
      window.localStorage.setItem(storageKey(invite), JSON.stringify({ guests: cleaned, note: note.trim(), savedAt: new Date().toISOString() }));
    } catch { canPersist = false; }
    setAnswers(cleaned);
    setPersistent(canPersist);
    setConfirmed(true);
    setResetNotice("");
    focusHeading(true);
  }

  function switchInvitation() {
    if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
    scrollFrame.current = null;
    setInvite(null); setCode(""); setCodePosition(0); setCodeError(""); setResetting(false); setResetNotice("");
    setAnswers([]); setNote(""); setConfirmed(false); setErrors({});
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
    focusHeading(true);
  }

  const attending = answers.filter((answer) => answer.attendance === "yes").length;

  return <div ref={revealRoot} className={s.root}>
    <a className={s.skip} href="#demo-main">Skip to invitation</a>
    <header className={s.header}>
      <a href="/demo/rsvp" className={s.brand} aria-label="Luca and Victoria invitation demo"><Emblem className={s.brandMark} /><span><strong>VICTORIA & LUCA</strong></span></a>
      <span className={s.demoBadge} aria-label="Demonstration only. No real RSVPs are sent.">DEMO</span>
    </header>

    <main id="demo-main" className={s.main}>
      <div className={s.hero}>
        <div className={s.entry}>
          <section className={s.invitationArt} aria-label="Sample wedding invitation">
            <div className={s.paperContent}>
              <Emblem className={s.heroEmblem} />
              <h1 data-invite-reveal="hero"><span>Victoria Pacheco</span><i className={s.nameJoin}>&amp;</i><span>Luca Robert Cordiano</span></h1>
              <p className={s.paperMessage} data-invite-reveal="copy"><span>with full hearts,</span>joyfully invite you to their wedding</p>
              <p className={s.paperDate} data-invite-reveal="copy">{wedding.date}</p>
            </div>
          </section>
          <div className={s.paintingPanel}>
            <Image src="/images/demo/luca-victoria-watercolour-portrait-v3.webp" alt="Victoria and Luca holding hands in a garden, with softly painted watercolour surroundings." fill loading="eager" fetchPriority="high" unoptimized sizes="(max-width: 760px) 100vw, 600px" className={s.heroPainting} />
          </div>
          <section id="invitation-entry" className={`${s.entryForm} ${!invite ? s.codePrompt : ""}`} aria-labelledby="entry-title">
            {invite ? <div className={s.openedEntry}>
              <h2 id="entry-title">Your invitation is open</h2>
              <a href="#your-invitation" className={s.openedLink} onClick={(event) => { event.preventDefault(); focusHeading(); }}>View your invitation <span className={s.downArrow} aria-hidden="true"><Arrow /></span></a>
              <button type="button" onClick={switchInvitation}>Change invitation</button>
            </div> : <>
            <h2 id="entry-title" data-invite-reveal="heading"><label htmlFor="invitation-code">Enter your code</label></h2>
            <p id="code-help" className={s.codeExplanation} data-invite-reveal="copy">You’ll find the 4-digit code on your invitation.</p>
            <form onSubmit={openInvitation} noValidate>
              <div className={`${s.codeBar} ${codeError ? s.codeBarError : ""}`}>
                <span className={s.codeDigits} aria-hidden="true">{Array.from({ length: 4 }, (_, index) => <span key={index} data-active={index === codePosition}>{code[index] ?? ""}</span>)}</span>
                <input ref={codeInput} id="invitation-code" name="invitation-code" className={s.codeInput} value={code}
                  onChange={(event) => { const next = event.currentTarget.value.replace(/\D/g, "").slice(0, 4); setCode(next); setCodePosition(Math.min(event.currentTarget.selectionStart ?? next.length, 3)); setCodeError(""); }}
                  onSelect={(event) => setCodePosition(Math.min(event.currentTarget.selectionStart ?? code.length, 3))}
                  onClick={(event) => { const input = event.currentTarget; const rect = input.getBoundingClientRect(); const index = Math.min(Math.max(Math.floor((event.clientX - rect.left) / rect.width * 4), 0), code.length, 3); input.setSelectionRange(index, Math.min(index + 1, code.length)); setCodePosition(index); }}
                  onPaste={(event) => { event.preventDefault(); const next = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4); setCode(next); setCodeError(""); setCodePosition(Math.min(next.length, 3)); requestAnimationFrame(() => codeInput.current?.setSelectionRange(next.length, next.length)); }}
                  inputMode="numeric" pattern="[0-9]{4}" autoCorrect="off" autoComplete="off" spellCheck={false} maxLength={4} aria-invalid={Boolean(codeError)} aria-describedby={codeError ? "code-help code-error" : "code-help"} required />
                <button className={s.codeSubmit} type="submit" aria-label="Open my invitation"><Arrow /></button>
              </div>
              {codeError && <p id="code-error" className={s.error} role="alert">{codeError}</p>}
            </form>
            </>}
          </section>
        </div>
      </div>
      {invite && <div>
        <section ref={welcome} id="your-invitation" className={s.welcome} aria-labelledby="household-title">
          <p className={s.guestEyebrow} data-invite-reveal="welcome-copy">{confirmed ? "WITH LOVE & THANKS" : "AN INVITATION FOR"}</p>
          <h2 id="household-title" ref={heading} tabIndex={-1} data-invite-reveal="name">{invite.household}</h2>
          <p className={s.welcomeDate} data-invite-reveal="welcome-copy">{wedding.date} <span aria-hidden="true">·</span> {wedding.ceremony.time} <span aria-hidden="true">·</span> {wedding.location}</p>
          <span className={s.tag} data-invite-reveal="welcome-copy">{invite.reception ? "CEREMONY & RECEPTION" : "CEREMONY INVITATION"} <span aria-hidden="true">·</span> {invite.guests.length} INVITED GUESTS</span>
        </section>
        <section id="rsvp" className={s.inviteGrid} aria-labelledby="reply-title">
          <div ref={instructions} className={s.rsvpInstructions}>
            <h2 id="reply-title" data-invite-reveal="heading">Will you be joining us?</h2>
            <ol className={s.replySteps} data-invite-reveal="copy">
              <li>Reply for each person named on your invitation.</li>
              {invite.reception && <li>Add any dietary requirements or allergies for each guest attending.</li>}
              <li>Save your response.</li>
            </ol>
            <p className={s.instructionNote} data-invite-reveal="copy">You can return with your invitation code to make changes.</p>
          </div>
          <section className={s.responsePanel} aria-labelledby="rsvp-title">
            {confirmed ? <>
              <div className={s.check} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m6 12 4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
              <h3 id="rsvp-title" ref={responseHeading} tabIndex={-1}>{attending ? "A little closer to the big day." : "Thank you for letting us know."}</h3>
              <p className={s.savedStatus}>DEMO RESPONSE {persistent ? "SAVED" : "PREVIEW"}</p>
              <p className={s.muted}>{persistent ? "Your sample response is saved in this browser. Nothing has been sent to a couple." : "Your browser couldn’t save this response. It’s visible here until you leave the page; nothing has been sent."}</p>
              <div className={s.summary}>{invite.guests.map((guest) => {
                const answer = answers.find((item) => item.guestId === guest.id)!;
                return <div className={s.summaryGuest} key={guest.id}><strong>{guest.name}</strong><span>{answer.attendance === "yes" ? "Joyfully attending" : "Respectfully declining"}</span>{answer.attendance === "yes" && invite.reception && <small>{answer.dietary ? `Dietary requirements: ${answer.dietary}` : "Standard menu · No dietary requirements provided"}</small>}</div>;
              })}</div>
              {note && <div className={s.noteSummary}><strong>Your note</strong><p>{note}</p></div>}
              <button type="button" className={s.primary} onClick={() => { setConfirmed(false); focusHeading(true); }}>Edit my response</button>
              <p className={s.fieldHint}>You can return with your code to update this demo response.</p>
            </> : <>
              <h3 id="rsvp-title" ref={responseHeading} tabIndex={-1} data-invite-reveal="heading">Your response</h3>
              <form ref={form} onSubmit={submit} noValidate>
                {invite.reception && <p className={s.menuNote}>The standard menu includes chicken and beef. Please let us know if you require an alternative.</p>}
                {invite.guests.map((guest) => {
                  const answer = answers.find((item) => item.guestId === guest.id)!;
                  return <div key={guest.id} className={s.guestBlock}><fieldset className={s.guest} aria-describedby={errors[guest.id] ? `error-${guest.id}` : undefined}>
                    <legend>{guest.name}{guest.child && <small>CHILD</small>}</legend>
                    <div className={`${s.attendance} ${errors[guest.id] && !answer.attendance ? s.attendanceError : ""}`}>{([{ value: "yes", label: "Joyfully attending" }, { value: "no", label: "Respectfully declining" }] as const).map((option) => <label key={option.value} className={answer.attendance === option.value ? s.chosen : ""}><input id={`attendance-${guest.id}-${option.value}`} type="radio" name={`attendance-${guest.id}`} value={option.value} checked={answer.attendance === option.value} onChange={() => updateGuest(guest.id, { attendance: option.value, ...(option.value === "no" ? { dietary: "" } : {}) })} aria-describedby={errors[guest.id] ? `error-${guest.id}` : undefined} />{option.label}</label>)}</div>
                    {answer.attendance === "yes" && invite.reception && <div className={s.guestFields}>
                      <label className={s.field} htmlFor={`dietary-${guest.id}`}>Dietary requirements or allergies for {guest.name.split(" ")[0]} <span className={s.optional}>(optional)</span><textarea id={`dietary-${guest.id}`} name={`dietary-${guest.id}`} autoComplete="off" rows={2} value={answer.dietary} onChange={(event) => updateGuest(guest.id, { dietary: event.target.value })} maxLength={300} placeholder="e.g. vegetarian, pescatarian, gluten-free, or food allergies" /></label>
                    </div>}
                    {errors[guest.id] && <p id={`error-${guest.id}`} className={s.error} role="alert">{errors[guest.id]}</p>}
                  </fieldset></div>;
                })}
                <label className={s.field} htmlFor="guest-note">A note for the couple <span className={s.optional}>(optional)</span><textarea id="guest-note" name="guest-note" autoComplete="off" rows={3} value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} placeholder="Leave a little love…" /></label>
                <button className={s.primary} type="submit">Save demo RSVP</button>
                <p className={s.fieldHint}>Demo only. No email is sent and no real guest list is updated.</p>
              </form>
            </>}
          </section>
        </section>
        <section id="details" className={s.detailBand} aria-labelledby="locations-title">
          <div className={s.detailInner}>
            <div className={s.sectionHeading} data-detail-heading data-invite-reveal="heading"><h2 id="locations-title">Locations</h2></div>
            <div className={s.locationsGrid}>
              <section className={s.location} data-invite-reveal="copy"><h3>{wedding.ceremony.name}</h3><p className={s.locationTime}>Ceremony at {wedding.ceremony.time}</p><p>{wedding.ceremony.address}</p></section>
              {invite.reception && <section className={s.location} data-invite-reveal="copy"><h3>{wedding.reception.name}</h3><p className={s.locationTime}>Reception at {wedding.reception.time}</p><p>{wedding.reception.address}</p></section>}
            </div>
          </div>
        </section>
        <section id="itinerary" className={s.detailBand} aria-labelledby="itinerary-title">
          <div className={s.detailInner}>
            <div className={s.sectionHeading} data-detail-heading data-invite-reveal="heading"><h2 id="itinerary-title">Itinerary</h2></div>
            <ol className={s.timeline} data-invite-reveal="copy"><li><time>{wedding.ceremony.time}</time><span>Wedding ceremony</span></li>{invite.reception && <><li><time>{wedding.reception.time}</time><span>Reception &amp; antipasto bar</span></li><li><time>To follow</time><span>Dinner</span></li></>}</ol>
            <p className={s.itineraryNote}>Further itinerary details to come.</p>
          </div>
        </section>
        <section id="dress-code" className={s.detailBand} aria-labelledby="dress-code-title">
          <div className={s.detailInner}>
            <div className={s.sectionHeading} data-detail-heading data-invite-reveal="heading"><h2 id="dress-code-title">Dress code</h2></div>
            <div className={s.detailCopy} data-invite-reveal="copy"><h3>Details to come</h3><p>We’ll share the dress code here once it’s confirmed.</p></div>
          </div>
        </section>
        <section id="faq" className={s.detailBand} aria-labelledby="faq-title">
          <div className={s.detailInner}>
            <div className={s.sectionHeading} data-detail-heading data-invite-reveal="heading"><h2 id="faq-title">FAQs</h2></div>
            <div className={s.faq} data-invite-reveal="copy">
              <details><summary>Who is included on my invitation?</summary><p>Everyone listed in your RSVP form is invited. In a live invitation, plus-ones and children would be included here if invited.</p></details>
              <details><summary>Can I change my response?</summary><p>Yes. Return with the same code and choose “Edit my response”. This demo remembers replies in the same browser. A live site would remember them across devices.</p></details>
              <details><summary>Which details are confirmed?</summary><p>The wedding date and ceremony details are confirmed.{invite.reception && " The reception begins at 5:30 PM at The Venetian Banquet Hall, with an antipasto bar and dinner to follow."} Further itinerary details and dress code are still to come. Guest names are examples for this demo.</p></details>
            </div>
          </div>
        </section>
        <section className={s.demoTools} aria-label="Demo controls">
          <div><strong>Make yourself at home in the demo.</strong><p>Try another invitation or clear the sample responses saved in this browser.</p></div>
          <div className={s.toolButtons}><button type="button" onClick={switchInvitation}>Try another code</button><button type="button" onClick={() => setResetting(true)}>Reset demo</button></div>
          {resetting && <div className={s.resetConfirm} role="group" aria-label="Confirm demo reset"><p>Clear all three sample invitations’ responses in this browser?</p><button type="button" onClick={resetDemo}>Yes, clear demo responses</button><button type="button" onClick={() => setResetting(false)}>Keep responses</button></div>}
          {resetNotice && <p role="status" className={s.resetNotice}>{resetNotice}</p>}
        </section>
      </div>}
    </main>
    {invite && <footer className={s.footer}><span>WITH LOVE, VICTORIA & LUCA</span><span>A sample invitation, made for a real celebration.</span><span>DEMONSTRATION ONLY</span></footer>}
  </div>;
}

function Arrow() {
  return <svg className={s.arrow} viewBox="0 0 28 20" fill="none" aria-hidden="true"><path d="M2 10h23M18 3l7 7-7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
