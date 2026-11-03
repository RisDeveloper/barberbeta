"use client";
import { useEffect, useRef, useState } from "react";
type R = { name: string; branch: string; state: string; notice: string; checkInAt: string; checkOutAt: string | null };
const KEY = "barberstory_kiosk_key";
const t = (s: string | null) => (s ? new Date(s).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—");
export default function Kiosk() {
  const [key, setKey] = useState<string | null>(null), [draft, setDraft] = useState(""), [res, setRes] = useState<R | null>(null), [err, setErr] = useState("");
  const input = useRef<HTMLInputElement>(null), timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => { try { setKey(localStorage.getItem(KEY)); } catch {} }, []);
  useEffect(() => { input.current?.focus(); }, [key, res, err]);
  async function tap(uid: string) {
    clearTimeout(timer.current); setErr("");
    const r = await fetch("/api/attendance/tap", { method: "POST", headers: { "Content-Type": "application/json", "x-device-key": key! }, body: JSON.stringify({ cardUid: uid }) });
    const d = await r.json(); if (r.ok) setRes(d); else { setRes(null); setErr(d.error ?? "Gagal membaca kartu"); }
    timer.current = setTimeout(() => { setRes(null); setErr(""); }, 6000);
  }
  function save() { try { localStorage.setItem(KEY, draft.trim()); } catch {} setKey(draft.trim()); setDraft(""); }
  function reset() { try { localStorage.removeItem(KEY); } catch {} setKey(null); }
  if (!key) return (<div className="center"><div className="card login"><div className="brand" style={{ padding: 0, marginBottom: 12 }}><span className="logo">B</span>BarberStory Kiosk</div>
    <label htmlFor="k">Kunci kiosk (dari Pemilik → Pengaturan Sistem)</label><input id="k" className="field" type="password" value={draft} onChange={(e) => setDraft(e.target.value)} /><button className="btn" disabled={!draft.trim()} onClick={save}>Atur kiosk ini</button></div></div>);
  return (<div className="center" style={{ padding: 16 }}>
    <input ref={input} aria-label="Input pembaca kartu" autoComplete="off" style={{ position: "absolute", opacity: 0, width: 1, height: 1 }} onBlur={() => input.current?.focus()}
      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const v = e.currentTarget.value.trim(); e.currentTarget.value = ""; if (v) tap(v); } }} />
    <div className="card" role="status" aria-live="polite" style={{ width: 460, maxWidth: "100%", textAlign: "center", padding: 32, background: res ? "#C4EED0" : err ? "#FCE8E6" : "#fff" }}>
      {res ? (<><span className="logo" style={{ width: 72, height: 72, borderRadius: "50%", margin: "0 auto 12px", fontSize: 28, background: "#fff", color: "#202124" }}>{res.name[0]}</span>
        <h1 style={{ margin: 0 }}>{res.name}</h1><div className="portal" style={{ margin: "4px 0 16px", color: "#0D652D" }}>{res.branch}</div>
        <div style={{ fontSize: 26, fontWeight: 600, color: "#0D652D" }}>{res.state}</div><div style={{ marginTop: 8 }}>{res.notice}</div>
        <div className="row" style={{ marginTop: 16 }}><span>Masuk</span><b>{t(res.checkInAt)}</b></div><div className="row"><span>Keluar</span><b>{t(res.checkOutAt)}</b></div></>)
      : err ? (<><h1 style={{ margin: 0, color: "#A50E0E" }}>Kartu ditolak</h1><p>{err}</p></>)
      : (<><span className="logo" style={{ width: 72, height: 72, borderRadius: "50%", margin: "0 auto 12px" }}>B</span><h1 style={{ margin: 0 }}>Belum Absen Datang</h1><p className="portal" style={{ margin: "8px 0 0" }}>Tempelkan kartu RFID/NFC Anda pada reader.</p></>)}</div>
    <button className="btn t" style={{ width: "auto", position: "fixed", bottom: 12, right: 12 }} onClick={reset}>Ganti kunci kiosk</button></div>);
}
