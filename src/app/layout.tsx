import "./globals.css"; import type { ReactNode } from "react"; import type { Viewport } from "next";
export const metadata = { title: "BarberStory" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };
export default function Root({ children }: { children: ReactNode }) {
  return (<html lang="id"><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700" /></head><body>{children}</body></html>);
}
