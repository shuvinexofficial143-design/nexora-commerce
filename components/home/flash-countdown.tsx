"use client";

import { useEffect, useState } from "react";

const SALE_WINDOW_MS = 9 * 60 * 60 * 1000;

function split(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export function FlashCountdown() {
  const [remaining, setRemaining] = useState(SALE_WINDOW_MS);

  useEffect(() => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = (Date.now() - started) % SALE_WINDOW_MS;
      setRemaining(SALE_WINDOW_MS - elapsed);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const time = split(remaining);
  const cells = [
    ["HRS", time.hours],
    ["MIN", time.minutes],
    ["SEC", time.seconds],
  ] as const;

  return (
    <div className="flex items-center gap-2" aria-label="Flash deal countdown">
      {cells.map(([label, value]) => (
        <div key={label} className="min-w-14 rounded-2xl bg-black px-3 py-2 text-center text-white">
          <div className="text-lg font-black tabular-nums">{String(value).padStart(2, "0")}</div>
          <div className="text-[8px] font-black tracking-[0.18em] text-white/45">{label}</div>
        </div>
      ))}
    </div>
  );
}
