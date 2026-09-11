"use client";

import { useEffect, useState } from "react";

function splitRemaining(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

const pad = (n: number) => n.toString().padStart(2, "0");

export function SidraCountdown({ target }: { target: Date }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const { days, hours, minutes, seconds } = splitRemaining(target.getTime() - now);

  return (
    <div className="countdown-box">
      <span className="countdown-label">🍏 La que nos vamos a dar el viernes!!!</span>
      <div className="countdown-digits">
        <div className="countdown-unit">
          <span className="countdown-value">{pad(days)}</span>
          <span className="countdown-caption">días</span>
        </div>
        <span className="countdown-sep">:</span>
        <div className="countdown-unit">
          <span className="countdown-value">{pad(hours)}</span>
          <span className="countdown-caption">horas</span>
        </div>
        <span className="countdown-sep">:</span>
        <div className="countdown-unit">
          <span className="countdown-value">{pad(minutes)}</span>
          <span className="countdown-caption">min</span>
        </div>
        <span className="countdown-sep">:</span>
        <div className="countdown-unit">
          <span className="countdown-value">{pad(seconds)}</span>
          <span className="countdown-caption">seg</span>
        </div>
      </div>
    </div>
  );
}
