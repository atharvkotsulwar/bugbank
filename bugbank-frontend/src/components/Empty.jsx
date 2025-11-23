// src/components/Empty.jsx
import React from "react";

export default function Empty({ 
  title = "Nothing here", 
  hint = "", 
  icon = "🪲" 
}) {
  const safeHint = hint?.trim();

  return (
    <div
      role="status"
      className="rounded-3xl border border-dashed border-slate-300 dark:border-white/10 
                 p-8 sm:p-12 text-center bg-white/60 dark:bg-white/5 backdrop-blur"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-lg font-semibold">{title}</div>
      {safeHint && (
        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{safeHint}</div>
      )}
    </div>
  );
}
