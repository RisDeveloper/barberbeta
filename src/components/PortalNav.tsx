"use client";
import Link from "next/link"; import { usePathname } from "next/navigation";
const S = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
function icon(l: string, prefix = "") {
  if (/transaksi baru/i.test(l)) return <svg {...S}><path d="M12 5v14M5 12h14" /></svg>;
  if (/ringkasan|dasbor/i.test(l)) return <svg {...S}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>;
  if (/cabang/i.test(l)) return <svg {...S}><path d="M4 21V8l8-5 8 5v13M9 21v-6h6v6" /></svg>;
  if (/pendapatan saya|pengeluaran/i.test(l)) return <svg {...S}><path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H3zM3 7l12-3v3" /></svg>;
  if (/analisis|pendapatan/i.test(l)) return <svg {...S}><path d="M4 20V10M12 20V4M20 20v-8" /></svg>;
  if (/komisi/i.test(l)) return <svg {...S}><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="3" /></svg>;
  if (/laporan/i.test(l)) return <svg {...S}><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></svg>;
  if (/pengaturan/i.test(l)) return <svg {...S}><path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" /><path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>;
  if (/absensi/i.test(l)) return <svg {...S}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
  if (/karyawan|kasir/i.test(l)) return <svg {...S}><circle cx="12" cy="8" r="4" /><path d="M4 21c1-5 15-5 16 0" /></svg>;
  if (/barber/i.test(l)) return <svg {...S}><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M8.12 8.12 12 12l-3.88 3.88M14.12 14.12 18 18M14.12 9.88 18 6" /></svg>; // shortcut: simplified scissors, upgrade to full icon set if more variants needed
  if (/profil/i.test(l)) return prefix === "/admin" ? <svg {...S}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg> : <svg {...S}><circle cx="12" cy="8" r="4" /><path d="M4 21c1-5 15-5 16 0" /></svg>;
  if (/transaksi|riwayat/i.test(l)) return <svg {...S}><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></svg>;
  if (/keluar/i.test(l)) return <svg {...S}><path d="M10 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5M16 17l5-5-5-5M21 12H9" /></svg>;
  return <svg {...S}><circle cx="12" cy="12" r="8" /></svg>;
}
export default function PortalNav({ items, prefix }: { items: [string, string, string][]; prefix: string }) {
  const raw = usePathname() ?? "/", pathMode = raw === prefix || raw.startsWith(prefix + "/"), p = (pathMode ? raw.slice(prefix.length) : raw) || "/";
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = process.env.NEXT_PUBLIC_AUTH_URL ?? "/"; }
  return (<nav className="nav">{items.map(([h, l, c]) => (<Link key={h} href={pathMode ? prefix + h : h} title={l} className={p === h ? "on" : ""}><span className="dot" style={{ background: c }}>{icon(l, prefix)}</span>{l}</Link>))}
    <button onClick={logout} title="Keluar"><span className="dot" style={{ background: "#F1F3F4" }}>{icon("Keluar")}</span>Keluar</button></nav>);
}
