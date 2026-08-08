"use client";

import { useEffect, useState } from "react";
import { weddingConfig } from "@/config/wedding";
import { CountdownParts, formatCountdownNumber, getCountdownParts } from "@/lib/countdown";

const emptyCountdown: CountdownParts = {
  isComplete: false,
  totalMilliseconds: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0
};

export function Countdown() {
  const [parts, setParts] = useState<CountdownParts | null>(null);

  useEffect(() => {
    function updateCountdown() {
      setParts(getCountdownParts(weddingConfig.date.iso));
    }

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const displayParts = parts ?? emptyCountdown;
  const items = [
    ["Days", displayParts.days.toString()],
    ["Hours", formatCountdownNumber(displayParts.hours)],
    ["Minutes", formatCountdownNumber(displayParts.minutes)],
    ["Seconds", formatCountdownNumber(displayParts.seconds)]
  ];

  if (parts?.isComplete) {
    return (
      <p className="countdown-finished" aria-live="polite">
        Today is the day.
      </p>
    );
  }

  return (
    <div className="countdown" aria-label={`Countdown to ${weddingConfig.date.label}`} aria-live="polite">
      {items.map(([label, value]) => (
        <div className="countdown__item" key={label}>
          <span className="countdown__value">{parts ? value : "--"}</span>
          <span className="countdown__label">{label}</span>
        </div>
      ))}
    </div>
  );
}
