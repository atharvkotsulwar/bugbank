import React, { forwardRef } from "react";

/* ---------------- Panel ---------------- */

export const Panel = forwardRef(function Panel({ className = "", ...rest }, ref) {
  return <div ref={ref} className={`card ${className}`} {...rest} />;
});

/* ---------------- Button ---------------- */

export const Button = forwardRef(function Button(
  { as: Comp = "button", variant = "primary", className = "", disabled = false, children, type, onClick, ...rest },
  ref
) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2";
  const variants = {
    primary:
      "bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white shadow-lg hover:shadow-indigo-900/30 hover:scale-[1.02] active:scale-95 focus:ring-fuchsia-400/50",
    ghost:
      "bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10 focus:ring-indigo-400/40",
    subtle:
      "bg-white/10 text-slate-200 hover:bg-white/15 focus:ring-indigo-400/40",
  };

  const disabledCls = disabled ? "opacity-50 cursor-not-allowed" : "";
  const cls = `${base} ${variants[variant] || variants.primary} ${disabledCls} ${className}`.trim();

  // Default button type to "button" to avoid accidental submits unless specified
  const finalType = Comp === "button" ? (type || "button") : undefined;

  // If rendered as a non-button element and disabled, prevent activation
  const handleClick = (e) => {
    if (disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (typeof onClick === "function") onClick(e);
  };

  const commonProps =
    Comp === "button"
      ? { type: finalType, disabled }
      : {
          role: rest.role || "button",
          "aria-disabled": disabled || undefined,
          tabIndex: disabled ? -1 : rest.tabIndex,
          onClick: handleClick,
        };

  return (
    <Comp ref={ref} className={cls} {...commonProps} {...rest} onClick={Comp === "button" ? onClick : handleClick}>
      {children}
    </Comp>
  );
});

/* ---------------- Input ---------------- */

export const Input = forwardRef(function Input({ className = "", ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={`w-full rounded-xl bg-white/5 text-slate-100 placeholder-slate-400 border border-white/10 px-3 py-2.5 outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/30 transition ${className}`}
      {...rest}
    />
  );
});

/* ---------------- Select ---------------- */

export const Select = forwardRef(function Select({ className = "", children, ...rest }, ref) {
  return (
    <select
      ref={ref}
      className={`w-full rounded-xl bg-white/5 text-slate-100 border border-white/10 px-3 py-2.5 outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/30 transition ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
});

/* ---------------- Badge ---------------- */

export function Badge({ tone = "slate", children }) {
  const map = {
    emerald: "text-emerald-300 bg-emerald-400/10 ring-1 ring-emerald-500/20",
    amber: "text-amber-300 bg-amber-400/10 ring-1 ring-amber-500/20",
    orange: "text-orange-300 bg-orange-400/10 ring-1 ring-orange-500/20",
    rose: "text-rose-300 bg-rose-400/10 ring-1 ring-rose-500/20",
    indigo: "text-indigo-300 bg-indigo-400/10 ring-1 ring-indigo-500/20",
    slate: "text-slate-300 bg-white/10 ring-1 ring-white/15",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${map[tone] || map.slate}`}>
      {children}
    </span>
  );
}

/* ---------------- SkeletonCard ---------------- */

export function SkeletonCard() {
  return (
    <Panel className="p-5 animate-pulse">
      <div className="h-4 w-2/3 bg-white/10 rounded" />
      <div className="mt-3 h-3 w-full bg-white/10 rounded" />
      <div className="mt-2 h-3 w-5/6 bg-white/10 rounded" />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="h-10 bg-white/10 rounded-xl" />
        <div className="h-10 bg-white/10 rounded-xl" />
      </div>
      <div className="mt-4 h-9 bg-white/10 rounded-xl" />
    </Panel>
  );
}

/* ---------------- Spinner ---------------- */

export function Spinner({ label = "Loading" }) {
  return (
    <span
      className="inline-flex items-center gap-2"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span
        aria-hidden="true"
        className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent"
      />
    </span>
  );
}

/* ---------------- prettify ---------------- */

export function prettify(str) {
  return String(str || "")
    .split("_")
    .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
    .join(" ");
}
