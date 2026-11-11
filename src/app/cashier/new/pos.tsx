"use client";
import { useEffect, useRef, useState } from "react";
import { buildQris } from "@/lib/qris";
const rp = (n: number) => "Rp" + n.toLocaleString("id-ID");
type S = { id: string; name: string; priceRp: number; commissionRp?: number }; type A = { id: string; name: string; available: boolean };
export default function POS() {
  const [services, setS] = useState<S[]>([]), [artists, setA] = useState<A[]>([]);

  const [sid, setSid] = useState(""), [aid, setAid] = useState(""), [q, setQ] = useState(""), [onlyAvail, setOnly] = useState(false);
  const [disc, setDisc] = useState(0), [cash, setCash] = useState(0), [cust, setCust] = useState("");
  const [pay, setPay] = useState<"cash" | "qris">("cash");
  const cashRef = useRef<HTMLInputElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const qrisStatic = process.env.NEXT_PUBLIC_QRIS_STATIC ?? "";
  const [busy, setBusy] = useState(false), [err, setErr] = useState(""), [done, setDone] = useState<{ id: string; totalRp: number; changeRp: number; cashReceivedRp?: number } | null>(null);
  const [branchName, setBranchName] = useState("");
  const key = useRef<string>();
  const load = () => { fetch("/api/services").then((r) => r.json()).then((d) => { setS(d.services ?? []); setBranchName(d.branchName ?? ""); }).catch(() => {}); fetch("/api/artists").then((r) => r.json()).then((d) => setA(d.artists ?? [])).catch(() => {}); };
  useEffect(load, []);
  useEffect(() => { if (!done) return; const t = setTimeout(() => window.print(), 300); return () => clearTimeout(t); }, [done]);
  const svc = services.find((s) => s.id === sid), art = artists.find((a) => a.id === aid);
  const total = Math.max(0, (svc?.priceRp ?? 0) - disc), change = cash - total;
  const qrisPayload = pay === "qris" && qrisStatic && svc ? buildQris(qrisStatic, total) : "";
  useEffect(() => { if (!qrisPayload) { setQrDataUrl(""); return; } let cancelled = false; (async () => { const { default: QRCode } = await import("qrcode"); const url = await QRCode.toDataURL(qrisPayload, { scale: 5, margin: 4 }); if (!cancelled) setQrDataUrl(url); })(); return () => { cancelled = true; }; }, [qrisPayload]);
  const shown = artists.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()) && (!onlyAvail || a.available));
  useEffect(() => { if (pay === "qris") setCash(total); }, [pay, total]);
  async function confirm() {
    setBusy(true); setErr(""); key.current ??= crypto.randomUUID(); // same key on retry = no double charge
    const r = await fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId: sid, artistId: aid, discountRp: disc, cashReceivedRp: cash, paymentMethod: pay === "qris" ? "QRIS" : "Tunai", customerName: cust || undefined, idempotencyKey: key.current }) });
    const d = await r.json(); setBusy(false);
    if (!r.ok) { setErr(d.error ?? "Gagal"); (window as any).__showToast?.("err", d.error ?? "Gagal"); return; }
    key.current = undefined; setDone(d); (window as any).__showToast?.("ok", "Transaksi berhasil");
  }
  function reset() { setDone(null); setSid(""); setAid(""); setDisc(0); setCash(0); setCust(""); load(); }
  if (done) return (<>
    <div className="card" style={{ maxWidth: 420 }}><h2>Transaksi berhasil</h2><div className="row"><span>ID</span>{done.id}</div>
      <div className="row"><span>Total</span>{rp(done.totalRp)}</div><div className="row"><span>Kembalian</span><b>{rp(done.changeRp)}</b></div><br />
      <div style={{ display: "flex", gap: 8 }}><button className="btn" onClick={reset}>Transaksi baru</button><button className="btn t" onClick={() => window.print()}>Cetak struk</button></div></div>
    <div className="receipt">
      <div className="r-center r-bold">TheSystem</div>
      {branchName && <div className="r-center">{branchName}</div>}
      <div className="r-line" />
      <div className="r-row"><span>Tanggal</span><span>{new Date().toLocaleString("id-ID")}</span></div>
      <div className="r-row"><span>No</span><span>{done.id}</span></div>
      <div className="r-line" />
      <div className="r-row"><span>Layanan</span><span>{svc?.name ?? "-"}</span></div>
      <div className="r-row"><span>Barber</span><span>{art?.name ?? "-"}</span></div>
      {cust && <div className="r-row"><span>Pelanggan</span><span>{cust}</span></div>}
      <div className="r-line" />
      <div className="r-row"><span>Harga</span><span>{rp(svc?.priceRp ?? 0)}</span></div>
      {disc > 0 && <div className="r-row"><span>Diskon</span><span>-{rp(disc)}</span></div>}
      <div className="r-row r-total"><span>Total</span><span>{rp(done.totalRp)}</span></div>
      <div className="r-row"><span>{pay === "qris" ? "QRIS" : "Tunai"}</span><span>{rp(done.cashReceivedRp ?? cash)}</span></div>
      <div className="r-row"><span>Kembalian</span><span>{rp(done.changeRp)}</span></div>
      <div className="r-line" />
      <div className="r-center">Terima kasih!</div>
    </div></>);
  return (<div className="pos"><div className="grid">
    <div className="card"><h2>1 · Pilih layanan</h2><div className="svcgrid">
      {services.map((s) => (<div key={s.id} className={"svc" + (s.id === sid ? " sel" : "")} title={s.name}>
        <div className="svcImg"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20 5H4V19L13.2923 9.70649C13.6828 9.31595 14.3159 9.31591 14.7065 9.70641L20 15.0104V5ZM2 3.9934C2 3.44476 2.45531 3 2.9918 3H21.0082C21.556 3 22 3.44495 22 3.9934V20.0066C22 20.5552 21.5447 21 21.0082 21H2.9918C2.44405 21 2 20.5551 2 20.0066V3.9934ZM8 11C6.89543 11 6 10.1046 6 9C6 7.89543 6.89543 7 8 7C9.10457 7 10 7.89543 10 9C10 10.1046 9.10457 11 8 11Z" /></svg></div>
        <div className="svcTitle" title={s.name} aria-label={s.name}>{s.name.split(" ").map((w, i) => <span key={i}>{w}</span>)}</div>
        <div className="svcAction">
          <span className="svcPrice">{rp(s.priceRp)}</span>
          <button type="button" className="svcBtn" onClick={() => { setSid(s.id); if (disc > s.priceRp) setDisc(s.priceRp); }}>Pilih</button>
        </div>
      </div>))}</div></div>
    <div className="card"><h2>2 · Pilih barber</h2>
      <div className="grid tg">{shown.map((a) => (
        <button key={a.id} className={"tile" + (a.id === aid ? " sel" : "")} onClick={() => setAid(a.id)}><b>{a.name}</b><span className={"pill " + (a.available ? "ok" : "mute")}>{a.available ? "Tersedia" : "Belum absen"}</span></button>))}</div>
      <button className={"btn" + (onlyAvail ? "" : " t")} style={{ width: "100%", marginTop: 8 }} onClick={() => setOnly(!onlyAvail)}>Hanya yang tersedia</button></div></div>
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
        <input id="r" ref={cashRef} className="field" inputMode="numeric" value={cash ? cash.toLocaleString("id-ID") : ""} onChange={(e) => {
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
        <div className="cashgrid">
          {[1000, 5000, 10000, 20000, 50000, 100000].map((v) => (<button key={v} type="button" className="btn t" onClick={() => setCash((c) => c + v)}>{rp(v)}</button>))}
        </div>
        <div style={{ background: "var(--ok-bg, #C4EED0)", color: "var(--ok-fg, #0D652D)", borderRadius: 16, padding: "12px 16px", margin: "4px 0 12px" }}><small>Kembalian</small><div style={{ fontSize: 26, fontWeight: 600 }}>{svc && change >= 0 ? rp(change) : "—"}</div></div>
      </>)}
      {pay === "qris" && (<div style={{ textAlign: "center", margin: "8px 0 12px" }}>
        {!qrisStatic && <div className="err">Set NEXT_PUBLIC_QRIS_STATIC di .env untuk QRIS dinamis.</div>}
        {qrisStatic && svc && (<>
          {qrDataUrl ? <img src={qrDataUrl} alt="QRIS" style={{ maxWidth: "100%", height: "auto" }} /> : <div className="portal">Membuat QR…</div>}
          <div className="portal" style={{ marginTop: 8 }}>Scan QRIS untuk bayar {rp(total)}</div>
        </>)}
      </div>)}
      {err && <div className="err" role="alert">{err}</div>}
      <button className="btn" disabled={busy || !svc || !art || cash < total} onClick={confirm}>{busy ? "Memproses…" : "Konfirmasi transaksi"}</button></div></div>);
}
