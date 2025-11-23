// src/lib/auth.js
import api from "./api";

const LS_KEY = "bugbank_user";

// ---- internal state/cache ----
let _authCache = null;

/** Safe JSON.parse */
function safeParse(str, fallback = {}) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/** Read auth from localStorage into cache */
function readAuth() {
  if (_authCache) return _authCache;
  const raw = typeof localStorage !== "undefined" ? localStorage.getItem(LS_KEY) : null;
  const parsed = safeParse(raw, {});
  // Normalize shape
  const token = parsed?.token ?? null;
  const user = parsed?.user ?? null;
  _authCache = { token, user };
  return _authCache;
}

/** Write cache + localStorage and notify listeners */
function writeAuth(next) {
  _authCache = { token: next?.token ?? null, user: next?.user ?? null };
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(LS_KEY, JSON.stringify(_authCache));
    // Fire a custom event for same-tab listeners
    try {
      window.dispatchEvent(new CustomEvent("auth:change", { detail: _authCache }));
    } catch {}
  }
}

// ---- public API (backward compatible) ----

export function saveAuth({ token, user }) {
  // Defensive: require both fields
  if (!token || !user) {
    throw new Error("Invalid auth payload: expected { token, user }");
  }
  writeAuth({ token, user });
}

export function getAuth() {
  return readAuth();
}

export function getUser() {
  return readAuth().user || null;
}

export function getToken() {
  return readAuth().token || null;
}

export function logout() {
  _authCache = { token: null, user: null };
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(LS_KEY);
    try {
      window.dispatchEvent(new CustomEvent("auth:change", { detail: _authCache }));
    } catch {}
  }
}

/** Optional helper for role checks (non-breaking addition) */
export function isAdmin() {
  const role = (getUser()?.role || getUser()?.type || "").toString().toLowerCase();
  return role === "admin";
}

/** Username suggestion (kept same behavior, slightly hardened) */
function suggestUsername(name, email) {
  const baseRaw = (email?.split("@")[0] || name || "user").toLowerCase();
  const base = baseRaw.replace(/[^a-z0-9_]/g, "").slice(0, 24) || "user";
  const rand = Math.random().toString(36).slice(2, 6);
  return `${base}${rand}`;
}

/** Sign up and persist auth */
export async function signup(name, email, password, role = "solver") {
  const username = suggestUsername(name, email);
  const { data } = await api.post("/auth/signup", { name, email, password, role, username });

  // Accept both { token, user } or { data: { token, user } } shapes if backend changes
  const payload = data?.token && data?.user ? data : data?.data;
  if (!payload?.token || !payload?.user) {
    throw new Error("Signup succeeded but missing auth payload.");
  }
  saveAuth(payload);
  return payload;
}

/** Login and persist auth */
export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  const payload = data?.token && data?.user ? data : data?.data;
  if (!payload?.token || !payload?.user) {
    throw new Error("Login succeeded but missing auth payload.");
  }
  saveAuth(payload);
  return payload;
}

/**
 * Subscribe to auth changes across tabs & this tab:
 * const unsubscribe = onAuthChange((auth) => { ... });
 */
export function onAuthChange(handler) {
  if (typeof window === "undefined") return () => {};
  // Cross-tab: storage event
  const storageListener = (e) => {
    if (e.key === LS_KEY) {
      _authCache = null; // invalidate cache and re-read
      handler(readAuth());
    }
  };
  // Same-tab: custom event fired by writeAuth/logout
  const customListener = (e) => {
    handler(e.detail || readAuth());
  };
  window.addEventListener("storage", storageListener);
  window.addEventListener("auth:change", customListener);
  return () => {
    window.removeEventListener("storage", storageListener);
    window.removeEventListener("auth:change", customListener);
  };
}

/** Optional helper to update stored user profile (keeps token) */
export function updateStoredUser(partial) {
  const current = readAuth();
  const nextUser = { ...(current.user || {}), ...(partial || {}) };
  writeAuth({ token: current.token, user: nextUser });
  return nextUser;
}
