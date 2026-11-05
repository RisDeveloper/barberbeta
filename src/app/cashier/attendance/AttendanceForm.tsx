"use client";
import { useState } from "react";
type R = { name: string; branch: string; state: string; notice: string; checkInAt: string; checkOutAt: string | null } | null;
export default function AttendanceForm() {
  const [email, setEmail] = useState(""), [pin, setPin] = useState(""), [busy, setBusy] = useState(false);
  const [res, setRes] = useState<R>(null), [err, setErr] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(""); setRes(null);
    const r = await fetch("/api/attendance/cashier", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, pin }) });
    const d = await r.json(); setBusy(false);
    if (!r.ok) return setErr(d.error ?? "Gagal");
    setRes(d); setEmail(""); setPin("");
  }
  const t = (s: string | null) => (s ? new Date(s).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—");
  return (<div className="card" style={{ maxWidth: 460 }}>
    <h2>Absensi Karyawan</h2>
    <form onSubmit={submit} className="fr" style={{ flexDirection: "column", alignItems: "stretch" }}>
      <label>Email karyawan<input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
      <label>PIN (4-8 digit)<input className="field" type="password" value={pin} onChange={(e) => setPin(e.target.value)} required /></label>
      <button className="btn" disabled={busy}>{busy ? "Memproses…" : "Catat Absensi"}</button>
    </form>
    {err && <div className="err" role="alert" style={{ marginTop: 12 }}>{err}</div>}
    {res && (<div style={{ marginTop: 12, background: "#C4EED0", color: "#0D652D", borderRadius: 16, padding: 16 }}>
      <h3 style={{ margin: 0 }}>{res.name}</h3>
      <div className="portal" style={{ color: "#0D652D" }}>{res.branch}</div>
      <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>{res.state}</div>
      <div>{res.notice}</div>
      <div className="row" style={{ marginTop: 8 }}><span>Masuk</span><b>{t(res.checkInAt)}</b></div>
      <div className="row"><span>Keluar</span><b>{t(res.checkOutAt)}</b></div>
    </div>)}
  </div>);
}