// src/pages/Leaderboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../lib/api";
import { Panel } from "../components/ui";
import { toast } from "react-toastify";

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef(null);

  function normalize(payload) {
    // Accept: [] | {items} | {rows} | {list} | {data:{...}} | {data:[]}
    const p = payload && typeof payload === "object" && "data" in payload ? payload.data : payload;
    const arr = Array.isArray(p)
      ? p
      : Array.isArray(p?.items)
      ? p.items
      : Array.isArray(p?.rows)
      ? p.rows
      : Array.isArray(p?.list)
      ? p.list
      : Array.isArray(p?.data)
      ? p.data
      : [];

    // Normalize fields and coerce types
    return arr.map((r, idx) => {
      const id = r.id ?? r._id ?? r.userId ?? idx;
      const name = r.name ?? r.user ?? r.username ?? "Anonymous";
      const solved = Number(r.solved ?? r.count ?? r.solvedCount ?? 0) || 0;
      const xp = Number(r.xp ?? r.totalXP ?? r.total_xp ?? r.points ?? 0) || 0;
      return { id, name, solved, xp };
    });
  }

  async function load() {
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch {}
    }
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    try {
      const { data } = await api.get("/leaderboard", { signal: ac.signal });
      setRows(normalize(data));
    } catch (e) {
      if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
      console.error(e);
      toast.error(e?.response?.data?.error || "Failed to load leaderboard");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    return () => {
      if (abortRef.current) {
        try { abortRef.current.abort(); } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sort client-side in case backend isn't sorted
  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      if (b.xp !== a.xp) return b.xp - a.xp;
      return b.solved - a.solved;
    });
  }, [rows]);

  // Simple skeleton rows while loading (keeps UI layout)
  const skeletons = Array.from({ length: 8 });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-fuchsia-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
          Leaderboard
        </h1>
        <p className="text-sm text-slate-300/90">Top solvers by total XP.</p>
      </div>

      <Panel className="overflow-hidden">
        <div className="min-w-full overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5 border-b border-white/10">
              <tr className="text-slate-300">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Solved</th>
                <th className="px-4 py-3 text-left">XP</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? skeletons.map((_, i) => (
                    <tr key={`sk-${i}`} className="border-b border-white/5">
                      <td className="px-4 py-3">
                        <div className="h-4 w-6 bg-white/10 rounded animate-pulse" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-36 bg-white/10 rounded animate-pulse" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-10 bg-white/10 rounded animate-pulse" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-10 bg-white/10 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                : sorted.map((r, i) => (
                    <tr key={r.id ?? i} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3 text-slate-200">{i + 1}</td>
                      <td className="px-4 py-3 text-slate-200">{r.name}</td>
                      <td className="px-4 py-3 text-slate-200">{r.solved}</td>
                      <td className="px-4 py-3 text-slate-200">{r.xp}</td>
                    </tr>
                  ))}

              {!loading && sorted.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-4 py-6 text-center text-slate-400">No entries yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
