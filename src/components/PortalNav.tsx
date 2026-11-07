"use client";
import Link from "next/link"; import { usePathname } from "next/navigation"; import { useState } from "react";
const S = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
function icon(l: string, prefix = "") {
  if (/transaksi baru/i.test(l)) return <svg {...S}><path d="M12 5v14M5 12h14" /></svg>;
  if (/ringkasan|dasbor/i.test(l)) return <svg {...S}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>;
  if (/cabang/i.test(l)) return <svg {...S}><path d="M4 21V8l8-5 8 5v13M9 21v-6h6v6" /></svg>;
  if (/pendapatan saya|pengeluaran/i.test(l)) return <svg {...S}><path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H3zM3 7l12-3v3" /></svg>;
  if (/analisis|pendapatan/i.test(l)) return <svg {...S}><path d="M4 20V10M12 20V4M20 20v-8" /></svg>;
  if (/komisi/i.test(l)) return <svg {...S}><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="3" /></svg>;
  if (/laporan/i.test(l)) return <svg {...S}><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></svg>;
  if (/pengaturan/i.test(l)) return <svg {...S}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
  if (/absensi/i.test(l)) return <svg {...S}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
  if (/karyawan|kasir/i.test(l)) return <svg {...S}><circle cx="12" cy="8" r="4" /><path d="M4 21c1-5 15-5 16 0" /></svg>;
  if (/barber/i.test(l)) return <svg {...S}><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M8.12 8.12 12 12l-3.88 3.88M14.12 14.12 18 18M14.12 9.88 18 6" /></svg>; // shortcut: simplified scissors, upgrade to full icon set if more variants needed
  if (/profil/i.test(l)) return prefix === "/admin" ? <svg {...S}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg> : <svg {...S}><circle cx="12" cy="8" r="4" /><path d="M4 21c1-5 15-5 16 0" /></svg>;
  if (/transaksi|riwayat/i.test(l)) return <svg {...S}><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></svg>;
  if (/keluar/i.test(l)) return <svg {...S}><path d="M10 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5M16 17l5-5-5-5M21 12H9" /></svg>;
  if (/lainnya/i.test(l)) return <svg {...S}><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
  return <svg {...S}><circle cx="12" cy="12" r="8" /></svg>;
}
const SHORT: Record<string, string> = {
  "Ringkasan Bisnis": "Dashboard", "Manajemen Cabang": "Cabang", "Analisis Pendapatan": "Analisis",
  "Semua Transaksi": "Transaksi", "Manajemen Karyawan": "Karyawan", "Absensi Karyawan": "Absensi",
  "Manajemen Komisi": "Komisi", "Pendapatan & Pengeluaran": "Keuangan", "Laporan Keuangan": "Laporan",
  "Pengaturan Sistem": "Setelan", "Transaksi Baru": "Transaksi", "Riwayat Transaksi": "Riwayat",
  "Absensi Saya": "Absensi", "Pendapatan Saya": "Komisi", "Riwayat Layanan": "Riwayat", "Profil Saya": "Profil",
};
const short = (l: string) => SHORT[l] ?? l.split(" ")[0];
export default function PortalNav({ items, prefix }: { items: [string, string, string][]; prefix: string }) {
  const raw = usePathname() ?? "/", pathMode = raw === prefix || raw.startsWith(prefix + "/"), p = (pathMode ? raw.slice(prefix.length) : raw) || "/";
  const [more, setMore] = useState(false);
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = process.env.NEXT_PUBLIC_AUTH_URL ?? "/"; }
  const over = items.length + 1 > 6, extra = over ? items.slice(5) : [];
  const link = ([h, l, c]: [string, string, string], i: number) => (
    <Link key={h} href={pathMode ? prefix + h : h} title={l} onClick={() => setMore(false)} className={(p === h ? "on " : "") + (i >= 5 ? "extra" : "")}><span className="dot" style={{ background: c }}>{icon(l, prefix)}</span><span className="nlbl">{short(l)}</span></Link>);
  return (<nav className="nav">{items.map(link)}
    <button onClick={logout} title="Keluar" className={"logoutBtn" + (over ? " extra" : "")}><span className="dot" style={{ background: "#F1F3F4" }}>{icon("Keluar")}</span><span className="nlbl">Keluar</span></button>
    {over && <>
      <button className="moreBtn" onClick={() => setMore((v) => !v)} aria-label="Menu lainnya" aria-expanded={more}><span className="dot" style={{ background: "#F1F3F4" }}>{icon("Lainnya")}</span><span className="nlbl">Lainnya</span></button>
      {more && <div className="moreMenu" role="menu">{extra.map(([h, l, c]) => (
        <Link key={"m" + h} href={pathMode ? prefix + h : h} className="mItem" onClick={() => setMore(false)}><span className="dot" style={{ background: c }}>{icon(l, prefix)}</span>{l}</Link>))}
        <button className="mItem" onClick={logout}><span className="dot" style={{ background: "#F1F3F4" }}>{icon("Keluar")}</span>Keluar</button>
      </div>}
    </>}
  </nav>);
}
