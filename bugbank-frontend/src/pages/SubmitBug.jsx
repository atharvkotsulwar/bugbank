import React, { useState, useRef } from "react";
import api from "../lib/api";
import { useNavigate, Link } from "react-router-dom";
import { Panel, Button, Input, Select } from "../components/ui";
import { toast } from "react-toastify";
import { getUser } from "../lib/auth";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp", "image/gif"];

// 🔢 Auto reward per severity
const REWARD_BY_SEVERITY = {
  low: 10,
  medium: 20,
  high: 30,
  critical: 40,
};

export default function SubmitBug() {
  const me = getUser();
  const nav = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "low",
    rewardXP: REWARD_BY_SEVERITY.low,
  });

  // multiple images
  const [files, setFiles] = useState([]);
  const inputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);

  function onPickFiles(e) {
    const list = Array.from(e.target.files || []);
    if (!list.length) {
      setFiles([]);
      return;
    }

    const valid = [];
    for (const f of list) {
      if (!ALLOWED_MIME.includes(f.type)) {
        toast.error(`Unsupported file type: ${f.name}`);
        continue;
      }
      if (f.size > MAX_IMAGE_BYTES) {
        toast.error(`Image too large (max 5MB): ${f.name}`);
        continue;
      }
      valid.push(f);
    }

    if (!valid.length) {
      if (inputRef.current) inputRef.current.value = "";
      setFiles([]);
      return;
    }

    setFiles(valid);
  }

  function safeReward(n) {
    const num = Number(n);
    if (!Number.isFinite(num) || num < 0) return 0;
    return Math.min(Math.floor(num), 1_000_000);
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    const title = form.title.trim();
    const description = form.description.trim();
    const severity = String(form.severity || "low").toLowerCase();
    const rewardXP = safeReward(form.rewardXP);

    if (title.length < 3) {
      toast.error("Title must be at least 3 characters.");
      return;
    }

    if (description.length < 10) {
      toast.error("Description must be at least 10 characters.");
      return;
    }

    if (!["low", "medium", "high", "critical"].includes(severity)) {
      toast.error("Please choose a valid severity.");
      return;
    }

    try {
      setSubmitting(true);

      const fd = new FormData();
      fd.append("title", title);
      fd.append("description", description);
      fd.append("severity", severity);
      fd.append("rewardXP", String(rewardXP));

      if (files && files.length) {
        for (const f of files) {
          fd.append("images", f);
        }
      }

      const res = await api.post("/bugs", fd);
      toast.success("Bug submitted successfully.");
      nav(`/bugs/${res.data._id}`);
    } catch (err) {
      if (err?.response?.status === 401) {
        toast.error("Please log in to submit a bug.");
        nav("/login", { state: { from: "/submit" } });
      } else {
        toast.error("Error submitting bug.");
        console.error(err);
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Guard: logged-out users
  if (!me) {
    return (
      <Panel className="p-12 text-center">
        <h1 className="text-2xl font-bold">Please log in</h1>
        <p className="text-slate-300 mt-2">
          You need an account to submit a bug.
        </p>
        <div className="mt-4">
          <Link className="underline" to="/login">
            Go to Login
          </Link>
        </div>
      </Panel>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-fuchsia-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
          Submit a Bug
        </h1>
        <p className="text-sm text-slate-300/90">
          Describe the issue. More detail = faster fixes.
        </p>
      </div>

      <Panel className="p-6">
        <form
          onSubmit={onSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          <div className="md:col-span-2">
            <label className="block text-xs uppercase tracking-wide text-slate-400">
              Title
            </label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Short, clear summary"
              minLength={3}
              required
              disabled={submitting}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs uppercase tracking-wide text-slate-400">
              Description
            </label>
            <textarea
              className="w-full h-40 rounded-xl bg-white/5 text-slate-100 border border-white/10 px-3 py-2.5 outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/30 transition"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Steps to reproduce, expected vs actual, screenshots/links…"
              minLength={10}
              required
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-400">
              Severity
            </label>
            <Select
              value={form.severity}
              onChange={(e) => {
                const severity = e.target.value;
                const autoReward = REWARD_BY_SEVERITY[severity] ?? 10;
                setForm((prev) => ({
                  ...prev,
                  severity,
                  rewardXP: autoReward,
                }));
              }}
              disabled={submitting}
            >
              {["low", "medium", "high", "critical"].map((v) => (
                <option key={v} value={v} className="bg-slate-900">
                  {v}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-400">
              Reward (XP)
            </label>
            <Input
              type="number"
              min={0}
              value={form.rewardXP}
              readOnly
              disabled
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Auto-set by severity: low 10, medium 20, high 30, critical 40.
            </p>
          </div>

          {/* Attach screenshots */}
          <div className="md:col-span-2">
            <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">
              Attach screenshots
            </label>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={onPickFiles}
              className="hidden"
            />

            <Button
              type="button"
              variant="ghost"
              onClick={() => inputRef.current?.click()}
              disabled={submitting}
            >
              📎 Attach screenshot
            </Button>

            {files.length > 0 && (
              <div className="mt-1 text-xs text-slate-400 truncate">
                Selected: {files.length} file{files.length > 1 ? "s" : ""} (
                {Math.ceil(
                  files.reduce((sum, f) => sum + f.size, 0) / 1024
                )}{" "}
                KB)
              </div>
            )}
          </div>

          <div className="md:col-span-2 flex gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Bug"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setForm({
                  title: "",
                  description: "",
                  severity: "low",
                  rewardXP: REWARD_BY_SEVERITY.low,
                });
                setFiles([]);
                if (inputRef.current) inputRef.current.value = "";
              }}
              disabled={submitting}
            >
              Reset
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
