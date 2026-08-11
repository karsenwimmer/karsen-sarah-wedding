"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const SESSION_KEY = "ks-envelope-intro-played";

type IntroState = "checking" | "ready" | "opening" | "settling" | "hidden";

export function EnvelopeIntro() {
  const [state, setState] = useState<IntroState>("checking");
  const prefersReducedMotion = useReducedMotion();
  const forceReplay = useRef(false);
  const timers = useRef<number[]>([]);

  function clearIntroTimers() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }

  useEffect(() => {
    forceReplay.current = new URLSearchParams(window.location.search).has("replayIntro");
    const hasPlayed = window.sessionStorage.getItem(SESSION_KEY) === "true";

    if (hasPlayed && !forceReplay.current) {
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
    if (!forceReplay.current) {
      window.sessionStorage.setItem(SESSION_KEY, "true");
    }
    delete document.documentElement.dataset.envelopeIntro;
    setState("hidden");

    window.requestAnimationFrame(() => {
      document.getElementById("main-content")?.focus();
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
    timers.current.push(window.setTimeout(() => setState("settling"), 4100));
    timers.current.push(window.setTimeout(finishIntro, 6600));
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
          {state === "ready" || state === "opening" || state === "settling" ? (
            <button
              className="intro__open"
              type="button"
              onClick={openEnvelope}
              aria-label="Open the envelope"
              disabled={state === "opening" || state === "settling"}
            >
              <span className="intro__stage" aria-hidden="true">
                <motion.div
                  className="intro__envelope-back"
                  initial={false}
                  animate={
                    state === "settling"
                      ? { opacity: 0, y: 230, scale: 0.96 }
                      : state === "opening"
                        ? { opacity: [1, 0.98, 0.82], y: [0, 84, 205], scale: 1 }
                        : { opacity: 1, y: 0, scale: 1 }
                  }
                  transition={
                    state === "settling"
                      ? { duration: 1.4, ease: [0.42, 0, 0.18, 1] }
                      : { duration: 3.25, delay: 0.74, ease: [0.18, 0.72, 0.16, 1] }
                  }
                />

                <motion.div
                  className="intro__envelope-front"
                  initial={false}
                  animate={
                    state === "settling"
                      ? { opacity: 0, y: 270, scale: 0.96 }
                      : state === "opening"
                        ? { opacity: [1, 0.98, 0.84], y: [0, 108, 248], scale: 1 }
                        : { opacity: 1, y: 0, scale: 1 }
                  }
                  transition={
                    state === "settling"
                      ? { duration: 1.35, ease: [0.42, 0, 0.18, 1] }
                      : { duration: 3.25, delay: 0.86, ease: [0.18, 0.72, 0.16, 1] }
                  }
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
                    opacity: state === "settling" ? 0 : 1,
                    rotateX: state === "opening" || state === "settling" ? -178 : 0,
                    scale: state === "settling" ? 0.96 : 1,
                    y: state === "settling" ? 232 : state === "opening" ? 104 : 0
                  }}
                  transition={{ duration: state === "settling" ? 1.2 : 2.2, delay: state === "settling" ? 0 : 0.36, ease: [0.36, 0, 0.18, 1] }}
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
