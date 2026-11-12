import "./globals.css"; import type { ReactNode } from "react"; import type { Viewport, Metadata } from "next"; import Script from "next/script"; import ThemeToggle from "@/components/ThemeToggle"; import ToastHost from "@/components/ToastHost"; import SWRegister from "@/components/SWRegister";
export const metadata: Metadata = { title: "TheSystem", manifest: "/manifest.json", appleWebApp: { capable: true, statusBarStyle: "default", title: "TheSystem" }, icons: { apple: "/apple-touch-icon.png" } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#FED950" };
const themeScript = "try{var t=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t}catch(e){}";
export default function Root({ children }: { children: ReactNode }) {
  return (<html lang="id"><body><Script id="theme" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeScript }} /><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700" />{children}<ThemeToggle /><ToastHost /><SWRegister /></body></html>);
}
