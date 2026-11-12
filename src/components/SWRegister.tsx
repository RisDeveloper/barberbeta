"use client";
import { useEffect } from "react";
export default function SWRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // unregister old service workers first (fix redirect cache issue)
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) {
          if (reg.active && reg.active.scriptURL !== location.origin + "/sw.js") {
            reg.unregister();
          }
        }
      }).catch(() => {});
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}