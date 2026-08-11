"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { SaveDateMark } from "@/components/SaveDateMark";

const SESSION_KEY = "ks-envelope-intro-played";

type IntroState = "checking" | "ready" | "opening" | "zooming" | "hidden";

type IntroTarget = {
  x: number;
  y: number;
  scale: number;
};

export function EnvelopeIntro() {
  const [state, setState] = useState<IntroState>("checking");
  const [introTarget, setIntroTarget] = useState<IntroTarget>({ x: 0, y: 0, scale: 1.16 });
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  function clearIntroTimers() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }

  useEffect(() => {
    const hasPlayed = window.sessionStorage.getItem(SESSION_KEY) === "true";

    if (hasPlayed) {
      window.sessionStorage.setItem(SESSION_KEY, "true");
      const frame = window.requestAnimationFrame(() => setState("hidden"));
      return () => window.cancelAnimationFrame(frame);
    }

    const frame = window.requestAnimationFrame(() => setState("ready"));

    return () => {
      window.cancelAnimationFrame(frame);
      clearIntroTimers();
    };
  }, []);

  useEffect(() => {
    if (state === "hidden" || state === "checking") {
      delete document.documentElement.dataset.envelopeIntro;
      return;
    }

    document.documentElement.dataset.envelopeIntro = state;

    return () => {
      delete document.documentElement.dataset.envelopeIntro;
    };
  }, [state]);

  function finishIntro() {
    window.sessionStorage.setItem(SESSION_KEY, "true");
    delete document.documentElement.dataset.envelopeIntro;
    setState("hidden");

    window.requestAnimationFrame(() => {
      document.getElementById("main-content")?.focus();
    });
  }

  function calculateIntroTarget() {
    const cardName = cardRef.current?.querySelector(".save-date-mark__names");
    const heroName = document.querySelector(".hero__mark .save-date-mark__names");

    if (!(cardName instanceof HTMLElement) || !(heroName instanceof HTMLElement)) {
      setIntroTarget({ x: 0, y: 22, scale: 1.16 });
      return;
    }

    const cardRect = cardName.getBoundingClientRect();
    const heroRect = heroName.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const maxScale = viewportWidth < 760 ? 1.18 : 1.42;
    const minScale = viewportWidth < 760 ? 0.98 : 1.05;
    const measuredScale = heroRect.width / cardRect.width;
    const scale = Math.min(Math.max(measuredScale, minScale), maxScale);

    setIntroTarget({
      x: heroRect.left + heroRect.width / 2 - (cardRect.left + cardRect.width / 2),
      y: heroRect.top + heroRect.height / 2 - (cardRect.top + cardRect.height / 2),
      scale
    });
  }

  function openEnvelope() {
    if (state !== "ready") {
      return;
    }

    if (prefersReducedMotion) {
      finishIntro();
      return;
    }

    setState("opening");
    timers.current.push(
      window.setTimeout(() => {
        calculateIntroTarget();
        setState("zooming");
      }, 4300)
    );
    timers.current.push(window.setTimeout(finishIntro, 6550));
  }

  return (
    <AnimatePresence>
      {state !== "hidden" ? (
        <motion.div
          className={`intro intro--${state}`}
          aria-label="Wedding save the date introduction"
          role="dialog"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
        >
          {state === "ready" || state === "opening" || state === "zooming" ? (
            <button
              className="intro__open"
              type="button"
              onClick={openEnvelope}
              aria-label="Open the envelope"
              disabled={state === "opening" || state === "zooming"}
            >
              <span className="intro__stage" aria-hidden="true">
                <motion.div
                  className="intro__card-frame"
                  initial={false}
                  animate={
                    state === "zooming"
                      ? {
                          x: introTarget.x,
                          y: introTarget.y,
                          opacity: [1, 0.82, 0],
                          scale: introTarget.scale
                        }
                      : state === "opening"
                        ? { x: 0, y: [54, 2, -148], opacity: [0, 1, 1], scale: 1 }
                        : { x: 0, y: 72, opacity: 0, scale: 0.96 }
                  }
                  transition={
                    state === "zooming"
                      ? { duration: 2.05, ease: [0.44, 0, 0.16, 1] }
                      : { duration: 3.85, delay: 0.84, ease: [0.16, 0.72, 0.18, 1] }
                  }
                >
                  <div className="intro__card" ref={cardRef}>
                    <SaveDateMark className="intro__card-mark" includeVenue sealSize={88} />
                  </div>
                </motion.div>

                <motion.div
                  className="intro__envelope-back"
                  initial={false}
                  animate={
                    state === "zooming"
                      ? { opacity: [1, 0.55, 0], scale: 0.97, y: 72 }
                      : { opacity: 1, scale: 1, y: 0 }
                  }
                  transition={{ duration: 1.35, ease: "easeOut" }}
                />

                <motion.div
                  className="intro__envelope-front"
                  initial={false}
                  animate={
                    state === "zooming"
                      ? { opacity: [1, 0.55, 0], scale: 0.97, y: 72 }
                      : { opacity: 1, scale: 1, y: 0 }
                  }
                  transition={{ duration: 1.35, ease: "easeOut" }}
                >
                  <span className="intro__slot" />
                  <div className="intro__pocket intro__pocket--left" />
                  <div className="intro__pocket intro__pocket--right" />
                  <div className="intro__pocket intro__pocket--bottom" />
                </motion.div>

                <motion.div
                  className="intro__flap"
                  initial={false}
                  animate={{
                    opacity: state === "zooming" ? [1, 0.62, 0] : 1,
                    rotateX: state === "opening" || state === "zooming" ? -174 : 0,
                    scale: state === "zooming" ? 0.97 : 1,
                    y: state === "zooming" ? 72 : 0
                  }}
                  transition={{ duration: 2.05, delay: state === "zooming" ? 0 : 0.48, ease: [0.36, 0, 0.18, 1] }}
                >
                  <span className="intro__flap-face" />
                  <span className="intro__seal">
                    <Image
                      src="/images/seals/ks-wax-seal-aligned.png"
                      alt=""
                      width={170}
                      height={170}
                      priority
                      sizes="112px"
                    />
                  </span>
                </motion.div>
              </span>
              <span className="intro__open-label">click to open</span>
            </button>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
