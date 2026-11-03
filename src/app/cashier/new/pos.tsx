"use client";
import { useEffect, useRef, useState } from "react";
const rp = (n: number) => "Rp" + n.toLocaleString("id-ID");
type S = { id: string; name: string; description: string | null; priceRp: number }; type A = { id: string; name: string; available: boolean };
export default function POS() {
  const [services, setS] = useState<S[]>([]), [artists, setA] = useState<A[]>([]);
  const [sid, setSid] = useState(""), [aid, setAid] = useState(""), [q, setQ] = useState(""), [onlyAvail, setOnly] = useState(false);
  const [disc, setDisc] = useState(0), [cash, setCash] = useState(0), [cust, setCust] = useState("");
  const [busy, setBusy] = useState(false), [err, setErr] = useState(""), [done, setDone] = useState<{ id: string; totalRp: number; changeRp: number } | null>(null);
  const key = useRef<string>();
  const load = () => { fetch("/api/services").then((r) => r.json()).then((d) => setS(d.services ?? [])).catch(() => {}); fetch("/api/artists").then((r) => r.json()).then((d) => setA(d.artists ?? [])).catch(() => {}); };
  useEffect(load, []);
  const svc = services.find((s) => s.id === sid), art = artists.find((a) => a.id === aid);
  const total = Math.max(0, (svc?.priceRp ?? 0) - disc), change = cash - total;
  const shown = artists.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()) && (!onlyAvail || a.available));
  async function confirm() {
    setBusy(true); setErr(""); key.current ??= crypto.randomUUID(); // same key on retry = no double charge
    const r = await fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId: sid, artistId: aid, discountRp: disc, cashReceivedRp: cash, customerName: cust || undefined, idempotencyKey: key.current }) });
    const d = await r.json(); setBusy(false);
    if (!r.ok) return setErr(d.error ?? "Gagal");
    key.current = undefined; setDone(d);
  }
  function reset() { setDone(null); setSid(""); setAid(""); setDisc(0); setCash(0); setCust(""); load(); }
  if (done) return (<div className="card" style={{ maxWidth: 420 }}><h2>Transaksi berhasil</h2><div className="row"><span>ID</span>{done.id}</div>
    <div className="row"><span>Total</span>{rp(done.totalRp)}</div><div className="row"><span>Kembalian</span><b>{rp(done.changeRp)}</b></div><br /><button className="btn" onClick={reset}>Transaksi baru</button></div>);
  return (<div className="pos"><div className="grid">
    <div className="card"><h2>1 · Pilih layanan</h2><div className="grid tg">
      {services.map((s) => (<button key={s.id} className={"tile" + (s.id === sid ? " sel" : "")} onClick={() => { setSid(s.id); if (disc > s.priceRp) setDisc(s.priceRp); }}><b>{s.name}</b><small>{s.description ?? ""}</small><span>{rp(s.priceRp)}</span></button>))}</div></div>
    <div className="card"><h2>2 · Pilih barber</h2><div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
      <input className="field" style={{ margin: 0 }} placeholder="Cari barber" aria-label="Cari barber" value={q} onChange={(e) => setQ(e.target.value)} />
      <button className={"btn" + (onlyAvail ? "" : " t")} style={{ width: 160 }} onClick={() => setOnly(!onlyAvail)}>Hanya yang tersedia</button></div>
      <div className="grid tg">{shown.map((a) => (
        <button key={a.id} className={"tile" + (a.id === aid ? " sel" : "")} onClick={() => setAid(a.id)}><b>{a.name}</b><span className={"pill " + (a.available ? "ok" : "mute")}>{a.available ? "Tersedia" : "Belum absen"}</span></button>))}</div></div></div>
    <div className="card"><h2>3 · Ringkasan &amp; pembayaran</h2>
      <div className="row"><span>Layanan</span>{svc?.name ?? "—"}</div><div className="row"><span>Barber</span>{art?.name ?? "—"}</div>
      <label htmlFor="c">Pelanggan (opsional)</label><input id="c" className="field" value={cust} onChange={(e) => setCust(e.target.value)} />
      <label htmlFor="d">Diskon (Rp)</label><input id="d" className="field" type="number" min={0} value={disc || ""} onChange={(e) => setDisc(Math.max(0, Math.min(svc?.priceRp ?? 0, Math.floor(+e.target.value || 0))))} />
      <div className="row"><b>Total</b><b>{rp(total)}</b></div>
      <label htmlFor="r" style={{ display: "block", marginTop: 8 }}>Tunai diterima (Rp)</label><input id="r" className="field" type="number" min={0} value={cash || ""} onChange={(e) => setCash(Math.max(0, Math.floor(+e.target.value || 0)))} />
      <div style={{ background: "#C4EED0", color: "#0D652D", borderRadius: 16, padding: "12px 16px", margin: "4px 0 12px" }}><small>Kembalian</small><div style={{ fontSize: 26, fontWeight: 600 }}>{svc && change >= 0 ? rp(change) : "—"}</div></div>
      {err && <div className="err" role="alert">{err}</div>}
      <button className="btn" disabled={busy || !svc || !art || cash < total} onClick={confirm}>{busy ? "Memproses…" : "Konfirmasi transaksi"}</button></div></div>);
}
