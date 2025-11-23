// src/components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-white/10 py-8 text-xs text-slate-400/90">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>© {year} BugBank</div>

        <nav className="flex items-center gap-3" aria-label="Footer links">
          <Link className="hover:text-white transition" to="/terms">
            Terms
          </Link>
          <Link className="hover:text-white transition" to="/privacy">
            Privacy
          </Link>
          <a
            className="hover:text-white transition"
            href="https://github.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
