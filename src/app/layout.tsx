import "./globals.css"; import type { ReactNode } from "react"; import type { Viewport } from "next"; import Script from "next/script"; import ThemeToggle from "@/components/ThemeToggle"; import ToastHost from "@/components/ToastHost"; import SWRegister from "@/components/SWRegister";
export const metadata = { title: "BarberStory", manifest: "/manifest.json", appleWebApp: { capable: true, statusBarStyle: "default", title: "BarberStory" }, icons: { apple: "/applogo.png" }, themeColor: "#FED950" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };
const themeScript = "try{var t=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t}catch(e){}";
export default function Root({ children }: { children: ReactNode }) {
  return (<html lang="id"><body><Script id="theme" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeScript }} /><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700" />{children}<ThemeToggle /><ToastHost /><SWRegister /><span style={{display:"none"}}>PWA-V3-MARKER</span></body></html>);
}
