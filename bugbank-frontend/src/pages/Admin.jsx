// src/pages/Admin.jsx
import React, { useEffect, useRef, useState } from "react";
import { getUser } from "../lib/auth";
import api from "../lib/api";
import { toast } from "react-toastify";
import AdminTable from "../components/AdminTable";
import { Panel } from "../components/ui";

function normalizePage(payload, fallback) {
  // Accepts multiple shapes: {items,total,page,pages} | {rows,...} | {data:{items,...}} | array
  const p = payload?.data && !Array.isArray(payload?.data) ? payload.data : payload;
  if (Array.isArray(p)) {
    return { items: p, total: p.length, page: 1, pages: 1 };
  }
  const items = p?.items || p?.rows || p?.list || [];
  const total = Number(p?.total ?? items.length ?? 0);
  const page = Number(p?.page ?? 1);
  const pages = Number(p?.pages ?? (total > 0 ? Math.ceil(total / (p?.limit || p?.perPage || items.length || 1)) : 1));
  return {
    items: Array.isArray(items) ? items : [],
    total: Number.isFinite(total) ? total : 0,
    page: Number.isFinite(page) ? page : 1,
    pages: Number.isFinite(pages) ? pages : 1,
  } ?? fallback;
}

export default function Admin() {
  const me = getUser();
  const [users, setUsers]   = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [bugs, setBugs]     = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [audits, setAudits] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);

  // Keep a ref to abort in-flight requests on unmount or reload
  const abortRef = useRef(null);

  async function load() {
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch {}
    }
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    try {
      // If your backend supports pagination, you can add ?page=users.page etc.
      const [u, b, a] = await Promise.all([
        api.get("/admin/users",  { signal: ac.signal }),
        api.get("/admin/bugs",   { signal: ac.signal }),
        api.get("/admin/audits", { signal: ac.signal }),
      ]);

      setUsers(prev => normalizePage(u?.data ?? u, prev));
      setBugs(prev => normalizePage(b?.data ?? b, prev));
      setAudits(prev => normalizePage(a?.data ?? a, prev));
    } catch (err) {
      if (err?.name === "CanceledError") return; // axios cancellation
      if (err?.code === "ERR_CANCELED") return;
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        (Array.isArray(err?.response?.data?.errors) && err.response.data.errors.map(x => x.msg).join(", ")) ||
        err?.message ||
        "Failed to load admin data";
      toast.error(msg);
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

  // Hard guard for non-admin users
  const role = (me?.role || me?.type || "").toString().toLowerCase();
  const isAdmin = !!me && role === "admin";

  if (!isAdmin) {
    return (
      <Panel className="p-12 text-center">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="text-slate-300 mt-2">Admin privileges are required to view this page.</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Admin</h1>
        <p className="text-sm text-slate-300/90">Manage users, bugs, and audits.</p>
      </div>

      <Panel className="p-6">
        <h2 className="text-lg font-semibold">Users</h2>
        <div className="mt-4 overflow-x-auto">
          <AdminTable loading={loading} data={users} type="users" onRefresh={load} />
        </div>
      </Panel>

      <Panel className="p-6">
        <h2 className="text-lg font-semibold">Bugs</h2>
        <div className="mt-4 overflow-x-auto">
          <AdminTable loading={loading} data={bugs} type="bugs" onRefresh={load} />
        </div>
      </Panel>

      <Panel className="p-6">
        <h2 className="text-lg font-semibold">Audits</h2>
        <div className="mt-4 overflow-x-auto">
          <AdminTable loading={loading} data={audits} type="audits" onRefresh={load} />
        </div>
      </Panel>
    </div>
  );
}
