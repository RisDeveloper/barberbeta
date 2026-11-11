import "./globals.css"; import type { ReactNode } from "react"; import type { Viewport } from "next"; import ThemeToggle from "@/components/ThemeToggle"; import ToastHost from "@/components/ToastHost"; import SWRegister from "@/components/SWRegister";
export const metadata = { title: "BarberStory" }; // pwa-v2
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };
const themeScript = "try{var t=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t}catch(e){}";
export default function Root({ children }: { children: ReactNode }) {
  return (<html lang="id"><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700" />
<link rel="manifest" href="/manifest.json" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="BarberStory" />
<link rel="apple-touch-icon" href="/applogo.png" />
<meta name="theme-color" content="#FED950" /></head><body>{children}<ThemeToggle /><ToastHost /><SWRegister /></body></html>);
}
