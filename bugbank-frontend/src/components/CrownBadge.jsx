// src/components/CrownBadge.jsx
import React from "react";

export default function CrownBadge({ index }) {
  const ranks = [
    {
      emoji: "🥇",
      cls: "bg-yellow-500/20 border-yellow-500 text-yellow-700 dark:text-yellow-400",
      label: "1st place",
    },
    {
      emoji: "🥈",
      cls: "bg-slate-400/20 border-slate-400 text-slate-600 dark:text-slate-300",
      label: "2nd place",
    },
    {
      emoji: "🥉",
      cls: "bg-amber-700/20 border-amber-700 text-amber-800 dark:text-amber-300",
      label: "3rd place",
    },
  ];

  const item = Number.isInteger(index) ? ranks[index] : null;
  if (!item) return null;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border font-medium px-2 py-0.5 text-xs ${item.cls}`}
      title={`Rank #${index + 1}`}
      aria-label={item.label}
    >
      {item.emoji}
    </span>
  );
}
