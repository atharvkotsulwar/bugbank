import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Panel, Button, Input } from "../components/ui";
import { login } from "../lib/auth";
import { toast } from "react-toastify";

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  // Optional redirect handling: ?redirect=/some/path OR location.state.from
  const redirect = useMemo(() => {
    const params = new URLSearchParams(loc.search);
    const q = params.get("redirect");
    const fromState = loc.state && typeof loc.state === "object" ? loc.state.from : null;
    return q || fromState || "/bugs";
  }, [loc.search, loc.state]);

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return;

    const email = form.email.trim();
    const password = form.password;

    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      setLoading(true);
      await login(email, password); // stores token+user
      toast.success("Welcome back!");
      nav(redirect, { replace: true });
    } catch (err) {
      // Normalize common error shapes
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.errors?.[0]?.msg ||
        err?.message ||
        "Login failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Panel className="p-6">
        <h1 className="text-2xl font-bold mb-1 text-slate-200">Welcome back</h1>
        <p className="text-slate-300 mb-5">Sign in to continue.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-400">Email</label>
            <Input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-400">Password</label>
            <Input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Your password"
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Login"}
          </Button>
        </form>

        <p className="text-sm text-slate-400 mt-4">
          No account? <Link className="text-slate-200 underline" to="/signup">Sign up</Link>
        </p>
      </Panel>
    </div>
  );
}
