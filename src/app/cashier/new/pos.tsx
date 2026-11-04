"use client";
import { useEffect, useRef, useState } from "react";
const rp = (n: number) => "Rp" + n.toLocaleString("id-ID");
function buildQris(staticQris: string, amount: number) {
  if (!staticQris || amount <= 0) return "";
  // strip existing CRC
  let s = staticQris;
  const crcIdx = s.lastIndexOf("6304");
  if (crcIdx >= 0) s = s.slice(0, crcIdx);
  // parse TLV, drop tag 01? set to dynamic (12), drop tag 54
  let out = "", i = 0;
  while (i < s.length) {
    const tag = s.slice(i, i + 2); i += 2;
    const len = parseInt(s.slice(i, i + 2), 10); i += 2;
    const val = s.slice(i, i + len); i += len;
    if (tag === "01") { out += "010212"; continue; }
    if (tag === "54") continue;
    out += tag + String(val.length).padStart(2, "0") + val;
  }
  // insert amount (tag 54) before country code (58) if present
  const amt = String(amount);
  const amtField = "54" + String(amt.length).padStart(2, "0") + amt;
  const idx58 = out.indexOf("58");
  if (idx58 >= 0) out = out.slice(0, idx58) + amtField + out.slice(idx58);
  else out += amtField;
  // CRC
  const crcInput = out + "6304";
  let crc = 0xFFFF;
  for (let c = 0; c < crcInput.length; c++) {
    crc ^= crcInput.charCodeAt(c) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      else crc = (crc << 1) & 0xFFFF;
    }
  }
  return crcInput + crc.toString(16).toUpperCase().padStart(4, "0");
}
type S = { id: string; name: string; description: string | null; priceRp: number }; type A = { id: string; name: string; available: boolean };
export default function POS() {
  const [services, setS] = useState<S[]>([]), [artists, setA] = useState<A[]>([]);
  const [sid, setSid] = useState(""), [aid, setAid] = useState(""), [q, setQ] = useState(""), [onlyAvail, setOnly] = useState(false);
  const [disc, setDisc] = useState(0), [cash, setCash] = useState(0), [cust, setCust] = useState("");
  const [pay, setPay] = useState<"cash" | "qris">("cash");
  const cashRef = useRef<HTMLInputElement>(null);
  const qrisStatic = process.env.NEXT_PUBLIC_QRIS_STATIC ?? "";
  const [busy, setBusy] = useState(false), [err, setErr] = useState(""), [done, setDone] = useState<{ id: string; totalRp: number; changeRp: number } | null>(null);
  const key = useRef<string>();
  const load = () => { fetch("/api/services").then((r) => r.json()).then((d) => setS(d.services ?? [])).catch(() => {}); fetch("/api/artists").then((r) => r.json()).then((d) => setA(d.artists ?? [])).catch(() => {}); };
  useEffect(load, []);
  const svc = services.find((s) => s.id === sid), art = artists.find((a) => a.id === aid);
  const total = Math.max(0, (svc?.priceRp ?? 0) - disc), change = cash - total;
  const shown = artists.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()) && (!onlyAvail || a.available));
  useEffect(() => { if (pay === "qris") setCash(total); }, [pay, total]);
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
      <div style={{ display: "flex", gap: 8, margin: "8px 0" }}>
        <button type="button" className={"btn" + (pay === "cash" ? "" : " t")} onClick={() => setPay("cash")}>Tunai</button>
        <button type="button" className={"btn" + (pay === "qris" ? "" : " t")} onClick={() => setPay("qris")}>QRIS</button>
      </div>
      {pay === "cash" && (<>
        <label htmlFor="r" style={{ display: "block", marginTop: 8 }}>Tunai diterima (Rp)</label>
        <input id="r" ref={cashRef} className="field" style={{ maxWidth: 260, margin: "0 auto", display: "block" }} inputMode="numeric" value={cash ? cash.toLocaleString("id-ID") : ""} onChange={(e) => {
          const input = e.target; const cursor = input.selectionStart ?? input.value.length;
          const digitsBefore = input.value.slice(0, cursor).replace(/[^0-9]/g, "").length;
          const digits = input.value.replace(/[^0-9]/g, "");
          const num = digits ? parseInt(digits, 10) : 0;
          const formatted = num ? num.toLocaleString("id-ID") : "";
          input.value = formatted;
          let pos = 0, count = 0;
          for (let i = 0; i < formatted.length; i++) { if (/\\d/.test(formatted[i])) count++; pos = i + 1; if (count >= digitsBefore) break; }
          input.selectionStart = input.selectionEnd = pos;
          setCash(num);
        }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "6px auto", maxWidth: 260 }}>
          {[50000, 100000].map((v) => (<button key={v} type="button" className="btn t" style={{ width: "100%" }} onClick={() => setCash(v)}>{rp(v)}</button>))}
        </div>
        <div style={{ background: "#C4EED0", color: "#0D652D", borderRadius: 16, padding: "12px 16px", margin: "4px auto 12px", maxWidth: 260 }}><small>Kembalian</small><div style={{ fontSize: 26, fontWeight: 600 }}>{svc && change >= 0 ? rp(change) : "—"}</div></div>
      </>)}
      {pay === "qris" && (<div style={{ textAlign: "center", margin: "8px 0 12px" }}>
        {!qrisStatic && <div className="err">Set NEXT_PUBLIC_QRIS_STATIC di .env untuk QRIS dinamis.</div>}
        {qrisStatic && svc && (<>
          <img src={"https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" + encodeURIComponent(buildQris(qrisStatic, total))} alt="QRIS" />
          <div className="portal" style={{ marginTop: 8 }}>Scan QRIS untuk bayar {rp(total)}</div>
        </>)}
      </div>)}
      {err && <div className="err" role="alert">{err}</div>}
      <button className="btn" disabled={busy || !svc || !art || cash < total} onClick={confirm}>{busy ? "Memproses…" : "Konfirmasi transaksi"}</button></div></div>);
}
