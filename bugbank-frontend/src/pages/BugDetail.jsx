import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { toast } from "react-toastify";
import {
  Panel,
  Button,
  Input,
  Badge,
  Spinner,
  prettify,
} from "../components/ui";
import { getUser } from "../lib/auth";

/* ---------- helpers ---------- */

// Extract image URLs from description: Markdown images and any http(s) URL.
function extractImageUrls(text = "") {
  const urls = new Set();
  const mdImg = /!\[[^\]]*\]\((.*?)\)/g;
  let m;
  while ((m = mdImg.exec(text)) !== null) {
    if (m[1]) urls.add(m[1].trim());
  }
  const plain = /(https?:\/\/[^\s<>"')]+)(?=[\s<>"')]|$)/gi;
  while ((m = plain.exec(text)) !== null) {
    urls.add(m[1].trim());
  }
  return Array.from(urls);
}

// Normalize various attachment shapes to a URL string
function pickImageUrl(img) {
  if (!img) return null;
  if (typeof img === "string") return img;
  return (
    img.url ||
    img.secure_url ||
    img.src ||
    img.path ||
    (img.filename ? `/uploads/${img.filename}` : null) ||
    null
  );
}

// safer id getter across shapes
const getId = (obj) => (obj?._id || obj?.id || obj?.ID || obj?.Id || null);

// infer reporter id across possible shapes
const getReporterId = (bug) =>
  getId(bug?.reporter) ||
  getId(bug?.createdBy) ||
  getId(bug?.user) ||
  getId(bug?.postedBy) ||
  bug?.reporterId ||
  bug?.createdById ||
  null;

function InlineImg({ url, alt = "image" }) {
  const [ok, setOk] = useState(true);
  if (!ok || !url) return null;
  // allow relative URLs like /uploads/...
  const src = url.startsWith("http") || url.startsWith("/") ? url : `/${url}`;
  return (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      className="block overflow-hidden rounded-xl ring-1 ring-white/10 hover:ring-fuchsia-400/30"
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-full h-32 object-cover"
        onError={() => setOk(false)}
      />
    </a>
  );
}

/* ---------- page ---------- */

export default function BugDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const me = getUser(); // may be null

  const [bug, setBug] = useState(null);
  const [loading, setLoading] = useState(true);

  const [snippet, setSnippet] = useState("");
  const [prLink, setPrLink] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [claiming, setClaiming] = useState(false);

  // for reject modal
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [rejectTargetId, setRejectTargetId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(`/bugs/${id}`);
      setBug(data || null);
    } catch (err) {
      console.error(err);
      toast.error("Could not load bug");
      setBug(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ---- derived identities + status -----------------------------------------

  const myId = getId(me);
  const reporterId = bug ? getReporterId(bug) : null;
  const isLoggedIn = !!me;
  const myRole = (me?.role || me?.type || "").toString().toLowerCase();

  const status = String(bug?.status || "").toLowerCase();
  const isOpen = status === "open";
  const isResolved = status === "resolved";
  const isClosed = status === "closed";

  const iAmReporter =
    !!reporterId && !!myId && String(reporterId) === String(myId);

  const submissions = Array.isArray(bug?.submissions) ? bug.submissions : [];

  const mySubmission = submissions.find(
    (s) => getId(s?.solver) && myId && String(getId(s.solver)) === String(myId)
  );
  const hasSubmitted = !!mySubmission;

  const acceptedSubmission = submissions.find(
    (s) => String(s.decision || "").toLowerCase() === "accepted"
  );
  const isAcceptedSolver =
    !!acceptedSubmission &&
    myId &&
    getId(acceptedSubmission.solver) &&
    String(getId(acceptedSubmission.solver)) === String(myId);

  const canSubmitSolution =
    isLoggedIn &&
    !iAmReporter && // reporter cannot submit
    !isResolved &&
    !isClosed &&
    !hasSubmitted; // one solution per user

  const canClaimReward =
    isAcceptedSolver && isResolved && !bug?.rewardClaimed;

  // ---- actions -------------------------------------------------------------

  async function submitFix(e) {
    e?.preventDefault?.();

    if (!isLoggedIn) {
      toast.error("Please log in to submit a solution.");
      navigate("/login", { state: { from: `/bugs/${id}` } });
      return;
    }
    if (iAmReporter) {
      toast.error("You cannot submit a solution for your own bug.");
      return;
    }
    if (!canSubmitSolution) {
      toast.error("You cannot submit another solution for this bug.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/bugs/${id}/submit-fix`, { snippet, prLink });
      toast.success("Solution submitted.");
      setSnippet("");
      setPrLink("");
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function acceptSolution(submissionId) {
    if (!iAmReporter) {
      toast.error("Only the reporter can accept a solution.");
      return;
    }
    if (!submissionId) return;

    try {
      setAccepting(true);
      await api.post(`/bugs/${id}/verify`, {
        submissionId,
        notes: "accepted by reporter",
      });
      toast.success("Solution accepted. Bug marked as resolved.");
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Accept failed");
    } finally {
      setAccepting(false);
    }
  }

  async function rejectSolution(submissionId, comment = "") {
    if (!iAmReporter) {
      toast.error("Only the reporter can reject a solution.");
      return;
    }
    if (!submissionId) return;

    try {
      setRejecting(true);
      await api.post(`/bugs/${id}/reject`, { submissionId, comment });
      toast.success("Solution rejected.");
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Reject failed");
    } finally {
      setRejecting(false);
    }
  }

  async function claimReward() {
    if (!canClaimReward) {
      toast.error("You cannot claim this reward.");
      return;
    }
    try {
      setClaiming(true);
      const { data } = await api.post(`/bugs/${id}/claim-reward`);
      const gained = data?.reward ?? bug?.rewardXP ?? 0;
      toast.success(`Reward claimed! +${gained} XP`);
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Claim failed");
    } finally {
      setClaiming(false);
    }
  }

  // ---- tones & derived UI bits ---------------------------------------------

  const sevTone = useMemo(() => {
    const s = String(bug?.severity || "").toLowerCase();
    if (s === "low") return "emerald";
    if (s === "medium") return "amber";
    if (s === "high") return "orange";
    if (s === "critical") return "rose";
    return "slate";
  }, [bug]);

  const statusTone = useMemo(() => {
    const s = String(bug?.status || "").toLowerCase();
    if (s === "open") return "emerald";
    if (s === "in_progress") return "amber";
    if (s === "resolved") return "indigo";
    if (s === "closed") return "slate";
    return "slate";
  }, [bug]);

  // Inline photos from description + robust attachments
  const inlineImageUrls = extractImageUrls(bug?.description || "");
  const attachments = (Array.isArray(bug?.images) ? bug.images : [])
    .map(pickImageUrl)
    .filter(Boolean);

  // ---- loading / not found -------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-slate-300">
        <Spinner /> <span className="text-sm">Loading bug…</span>
      </div>
    );
  }

  if (!bug) {
    return (
      <Panel className="p-12 text-center">
        <div className="text-5xl mb-3">🪲</div>
        <h3 className="text-lg font-semibold text-slate-200">Bug not found</h3>
        <p className="text-slate-300 mt-1">
          This bug may have been removed or the link is incorrect.
        </p>
        <Button as={Link} to="/bugs" className="mt-4" variant="ghost">
          Back to Bugs
        </Button>
      </Panel>
    );
  }

  const acceptedSolverName =
    bug?.acceptedSolver?.name ||
    bug?.acceptedSolver?.email ||
    (acceptedSubmission?.solver &&
      (acceptedSubmission.solver.name || acceptedSubmission.solver.email)) ||
    null;

  // ---- render --------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header & posted-by */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-200">
            {bug.title}
          </h1>
          <div className="text-sm text-slate-200/90">
            Posted by{" "}
            <span className="font-medium text-slate-200">
              {bug?.reporter?.name || bug?.reporter?.email || "Unknown"}
            </span>
            {bug.createdAt && (
              <span className="text-slate-300/80">
                {" "}
                • {new Date(bug.createdAt).toLocaleString()}
              </span>
            )}
          </div>
          {acceptedSolverName && (
            <div className="mt-1 text-xs text-emerald-300">
              ✅ Accepted solution by{" "}
              <span className="font-semibold">{acceptedSolverName}</span>
              {bug.rewardClaimed && " • Reward claimed"}
              {!bug.rewardClaimed && " • Reward pending claim"}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={sevTone}>{prettify(bug.severity || "Unknown")}</Badge>
          <Badge tone={statusTone}>
            {prettify(bug.status || "unknown").replace("_", " ")}
          </Badge>
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-violet-400/10 text-violet-300 ring-1 ring-violet-500/20">
            {bug.rewardXP ?? 0} XP
          </span>
        </div>
      </div>

      {/* Description + images */}
      <Panel className="p-6">
        <h2 className="text-lg font-semibold text-slate-200">Description</h2>
        <p className="mt-2 text-slate-300/90 whitespace-pre-wrap">
          {bug.description || "No description"}
        </p>

        {inlineImageUrls.length > 0 && (
          <div className="mt-4">
            <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
              In-text Images
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {inlineImageUrls.map((url) => (
                <InlineImg key={url} url={url} alt="description image" />
              ))}
            </div>
          </div>
        )}

        {attachments.length > 0 && (
          <div className="mt-6">
            <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
              Attachments
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {attachments.map((url) => (
                <InlineImg key={url} url={url} alt="attachment" />
              ))}
            </div>
          </div>
        )}

        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 text-sm">
          <div className="card px-3 py-2">
            <dt className="text-slate-400">Severity</dt>
            <dd className="font-medium text-slate-200">
              {prettify(bug.severity || "Unknown")}
            </dd>
          </div>
          <div className="card px-3 py-2">
            <dt className="text-slate-400">Status</dt>
            <dd className="font-medium text-slate-200">
              {prettify(bug.status || "unknown").replace("_", " ")}
            </dd>
          </div>
          <div className="card px-3 py-2">
            <dt className="text-slate-400">Reward</dt>
            <dd className="font-medium text-slate-200">
              {bug.rewardXP ?? 0} XP
            </dd>
          </div>
        </dl>

        {/* Footer actions per role */}
        <div className="mt-6 flex flex-wrap gap-3 items-center">
          <Button variant="ghost" as={Link} to="/bugs">
            ← Back to list
          </Button>

          {canClaimReward && (
            <Button onClick={claimReward} disabled={claiming}>
              {claiming && <Spinner />} Claim Reward
            </Button>
          )}

          {isAcceptedSolver && bug.rewardClaimed && (
            <span className="text-xs text-emerald-300">
              ✅ Reward already claimed for this bug.
            </span>
          )}
        </div>
      </Panel>

      {/* Reporter-only: submissions list + accept / reject */}
      {submissions.length > 0 && (
        <Panel className="p-6">
          <h2 className="text-lg font-semibold text-slate-200">Solutions</h2>
          <p className="text-sm text-slate-400 mt-1">
            {iAmReporter
              ? "Review solutions and accept the one that resolves your issue."
              : "These are solutions submitted by other users."}
          </p>
          <div className="mt-3 space-y-3">
            {submissions.map((s) => {
              const sid = getId(s) || s._id || s.id;
              const solverName =
                s.solver?.name || s.solver?.email || "Solver";
              const decision = String(s.decision || "pending").toLowerCase();

              const decisionLabel =
                decision === "accepted"
                  ? "Accepted"
                  : decision === "rejected"
                  ? "Rejected"
                  : "Pending";

              const decisionTone =
                decision === "accepted"
                  ? "emerald"
                  : decision === "rejected"
                  ? "rose"
                  : "slate";

              return (
                <div
                  key={sid}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-slate-200">
                        <span className="font-medium">{solverName}</span>
                        {s.createdAt && (
                          <span className="text-slate-400">
                            {" "}
                            • {new Date(s.createdAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-slate-400 flex items-center gap-2">
                        <Badge tone={decisionTone}>{decisionLabel}</Badge>
                        {s.comment && (
                          <span className="italic">— {s.comment || ""}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                     

                      {/* Only show buttons while pending AND no solution accepted yet */}
                      {iAmReporter &&
                        !isResolved &&
                        !isClosed &&
                        !acceptedSubmission &&
                        decision === "pending" && (
                          <>
                            <button
                              disabled={accepting}
                              onClick={() => acceptSolution(sid)}
                              className="px-3 py-1 rounded-md text-xs font-medium"
                              style={{
                                backgroundColor: "#059669",
                                color: "white",
                                opacity: accepting ? 0.6 : 1,
                              }}
                            >
                              {accepting && <Spinner />} Accept
                            </button>

                            <button
                              onClick={() => {
                                setRejectTargetId(sid);
                                setShowRejectBox(true);
                              }}
                              className="px-3 py-1 rounded-md text-xs font-medium"
                              style={{
                                backgroundColor: "#dc2626",
                                color: "white",
                              }}
                            >
                              Reject
                            </button>
                          </>
                      )}


                    </div>
                  </div>
                  {s.snippet && (
                    <pre className="mt-2 text-xs whitespace-pre-wrap text-slate-200/95 bg-black/30 rounded-xl p-3 border border-white/10">
                      {s.snippet}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {/* Solver-only: submit solution form (non-reporter, one per bug) */}
      {canSubmitSolution && (
        <Panel className="p-6">
          <h2 className="text-lg font-semibold text-slate-200">
            Submit a solution
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Share a code snippet and/or PR link that fixes this bug. You can
            submit one solution per bug.
          </p>

          <form onSubmit={submitFix} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wide text-slate-400">
                PR Link
              </label>
              <Input
                placeholder="https://github.com/your/repo/pull/123"
                value={prLink}
                onChange={(e) => setPrLink(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-slate-400">
                Snippet
              </label>
              <textarea
                className="w-full min-h-40 rounded-xl bg-white/5 text-slate-100 border border-white/10 px-3 py-2.5 outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/30 transition"
                placeholder="// paste the important part of your fix here"
                value={snippet}
                onChange={(e) => setSnippet(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting && <Spinner />} Submit Solution
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setPrLink("");
                  setSnippet("");
                }}
              >
                Reset
              </Button>
            </div>
          </form>
        </Panel>
      )}

      {/* If user already submitted, show a small note */}
      {hasSubmitted && !canSubmitSolution && !iAmReporter && (
        <Panel className="p-4">
          <p className="text-xs text-slate-300">
            You&apos;ve already submitted a solution for this bug. Wait for the
            reporter to review it.
          </p>
        </Panel>
      )}

      {/* Reject Modal */}
      {showRejectBox && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-[90%] max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-slate-200 mb-3">
              Reject Solution
            </h3>
            <p className="text-sm text-slate-400 mb-3">
              Add a short reason for rejecting this solution.
            </p>
            <textarea
              className="w-full rounded-xl bg-white/5 text-slate-100 border border-white/10 px-3 py-2 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/30 transition min-h-[100px]"
              placeholder="Reason for rejection…"
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
            />

            <div className="flex items-center justify-end mt-4 gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowRejectBox(false);
                  setRejectComment("");
                  setRejectTargetId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-rose-600 hover:bg-rose-700 text-white"
                onClick={() => {
                  rejectSolution(rejectTargetId, rejectComment);
                  setShowRejectBox(false);
                  setRejectComment("");
                  setRejectTargetId(null);
                }}
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
