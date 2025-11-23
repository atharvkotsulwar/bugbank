import React, { useEffect, useRef, useState } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { getUser, logout, onAuthChange } from "../lib/auth";

function useAuthUser() {
  const [user, setUser] = useState(() => getUser());

  useEffect(() => {
    // cross-tab updates via storage
    const storageSync = () => setUser(getUser());
    window.addEventListener("storage", storageSync);

    // same-tab updates via our auth event helper (if available)
    const off = typeof onAuthChange === "function" ? onAuthChange(setUser) : null;

    // also refresh on window focus (covers token refreshes)
    const onFocus = () => setUser(getUser());
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("storage", storageSync);
      window.removeEventListener("focus", onFocus);
      if (typeof off === "function") off();
    };
  }, []);

  return [user, setUser];
}

export default function Navbar() {
  const [me, setMe] = useAuthUser();
  const [open, setOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();
  const userMenuRef = useRef(null);

  // Close menus on route change
  useEffect(() => {
    setOpen(false);
    setUserOpen(false);
  }, [loc.pathname]);

  // Click outside to close user menu
  useEffect(() => {
    function onDocClick(e) {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target)) setUserOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Close menus on Esc
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        setOpen(false);
        setUserOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const linkClass = ({ isActive }) =>
    `nav-link ${isActive ? "nav-link-active" : ""} px-3 py-2 rounded-lg`;

  const primaryLinks = (
    <>
      <NavLink to="/bugs" className={linkClass}>
        Bugs
      </NavLink>
      <NavLink to="/submit" className={linkClass}>
        Submit Bug
      </NavLink>
      <NavLink to="/leaderboard" className={linkClass}>
        Leaderboard
      </NavLink>
      {me?.role === "admin" && (
        <NavLink to="/admin" className={linkClass}>
          Admin
        </NavLink>
      )}
    </>
  );

  function handleLogout() {
    logout();
    setMe(null);
    nav("/login");
  }

  const initials = (me?.name || me?.email || "U").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-50">
      <div className="backdrop-blur bg-white/5 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="h-16 flex items-center justify-between">
            {/* Brand */}
            <Link to="/" className="flex items-center gap-2 font-semibold text-white">
              <div className="h-8 w-8 grid place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
                B
              </div>
              <span className="tracking-tight">BugBank</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">{primaryLinks}</div>

            {/* Right actions */}
            <div className="hidden md:flex items-center gap-2">
              {!me ? (
                <>
                  <Link to="/login" className="btn">
                    Login
                  </Link>
                  <Link to="/signup" className="btn btn-primary">
                    Sign up
                  </Link>
                </>
              ) : (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserOpen((v) => !v)}
                    className="inline-flex items-center gap-2 px-2 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
                    aria-haspopup="menu"
                    aria-expanded={userOpen}
                    aria-label="User menu"
                  >
                    <span className="h-7 w-7 grid place-items-center rounded-lg bg-white/10 ring-1 ring-white/15 text-xs font-semibold">
                      {initials}
                    </span>
                    <span className="text-sm text-slate-200">{me.name ?? me.email}</span>
                    <svg className="h-4 w-4 opacity-70" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
                    </svg>
                  </button>

                  {userOpen && (
                    <div role="menu" className="absolute right-0 mt-2 w-56 card overflow-hidden p-1">
                      {/* Only Profile & Logout */}
                      <Link
                        to="/profile"
                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 text-slate-200"
                        role="menuitem"
                        onClick={() => setUserOpen(false)}
                      >
                        <span className="text-sm">Profile</span>
                        <span className="badge">View</span>
                      </Link>
                      <div className="h-px my-1 bg-white/10" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-slate-200"
                        role="menuitem"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle navigation"
              aria-expanded={open}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </nav>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-white/10">
            <div className="px-4 py-3 flex flex-col gap-1">
              {primaryLinks}
              {!me ? (
                <div className="flex items-center gap-2 pt-2">
                  <Link to="/login" className="btn w-full" onClick={() => setOpen(false)}>
                    Login
                  </Link>
                  <Link to="/signup" className="btn btn-primary w-full" onClick={() => setOpen(false)}>
                    Sign up
                  </Link>
                </div>
              ) : (
                <>
                  <Link to="/profile" className="nav-link px-3 py-2 rounded-lg" onClick={() => setOpen(false)}>
                    Profile
                  </Link>
                  <button onClick={handleLogout} className="btn mt-1">
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
