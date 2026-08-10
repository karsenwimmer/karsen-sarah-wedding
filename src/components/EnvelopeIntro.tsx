"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { SaveDateMark } from "@/components/SaveDateMark";

const SESSION_KEY = "ks-envelope-intro-played";

type IntroState = "checking" | "ready" | "opening" | "zooming" | "hidden";

export function EnvelopeIntro() {
  const [state, setState] = useState<IntroState>("checking");
  const prefersReducedMotion = useReducedMotion();
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

  function openEnvelope() {
    if (state !== "ready") {
      return;
    }

    if (prefersReducedMotion) {
      finishIntro();
      return;
    }

    setState("opening");
    timers.current.push(window.setTimeout(() => setState("zooming"), 4300));
    timers.current.push(window.setTimeout(finishIntro, 6350));
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
                  className="intro__card"
                  initial={false}
                  animate={
                    state === "zooming"
                      ? { y: 42, opacity: [1, 0.74, 0.03], scale: 1.72 }
                      : state === "opening"
                        ? { y: [-8, -92, -92], opacity: 1, scale: 1 }
                        : { y: 118, opacity: 0, scale: 0.94 }
                  }
                  transition={
                    state === "zooming"
                      ? { duration: 2.02, ease: [0.44, 0, 0.16, 1] }
                      : { duration: 3.75, delay: 0.92, ease: [0.16, 0.72, 0.18, 1] }
                  }
                >
                  <SaveDateMark className="intro__card-mark" includeVenue sealSize={88} />
                </motion.div>

                <motion.div
                  className="intro__envelope"
                  initial={false}
                  animate={
                    state === "zooming"
                      ? { opacity: [1, 0.55, 0], scale: 0.97, y: 72 }
                      : { opacity: 1, scale: 1, y: 0 }
                  }
                  transition={{ duration: 1.35, ease: "easeOut" }}
                >
                  <motion.div
                    className="intro__flap"
                    initial={false}
                    animate={{
                      rotateX: state === "opening" || state === "zooming" ? -174 : 0
                    }}
                    transition={{ duration: 2.05, delay: 0.48, ease: [0.36, 0, 0.18, 1] }}
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
                  <div className="intro__pocket intro__pocket--left" />
                  <div className="intro__pocket intro__pocket--right" />
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
