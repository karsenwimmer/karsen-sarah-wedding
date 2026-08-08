"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { SealMark } from "@/components/SealMark";
import { weddingConfig } from "@/config/wedding";

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

  function finishIntro() {
    window.sessionStorage.setItem(SESSION_KEY, "true");
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
    timers.current.push(window.setTimeout(() => setState("zooming"), 2050));
    timers.current.push(window.setTimeout(finishIntro, 2720));
  }

  return (
    <AnimatePresence>
      {state !== "hidden" ? (
        <motion.div
          className="intro"
          aria-label="Wedding save the date introduction"
          role="dialog"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
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
                      ? { y: -112, opacity: 0, scale: 5.2 }
                      : state === "opening"
                        ? { y: [-4, -94, -94], opacity: 1, scale: 1 }
                        : { y: 78, opacity: 0, scale: 0.96 }
                  }
                  transition={
                    state === "zooming"
                      ? { duration: 0.58, ease: [0.68, 0, 0.2, 1] }
                      : { duration: 2.02, delay: 0.64, ease: [0.2, 0.8, 0.2, 1] }
                  }
                >
                  <SealMark size={74} />
                  <span>{weddingConfig.couple.displayName}</span>
                  <strong>{weddingConfig.date.shortLabel}</strong>
                </motion.div>

                <motion.div
                  className="intro__envelope"
                  initial={false}
                  animate={state === "zooming" ? { opacity: 0, scale: 0.9, y: 42 } : { opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                >
                  <motion.div
                    className="intro__flap"
                    initial={false}
                    animate={{ rotateX: state === "opening" || state === "zooming" ? -178 : 0 }}
                    transition={{ duration: 0.85, delay: 0.35, ease: [0.4, 0, 0.2, 1] }}
                  />
                  <div className="intro__pocket intro__pocket--left" />
                  <div className="intro__pocket intro__pocket--right" />
                  <motion.span
                    className="intro__seal"
                    initial={false}
                    animate={
                      state === "opening" || state === "zooming"
                        ? { opacity: 0, scale: 0.82, y: 12 }
                        : { opacity: 1, scale: 1, y: 0 }
                    }
                    transition={{ duration: 0.32, ease: "easeOut" }}
                  >
                    <Image
                      src="/images/seals/ks-wax-seal-centered.png"
                      alt=""
                      width={150}
                      height={150}
                      priority
                      sizes="92px"
                    />
                  </motion.span>
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
