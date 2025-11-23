
```md
# BugBank Frontend (React + Vite + Tailwind)

This is the **frontend client** for BugBank – a gamified bug-bounty / QA platform.  
It is built with **React 19, Vite, TailwindCSS 4, DaisyUI, React Router, and Axios**.

The frontend consumes the BugBank backend API and provides:

- Authentication (login / register)
- Dashboard with bugs list and filters
- Bug submission & details views
- Claim & resolve flows
- XP progress bar and leaderboard views
- Loading / error boundaries and toast notifications

---

## Tech Stack

- **Framework:** React + Vite
- **Language:** JavaScript (ES Modules)
- **Styling:** TailwindCSS 4 + DaisyUI
- **Routing:** React Router
- **HTTP Client:** Axios
- **Charts:** Recharts
- **Toasts / Notifications:** React-Toastify

---

## Project Structure

```text
bugbank-frontend/
  public/
    favicon.ico
    ...
  src/
    components/
      Navbar.jsx
      Footer.jsx
      Loading.jsx
      ErrorBoundary.jsx
      Empty.jsx
      XPBar.jsx
      ui.jsx
    lib/
      api.js        # Axios wrapper for backend calls
      auth.js       # Auth helpers (tokens, current user, etc.)
    pages/
      ...           # Route-based pages (dashboard, auth, bug detail, etc.)
    App.jsx         # Routes and layout
    main.jsx        # React root
    index.css       # Tailwind + base styles
  .env              # Local env (VITE_API_URL)
  vite.config.js
  tailwind.config.cjs
  postcss.config.cjs
  package.json
  README.md
