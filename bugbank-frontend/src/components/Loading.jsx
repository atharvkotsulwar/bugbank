// src/components/Loading.jsx
import React from "react";

export default function Loading({ label = "Loading..." }) {
  return (
    <div
      className="flex items-center gap-3 text-slate-600 dark:text-slate-300"
      role="status"
      aria-live="polite"
    >
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400/40 border-t-transparent"
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}
