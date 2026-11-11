"use client";
import { useEffect, useState } from "react";

type Toast = { id: number; type: "ok" | "err"; msg: string };

export default function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = (type: "ok" | "err", msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };

  useEffect(() => {
    (window as any).__showToast = push;
    // inject PWA meta tags for iOS standalone mode
    const pwaTags: [string, Record<string, string>][] = [
      ["link", { rel: "manifest", href: "/manifest.json" }],
      ["meta", { name: "apple-mobile-web-app-capable", content: "yes" }],
      ["meta", { name: "apple-mobile-web-app-status-bar-style", content: "default" }],
      ["meta", { name: "apple-mobile-web-app-title", content: "BarberStory" }],
      ["link", { rel: "apple-touch-icon", href: "/applogo.png" }],
      ["meta", { name: "theme-color", content: "#FED950" }],
    ];
    for (const [tag, attrs] of pwaTags) {
      const key = Object.keys(attrs)[0];
      const val = Object.values(attrs)[0];
      if (document.querySelector(`${tag}[${key}="${val}"]`)) continue;
      const el = document.createElement(tag);
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      document.head.appendChild(el);
    }
    const poll = () => {
      const m = document.cookie.match(/(?:^|; )toast=([^;]*)/);
      if (!m) return;
      const val = decodeURIComponent(m[1]);
      const idx = val.indexOf(":");
      const type = idx >= 0 ? val.slice(0, idx) : val;
      const msg = idx >= 0 ? val.slice(idx + 1) : "";
      push(type === "ok" ? "ok" : "err", msg || (type === "ok" ? "Berhasil" : "Gagal"));
      document.cookie = "toast=; path=/; max-age=0";
    };
    poll();
    const iv = setInterval(poll, 400);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ position: "fixed", bottom: 16, left: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, maxWidth: 360, pointerEvents: "none" }}>
      {toasts.map((t) => (
        <div key={t.id} style={{ padding: "10px 14px", borderRadius: 12, color: "#fff", background: t.type === "ok" ? "#0D652D" : "#A50E0E", boxShadow: "0 4px 12px rgba(0,0,0,.25)", fontSize: 13, fontWeight: 500, pointerEvents: "auto" }}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
