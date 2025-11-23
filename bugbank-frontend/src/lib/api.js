import axios from "axios";
import { getToken } from "./auth";

// Prefer explicit env var; fallback to relative /api for proxy or same-origin
const base =
  (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.replace(/\/$/, "")) ||
  "/api";

const api = axios.create({
  baseURL: base,
  withCredentials: true,
  timeout: 15000,
  headers: {
    Accept: "application/json",
  },
});


// Attach Authorization if token exists
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Optionally handle 401 globally (auto-logout)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // TODO: hook into your logout logic or redirect to login
      console.warn("Unauthorized (401) – maybe expired token");
    }
    return Promise.reject(err);
  }
);

export default api;
