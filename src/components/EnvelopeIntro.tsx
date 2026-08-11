"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const SESSION_KEY = "ks-envelope-intro-played";

type IntroState = "checking" | "ready" | "opening" | "revealing" | "hidden";

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
    timers.current.push(window.setTimeout(() => setState("revealing"), 1900));
    timers.current.push(window.setTimeout(finishIntro, 5600));
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
          {state === "ready" || state === "opening" || state === "revealing" ? (
            <button
              className="intro__open"
              type="button"
              onClick={openEnvelope}
              aria-label="Open the envelope"
              disabled={state === "opening" || state === "revealing"}
            >
              <span className="intro__stage" aria-hidden="true">
                <motion.div
                  className="intro__envelope-body"
                  initial={false}
                  animate={
                    state === "revealing"
                      ? { opacity: [1, 1, 0], y: ["0vh", "66vh", "78vh"] }
                      : { opacity: 1, y: "0vh" }
                  }
                  transition={
                    state === "revealing"
                      ? { duration: 2.85, times: [0, 0.78, 1], ease: [0.26, 0.02, 0.12, 1] }
                      : { duration: 0.4, ease: "easeOut" }
                  }
                >
                  <span className="intro__envelope-edge" />
                  <span className="intro__pocket intro__pocket--left" />
                  <span className="intro__pocket intro__pocket--right" />
                  <span className="intro__pocket intro__pocket--bottom" />
                </motion.div>

                <motion.div
                  className="intro__flap"
                  initial={false}
                  animate={{
                    opacity: state === "revealing" ? [1, 1, 0] : 1,
                    rotateX: state === "opening" || state === "revealing" ? -168 : 0,
                    y: state === "opening" || state === "revealing" ? "-2.6vh" : "0vh"
                  }}
                  transition={{
                    duration: state === "revealing" ? 2.25 : 1.55,
                    times: state === "revealing" ? [0, 0.72, 1] : undefined,
                    ease: [0.28, 0, 0.14, 1]
                  }}
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
