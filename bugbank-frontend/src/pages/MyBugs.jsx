// src/pages/MyBugs.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { getUser } from "../lib/auth";
import {
  Panel,
  Button,
  Badge,
  SkeletonCard,
  prettify,
} from "../components/ui";
import { toast } from "react-toastify";

const TABS = [
  { id: "reported", label: "Reported by me" },
  { id: "solved", label: "Solved by me" },
  { id: "pending", label: "Pending rewards" },
];

function getId(obj) {
  return obj?._id || obj?.id || obj?.ID || obj?.Id || null;
}

export default function MyBugs() {
  const me = getUser();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("reported");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);

  // Not logged in → gentle nudge
  if (!me) {
    return (
      <Panel className="p-10 text-center">
        <h1 className="text-2xl font-bold text-slate-100 mb-2">My Bugs</h1>
        <p className="text-slate-300 mb-4">
          Please log in to see bugs you reported, solved, and pending rewards.
        </p>
        <Button as={Link} to="/login">
          Go to Login
        </Button>
      </Panel>
    );
  }

  // ----------------- API helpers -----------------
  function normalize(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.bugs)) return data.bugs;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }

  async function load(tab = activeTab) {
    setLoading(true);
    try {
      let url = "/bugs/my/reported";
      if (tab === "solved") url = "/bugs/my/solved";
      if (tab === "pending") url = "/bugs/my/pending-rewards";

      const { data } = await api.get(url);
      setRows(normalize(data));
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.error ||
        (Array.isArray(e?.response?.data?.errors) &&
          e.response.data.errors.map((x) => x.msg).join(", ")) ||
        e?.message ||
        "Could not load bugs";
      toast.error(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function claimReward(bugId) {
    if (!bugId) return;
    try {
      setClaimingId(bugId);
      const { data } = await api.post(`/bugs/${bugId}/claim-reward`);
      const gained = data?.reward ?? 0;
      toast.success(`Reward claimed! +${gained} XP`);
      // After claiming, this bug should disappear from "pending" list
      await load("pending");
    } catch (e) {
      console.error(e);
      toast.error(
        e?.response?.data?.error ||
          "Could not claim reward. Please try again."
      );
    } finally {
      setClaimingId(null);
    }
  }

  // ----------------- derived -----------------
  const title = useMemo(() => {
    if (activeTab === "reported") return "Bugs reported by you";
    if (activeTab === "solved") return "Bugs you solved";
    if (activeTab === "pending") return "Pending rewards";
    return "My Bugs";
  }, [activeTab]);

  const description = useMemo(() => {
    if (activeTab === "reported")
      return "All bugs you have reported across all statuses.";
    if (activeTab === "solved")
      return "Bugs where your solution was accepted.";
    if (activeTab === "pending")
      return "Resolved bugs where you were the accepted solver and the reward is not claimed yet.";
    return "";
  }, [activeTab]);

  // ----------------- card renderer -----------------
  function renderCard(bug) {
    const id = getId(bug);
    const st = String(bug.status || "").toLowerCase();
    const sevTone = String(bug.severity || "").toLowerCase();

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

    const statusTone =
      st === "open"
        ? "emerald"
        : st === "in_progress"
        ? "amber"
        : st === "resolved"
        ? "indigo"
        : "slate";

    const created = bug.createdAt
      ? new Date(bug.createdAt).toLocaleString()
      : null;

    const reward = bug.rewardXP ?? 0;
    const isResolved = st === "resolved";
    const isClosed = st === "closed";
    const rewardClaimed = !!bug.rewardClaimed;

    const isPendingTab = activeTab === "pending";
    const canClaimHere =
      isPendingTab && isResolved && !rewardClaimed && !isClosed;

    return (
      <Panel
        key={id || bug.title}
        className="p-5 group hover:shadow-2xl transition transform hover:-translate-y-0.5"
      >
        <header className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold leading-snug line-clamp-2">
              {bug.title}
            </h3>
            {created && (
              <p className="text-xs text-slate-400 mt-1">Created: {created}</p>
            )}
          </div>
          <Badge tone={sTone}>{prettify(bug.severity || "Unknown")}</Badge>
        </header>

        <p className="mt-2 text-sm text-slate-300/90 line-clamp-3">
          {bug.description || "No description"}
        </p>

        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <Panel className="px-3 py-2">
            <dt className="text-slate-400">Reward</dt>
            <dd className="font-medium text-white">{reward} XP</dd>
          </Panel>
          <Panel className="px-3 py-2">
            <dt className="text-slate-400">Status</dt>
            <dd className="font-medium">
              <Badge tone={statusTone}>
                {prettify(bug.status || "unknown")}
              </Badge>
            </dd>
          </Panel>
        </dl>

        {/* Extra line depending on tab */}
        <div className="mt-2 text-xs text-slate-400">
          {activeTab === "reported" && (
            <span>Reported by you.</span>
          )}
          {activeTab === "solved" && (
            <span>
              Your solution was accepted{" "}
              {rewardClaimed ? "• reward claimed" : "• reward pending / claimed elsewhere"}
            </span>
          )}
          {activeTab === "pending" && (
            <span>
              Accepted solver: You • Reward not claimed yet.
            </span>
          )}
        </div>

        <footer className="mt-4 flex items-center justify-between gap-2">
          <Button variant="ghost" as={Link} to={`/bugs/${id}`}>
            View details
          </Button>

          {canClaimHere && (
            <Button
              onClick={() => claimReward(id)}
              disabled={claimingId === id}
            >
              {claimingId === id ? "Claiming…" : "Claim Reward"}
            </Button>
          )}
        </footer>
      </Panel>
    );
  }

  // ----------------- render -----------------
  const skeletons = Array.from({ length: 6 });

  return (
    <div>
      {/* Header + tabs */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-fuchsia-400">
          My Bugs
        </h1>
        <p className="text-sm text-slate-300/90 mt-1">{description}</p>

        <div className="mt-4 inline-flex rounded-full bg-slate-900/70 p-1 border border-white/10">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition ${
                activeTab === tab.id
                  ? "bg-fuchsia-500 text-white shadow"
                  : "text-slate-300 hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {skeletons.map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Panel className="p-10 text-center">
          <div className="text-4xl mb-2">🪲</div>
          <h3 className="text-lg font-semibold text-slate-100 mb-1">
            No bugs here yet
          </h3>
          <p className="text-slate-300 text-sm">
            {activeTab === "reported" &&
              "You haven't reported any bugs yet."}
            {activeTab === "solved" &&
              "You haven't solved any bugs yet."}
            {activeTab === "pending" &&
              "You currently have no pending rewards to claim."}
          </p>
          {activeTab === "reported" && (
            <Button as={Link} to="/submit" className="mt-4">
              Report a bug
            </Button>
          )}
          {activeTab === "solved" && (
            <Button as={Link} to="/bugs" className="mt-4">
              Browse open bugs
            </Button>
          )}
          {activeTab === "pending" && (
            <Button as={Link} to="/bugs" className="mt-4">
              Find new bugs to solve
            </Button>
          )}
        </Panel>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rows.map((bug) => renderCard(bug))}
        </div>
      )}
    </div>
  );
}
