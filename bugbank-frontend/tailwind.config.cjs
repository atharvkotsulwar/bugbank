/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",   // added ts/tsx for safety if you expand
  ],
  darkMode: "class", // ensures your forced dark mode works
  theme: {
    extend: {
      // You can extend custom fonts, shadows, animations here later
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        bugbanksdark: {
          primary: "#7C3AED",
          secondary: "#06B6D4",
          accent: "#F59E0B",
          neutral: "#1f2937",
          "base-100": "#0B1220",
          info: "#38bdf8",
          success: "#10b981",
          warning: "#f59e0b",
          error: "#ef4444",
        },
      },
    ],
    darkTheme: "bugbanksdark", // automatically uses your theme in dark mode
  },
};
