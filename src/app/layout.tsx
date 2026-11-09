import "./globals.css"; import type { ReactNode } from "react"; import type { Viewport } from "next"; import ThemeToggle from "@/components/ThemeToggle";
export const metadata = { title: "BarberStory" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };
const themeScript = "try{var t=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t}catch(e){}";
export default function Root({ children }: { children: ReactNode }) {
  return (<html lang="id"><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700" /></head><body>{children}<ThemeToggle /></body></html>);
}
