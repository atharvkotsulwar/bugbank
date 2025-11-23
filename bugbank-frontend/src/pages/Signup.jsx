import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Panel, Button, Input } from "../components/ui";
import { signup } from "../lib/auth";       // stores token+user
import { toast } from "react-toastify";

export default function Signup() {
  const nav = useNavigate();
  const loc = useLocation();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  // Optional redirect handling: ?redirect=/some/path
  const redirect = useMemo(() => {
    const params = new URLSearchParams(loc.search);
    return params.get("redirect") || "/bugs";
  }, [loc.search]);

  function validate() {
    const name = form.name.trim();
    const email = form.email.trim();
    const pass = form.password;

    if (!name) { toast.error("Please enter your name"); return false; }
    if (!email) { toast.error("Please enter your email"); return false; }
    // simple email pattern; backend will still validate strictly
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) { toast.error("Please enter a valid email"); return false; }
    if (!pass || pass.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    return { name, email, pass };
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return;

    const v = validate();
    if (!v) return;

    try {
      setLoading(true);
      // Role defaults to 'solver' in helper/backend; pass a role if you later expose it.
      await signup(v.name, v.email, v.pass);
      toast.success("Account created!");
      nav(redirect, { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.errors?.[0]?.msg ||
        err?.message ||
        "Sign up failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Panel className="p-6">
        <h1 className="text-2xl font-bold mb-1">Create account</h1>
        <p className="text-slate-300 mb-5">Join the BugBank arena.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-400">Name</label>
            <Input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
              autoComplete="name"
              required
              disabled={loading}
            />
          </div>
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
              placeholder="At least 6 characters"
              autoComplete="new-password"
              required
              disabled={loading}
            />
          </div>

        {/* If you want a role selector later, keep UI identical and just add a Select here.
            The helper already accepts role as a 4th arg. */}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating…" : "Sign up"}
          </Button>
        </form>

        <p className="text-sm text-slate-400 mt-4">
          Already have an account? <Link className="text-slate-200 underline" to="/login">Login</Link>
        </p>
      </Panel>
    </div>
  );
}
