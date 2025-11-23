// src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { getUser } from "../lib/auth";
import { Panel, Badge } from "../components/ui";

export default function Profile() {
  // start with whatever is in localStorage
  const [me, setMe] = useState(() => getUser());

  // fetch fresh user from backend (has latest xp / solvedCount)
  useEffect(() => {
    let alive = true;

    async function loadMe() {
      try {
        // 🔁 if your endpoint is different (e.g. "/users/me"),
        // just change this URL:
        const { data } = await api.get("/auth/me");
        if (alive && data) {
          setMe(data);
        }
      } catch (err) {
        console.error("Failed to load current user", err);
      }
    }

    loadMe();
    return () => {
      alive = false;
    };
  }, []);

  if (!me) {
    return (
      <Panel className="p-12 text-center">
        <h1 className="text-2xl font-bold text-white">Not signed in</h1>
        <p className="text-slate-200 mt-2">
          Please log in to view your profile.
        </p>
      </Panel>
    );
  }

  // --- Safe normalization ----------------------------------------------------
  const initial = String(me.name || me.email || "U")
    .slice(0, 1)
    .toUpperCase();
  const displayName = me.name || "Unnamed";
  const email = me.email || "—";
  const role = (me.role || me.type || "user").toString();

  // backend stores: xp, solvedCount
  const solved =
    me.solvedCount ??
    me.solved ??
    me.count ??
    0;

  const xp =
    me.xp ??
    me.totalXP ??
    me.points ??
    0;

  const joined = me.createdAt
    ? new Date(me.createdAt).toLocaleDateString()
    : "—";

  const badges = Array.isArray(me.badges) ? me.badges : [];
  const github = me.github || "";

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Your Profile
        </h1>
        <p className="text-sm text-slate-200 mt-1">
          Personal info and bug-bounty stats.
        </p>
      </div>

      <Panel className="p-6">
        {/* Header with avatar, name, email, role */}
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 grid place-items-center rounded-xl bg-white/10 ring-1 ring-white/20 text-white font-semibold">
            {initial}
          </div>
          <div>
            <div className="text-lg font-semibold text-white">
              {displayName}
            </div>
            <div className="text-slate-200">{email}</div>
            {github && (
              <a
                href={github}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-sky-300 underline mt-1 inline-block"
              >
                View GitHub
              </a>
            )}
          </div>
          <div className="ml-auto">
            <Badge tone="indigo">{role}</Badge>
          </div>
        </div>

        {/* Stats grid */}
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 text-sm">
          <div className="card px-3 py-2">
            <dt className="text-slate-300">Solved</dt>
            <dd className="font-medium text-white">{solved}</dd>
          </div>
          <div className="card px-3 py-2">
            <dt className="text-slate-300">Total XP</dt>
            <dd className="font-medium text-white">{xp}</dd>
          </div>
          <div className="card px-3 py-2">
            <dt className="text-slate-300">Joined</dt>
            <dd className="font-medium text-white">{joined}</dd>
          </div>
          <div className="card px-3 py-2">
            <dt className="text-slate-300">Status</dt>
            <dd className="font-medium text-white">Active</dd>
          </div>
        </dl>

        {/* Badges row (if any) */}
        {badges.length > 0 && (
          <div className="mt-6">
            <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
              Badges
            </div>
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <Badge key={b} tone="emerald">
                  {b}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
