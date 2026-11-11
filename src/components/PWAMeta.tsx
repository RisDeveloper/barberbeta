"use client";
import { useEffect } from "react";
export default function PWAMeta() {
  useEffect(() => {
    const tags: [string, Record<string, string>][] = [
      ["link", { rel: "manifest", href: "/manifest.json" }],
      ["meta", { name: "apple-mobile-web-app-capable", content: "yes" }],
      ["meta", { name: "apple-mobile-web-app-status-bar-style", content: "default" }],
      ["meta", { name: "apple-mobile-web-app-title", content: "TheSystem" }],
      ["link", { rel: "apple-touch-icon", href: "/apple-touch-icon.png" }],
      ["meta", { name: "theme-color", content: "#FED950" }],
    ];
    for (const [tag, attrs] of tags) {
      const key = tag === "link" ? "rel" : "name";
      const val = attrs[key];
      // remove existing tag with same rel/name
      const existing = document.querySelector(`${tag}[${key}="${val}"]`);
      if (existing) existing.remove();
      const el = document.createElement(tag);
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      document.head.appendChild(el);
    }
  }, []);
  return null;
}
