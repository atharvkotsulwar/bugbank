import React, { useEffect, useMemo, useState } from "react";
import api from "../lib/api";
import { Link } from "react-router-dom";
import { getUser } from "../lib/auth";
import {
  Panel,
  Button,
  Input,
  Select,
  Badge,
  SkeletonCard,
  prettify,
} from "../components/ui";
import { toast } from "react-toastify";

export default function Bugs() {
  const me = getUser(); // read once; navbar keeps storage in sync
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sev, setSev] = useState("all");
  const [status, setStatus] = useState("all");
  const [qDebounced, setQDebounced] = useState("");

  // --- helpers --------------------------------------------------------------
  const getId = (obj) => (obj?._id || obj?.id || obj?.ID || obj?.Id || null);

  const getReporterId = (b) => {
    // Support multiple possible shapes coming from backend
    return (
      getId(b?.reporter) ||
      getId(b?.createdBy) ||
      getId(b?.user) ||
      getId(b?.postedBy) ||
      b?.reporterId ||
      b?.createdById ||
      null
    );
  };

  const myId = getId(me);
  const isLoggedIn = !!me;

  // --- debounce search ------------------------------------------------------
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [q]);

  // --- data load ------------------------------------------------------------
  function normalize(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.bugs)) return data.bugs;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/bugs");
      setBugs(normalize(data));
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.error ||
        (Array.isArray(e?.response?.data?.errors) &&
          e.response.data.errors.map((x) => x.msg).join(", ")) ||
        e?.message ||
        "Could not load bugs";
      toast.error(msg);
      setBugs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // --- derived view state ---------------------------------------------------
  const filtered = useMemo(() => {
    return bugs
      .filter((b) =>
        sev === "all"
          ? true
          : String(b.severity || "").toLowerCase() === sev
      )
      .filter((b) =>
        status === "all"
          ? true
          : String(b.status || "").toLowerCase() === status
      )
      .filter((b) => {
        if (!qDebounced) return true;
        const hay = `${b.title ?? ""} ${b.description ?? ""}`.toLowerCase();
        return hay.includes(qDebounced);
      });
  }, [bugs, qDebounced, sev, status]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-fuchsia-400">
            Bugs
          </h1>
          <p className="text-sm text-slate-300/90 mt-1">
            Public bug board — showing <span className="font-semibold">open</span> and{" "}
            <span className="font-semibold">in progress</span> bugs only.
          </p>
        </div>
        <Button as={Link} to="/submit">
          ➕ Report Bug
        </Button>
      </div>

      {/* Link to My Bugs */}
      {isLoggedIn && (
        <Panel className="p-3 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-slate-300/90">
            Looking for bugs <span className="font-semibold">reported</span> or{" "}
            <span className="font-semibold">solved</span> by you, or{" "}
            <span className="font-semibold">pending rewards</span>?
          </div>
          <Button as={Link} to="/my-bugs" variant="ghost" className="whitespace-nowrap">
            Go to My Bugs →
          </Button>
        </Panel>
      )}

      {/* Filters */}
      <Panel className="p-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-400">
              Search
            </label>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title or description…"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-400">
              Severity
            </label>
            <Select value={sev} onChange={(e) => setSev(e.target.value)}>
              {["all", "low", "medium", "high", "critical"].map((v) => (
                <option key={v} value={v} className="bg-slate-900">
                  {v === "all" ? "All severities" : prettify(v)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-400">
              Status
            </label>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {/* Main page is only for open + in_progress; keep filter aligned */}
              {["all", "open", "in_progress"].map((v) => (
                <option key={v} value={v} className="bg-slate-900">
                  {v === "all" ? "All status" : prettify(v)}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setQ("");
                setSev("all");
                setStatus("all");
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </Panel>

      {/* Content */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Panel className="p-12 text-center">
          <div className="text-5xl mb-3">🪲</div>
          <h3 className="text-lg font-semibold">No bugs found</h3>
          <p className="text-slate-300 mt-1">
            {bugs.length === 0
              ? "Be the first to report a bug."
              : "Try changing filters or search."}
          </p>
          <Button as={Link} to="/submit" className="mt-4">
            Report bug
          </Button>
        </Panel>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((b) => {
            const id = getId(b) || b._id || b.id;
            const st = String(b.status || "").toLowerCase();
            const sevTone = String(b.severity || "").toLowerCase();

            const sTone =
              sevTone === "low"
                ? "emerald"
                : sevTone === "medium"
                ? "amber"
                : sevTone === "high"
                ? "orange"
                : sevTone === "critical"
                ? "rose"
                : "slate";

            const tone =
              st === "open"
                ? "emerald"
                : st === "in_progress"
                ? "amber"
                : "slate";

            // reporter check (may be useful for future UI)
            const reporterId = getReporterId(b);
            const isReporter =
              reporterId && myId && String(reporterId) === String(myId);

            return (
              <Panel
                key={id || b.title}
                className="p-5 group hover:shadow-2xl transition transform hover:-translate-y-0.5"
              >
                <header className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold leading-snug line-clamp-2">
                    {b.title}
                  </h3>
                  <Badge tone={sTone}>
                    {prettify(b.severity || "Unknown")}
                  </Badge>
                </header>

                <p className="mt-2 text-sm text-slate-300/90 line-clamp-3">
                  {b.description || "No description"}
                </p>

                <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <Panel className="px-3 py-2">
                    <dt className="text-slate-400">Reward</dt>
                    <dd className="font-medium text-white">
                      {b.rewardXP ?? 0} XP
                    </dd>
                  </Panel>
                  <Panel className="px-3 py-2">
                    <dt className="text-slate-400">Status</dt>
                    <dd className="font-medium">
                      <Badge tone={tone}>{prettify(st || "unknown")}</Badge>
                    </dd>
                  </Panel>
                </dl>

                <footer className="mt-4 flex items-center justify-between">
                  <Button variant="ghost" as={Link} to={`/bugs/${id}`}>
                    View
                  </Button>

                  {/* Main page is read-oriented; solving / claiming handled on BugDetail */}
                  <span className="text-xs text-slate-400">
                    {isReporter ? "Reported by you" : ""}
                  </span>
                </footer>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
