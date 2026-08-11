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
    timers.current.push(window.setTimeout(() => setState("revealing"), 3200));
    timers.current.push(window.setTimeout(finishIntro, 6200));
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
                  className="intro__envelope-shell"
                  initial={false}
                  animate={
                    state === "revealing"
                      ? { opacity: [1, 1, 0], y: [0, 285, 315], scale: [1, 1, 0.98] }
                      : { opacity: 1, y: 0, scale: 1 }
                  }
                  transition={
                    state === "revealing"
                      ? { duration: 2.25, times: [0, 0.68, 1], ease: [0.34, 0, 0.15, 1] }
                      : { duration: 0.4, ease: "easeOut" }
                  }
                >
                  <div className="intro__envelope-back" />

                  <motion.div
                    className="intro__envelope-front"
                    initial={false}
                    animate={
                      state === "opening" || state === "revealing"
                        ? { y: 150 }
                        : { y: 0 }
                    }
                    transition={{ duration: 3.15, delay: 0.62, ease: [0.18, 0.74, 0.16, 1] }}
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
                      opacity: state === "revealing" ? 0 : 1,
                      rotateX: state === "opening" || state === "revealing" ? -178 : 0,
                      y: state === "opening" || state === "revealing" ? 24 : 0
                    }}
                    transition={{ duration: 2.35, delay: 0.26, ease: [0.36, 0, 0.18, 1] }}
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
