// src/App.jsx
import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Bugs from "./pages/Bugs";
import BugDetail from "./pages/BugDetail";
import SubmitBug from "./pages/SubmitBug";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Admin from "./pages/Admin";
import MyBugs from "./pages/MyBugs";
import { getUser } from "./lib/auth";
import { ToastContainer } from "react-toastify";

/* ---------- helpers (route guards + scroll) ---------- */

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, behavior: "instant" });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [pathname]);
  return null;
}

function RequireAuth({ children }) {
  const me = getUser();
  const location = useLocation();
  if (!me) {
    // preserve where the user wanted to go
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return children;
}

function RequireAdmin({ children }) {
  const me = getUser();
  const role = (me?.role || me?.type || "").toString().toLowerCase();
  if (!me || role !== "admin") {
    return <Navigate to="/bugs" replace />;
  }
  return children;
}

/* ---------- app ---------- */

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto p-4">
        <ErrorBoundary>
          <ScrollToTop />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route path="/bugs" element={<Bugs />} />
            <Route path="/bugs/:id" element={<BugDetail />} />

            <Route
              path="/submit"
              element={
                <RequireAuth>
                  <SubmitBug />
                </RequireAuth>
              }
            />

            <Route path="/leaderboard" element={<Leaderboard />} />

            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <Profile />
                </RequireAuth>
              }
            />
            <Route path="/my-bugs" element={<MyBugs />} />

            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />

            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <Admin />
                </RequireAdmin>
              }
            />

            {/* default: go to /bugs */}
            <Route path="*" element={<Navigate to="/bugs" replace />} />
          </Routes>
        </ErrorBoundary>
      </main>
      <Footer />
      <ToastContainer position="top-right" theme="dark" />
    </div>
  );
}
