// src/components/XPBar.jsx
import React, { useEffect, useId, useMemo, useState } from "react";

export default function XPBar({ xp = 0, showLabel = true, compact = false }) {
  const xpNum = Number.isFinite(Number(xp)) ? Number(xp) : 0;
  const LEVEL_SIZE = 100;

  // Ensure positive remainder even for negative xp
  const remainder = mod(xpNum, LEVEL_SIZE);
  const level = Math.max(0, Math.floor(xpNum / LEVEL_SIZE));
  const progress = clamp(remainder, 0, 100);

  const [anim, setAnim] = useState(0);

  // Respect prefers-reduced-motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setAnim(progress);
      return;
    }
    const t = setTimeout(() => setAnim(progress), 40); // small mount-in delay
    return () => clearTimeout(t);
  }, [progress, prefersReducedMotion]);

  const heightCls = compact ? "h-2" : "h-3";
  const labelId = useId();
  const barId = useId();

  return (
    <div className="w-full" aria-labelledby={labelId} aria-describedby={barId}>
      {showLabel && (
        <div id={labelId} className="flex items-center justify-between text-xs mb-1 text-slate-600 dark:text-slate-300">
          <div>Lvl {level}</div>
          <div>{Intl.NumberFormat().format(xpNum)} XP</div>
        </div>
      )}

      <div
        id={barId}
        className={`w-full ${heightCls} rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(anim)}
        aria-label="Experience progress"
      >
        <div
          className={`${heightCls} rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-500 transition-all duration-700`}
          style={{ width: `${clamp(anim, 0, 100)}%` }}
        />
      </div>

      {!compact && (
        <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          {LEVEL_SIZE - progress} XP to next level
        </div>
      )}
    </div>
  );
}

/* ---------- utils ---------- */
function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}
function mod(n, m) {
  // positive modulo; e.g., -20 % 100 => 80
  const r = n % m;
  return r < 0 ? r + m : r;
}
