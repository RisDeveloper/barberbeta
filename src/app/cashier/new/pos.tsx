"use client";
import { useEffect, useRef, useState } from "react";
import { buildQris } from "@/lib/qris";
const rp = (n: number) => "Rp" + n.toLocaleString("id-ID");
type S = { id: string; name: string; priceRp: number; commissionRp?: number; loyaltyPoints?: number }; type A = { id: string; name: string; available: boolean };
export default function POS() {
  const [services, setS] = useState<S[]>([]), [artists, setA] = useState<A[]>([]);

  const [sid, setSid] = useState(""), [aid, setAid] = useState(""), [q, setQ] = useState(""), [onlyAvail, setOnly] = useState(false);
  const [disc, setDisc] = useState(0), [cash, setCash] = useState(0), [cust, setCust] = useState("");
  const [pay, setPay] = useState<"cash" | "qris">("cash");
  const cashRef = useRef<HTMLInputElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrisStatic, setQrisStatic] = useState(process.env.NEXT_PUBLIC_QRIS_STATIC ?? "");
  const [busy, setBusy] = useState(false), [err, setErr] = useState(""), [done, setDone] = useState<{ id: string; totalRp: number; changeRp: number; cashReceivedRp?: number } | null>(null);
  const [branchName, setBranchName] = useState("");
  const [branchLogoUrl, setBranchLogoUrl] = useState("");
  const [receiptWidthMm, setReceiptWidthMm] = useState(58);
  const [printMode, setPrintMode] = useState<"system" | "pdf" | "rawbt">("system");
  const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
  const isIOS = typeof navigator !== "undefined" && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1));
  const key = useRef<string>();
  const load = () => { fetch("/api/services").then((r) => r.json()).then((d) => { setS(d.services ?? []); setBranchName(d.branchName ?? ""); setBranchLogoUrl(d.branchLogoUrl ?? ""); setReceiptWidthMm(d.receiptWidthMm ?? 58); setQrisStatic(d.qrisStatic ?? process.env.NEXT_PUBLIC_QRIS_STATIC ?? ""); }).catch(() => {}); fetch("/api/artists").then((r) => r.json()).then((d) => setA(d.artists ?? [])).catch(() => {}); };
  useEffect(load, []);
  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1);
    const saved = (() => { try { return localStorage.getItem("receiptPrintMode"); } catch { return null; } })();
    setPrintMode(saved === "system" || saved === "pdf" || saved === "rawbt" ? saved : ios ? "pdf" : "system");
  }, []);
  const chooseMode = (m: typeof printMode) => { setPrintMode(m); try { localStorage.setItem("receiptPrintMode", m); } catch {} };
  const svc = services.find((s) => s.id === sid), art = artists.find((a) => a.id === aid);
  const total = Math.max(0, (svc?.priceRp ?? 0) - disc), change = cash - total;
  const mm = receiptWidthMm >= 76 ? 80 : 58, rfs = mm === 80 ? 12 : 10, rpad = mm === 80 ? 4 : 2;
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
  function printRawBT() {
    if (!done) return;
    const width = mm === 80 ? 48 : 32;
    const padL = (l: string, r: string) => l + " ".repeat(Math.max(1, width - l.length - r.length)) + r;
    const enc = new TextEncoder();
    const b: number[] = [0x1b, 0x40];
    const push = (...x: number[]) => b.push(...x);
    const text = (s: string) => b.push(...enc.encode(s));
    push(0x1b, 0x61, 0x01, 0x1b, 0x45, 0x01); text("TheSystem\n"); push(0x1b, 0x45, 0x00);
    if (branchName) text(branchName + "\n");
    text("Powered by The System Pos\n");
    push(0x1b, 0x61, 0x00);
    text("-".repeat(width) + "\n");
    text(padL("Tanggal", new Date().toLocaleString("id-ID")) + "\n");
    text(padL("No", done.id) + "\n");
    text("-".repeat(width) + "\n");
    text(padL("Layanan", svc?.name ?? "-") + "\n");
    text(padL("Barber", art?.name ?? "-") + "\n");
    if (cust) text(padL("Pelanggan", cust) + "\n");
    text("-".repeat(width) + "\n");
    text(padL("Harga", rp(svc?.priceRp ?? 0)) + "\n");
    if (disc > 0) text(padL("Diskon", "-" + rp(disc)) + "\n");
    push(0x1b, 0x45, 0x01); text(padL("Total", rp(done.totalRp)) + "\n"); push(0x1b, 0x45, 0x00);
    text(padL(pay === "qris" ? "QRIS" : "Tunai", rp(done.cashReceivedRp ?? cash)) + "\n");
    text(padL("Kembalian", rp(done.changeRp)) + "\n");
    text("-".repeat(width) + "\n");
    push(0x1b, 0x61, 0x01); text("Terima kasih!\n"); push(0x1b, 0x61, 0x00);
    push(0x0a, 0x0a, 0x0a, 0x1d, 0x56, 0x42, 0x00);
    let bin = ""; for (let i = 0; i < b.length; i++) bin += String.fromCharCode(b[i]);
    window.location.href = `intent:base64,${btoa(bin)}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
  }
  async function sharePdf() {
    if (!done) return;
    // iOS (especially standalone PWA) often cannot open/close window.print preview, so share a PDF instead.
    try {
      const { jsPDF } = await import("jspdf");
      const rows: { l?: string; r?: string; c?: string; b?: boolean; dash?: boolean; size?: number }[] = [];
      rows.push({ c: "TheSystem", b: true, size: 1 });
      if (branchName) rows.push({ c: branchName });
      rows.push({ c: "Powered by The System Pos", size: -1 });
      rows.push({ dash: true });
      rows.push({ l: "Tanggal", r: new Date().toLocaleString("id-ID") });
      rows.push({ l: "No", r: done.id });
      rows.push({ dash: true });
      rows.push({ l: "Layanan", r: svc?.name ?? "-" });
      rows.push({ l: "Barber", r: art?.name ?? "-" });
      if (cust) rows.push({ l: "Pelanggan", r: cust });
      rows.push({ dash: true });
      rows.push({ l: "Harga", r: rp(svc?.priceRp ?? 0) });
      if (disc > 0) rows.push({ l: "Diskon", r: "-" + rp(disc) });
      rows.push({ l: "Total", r: rp(done.totalRp), b: true });
      rows.push({ l: pay === "qris" ? "QRIS" : "Tunai", r: rp(done.cashReceivedRp ?? cash) });
      rows.push({ l: "Kembalian", r: rp(done.changeRp) });
      rows.push({ dash: true });
      rows.push({ c: "Terima kasih!" });
      const base = mm === 80 ? 9 : 7.5, lh = mm === 80 ? 4.2 : 3.6, pad = rpad;
      const height = pad * 2 + 6 + rows.reduce((a, r) => a + (r.dash ? lh * 0.9 : r.size && r.size > 0 ? lh * 1.2 : lh), 0) + 4;
      const doc = new jsPDF({ unit: "mm", format: [mm, height], compress: true });
      let y = pad + 3;
      for (const r of rows) {
        if (r.dash) { doc.setLineDashPattern([0.7, 0.7], 0); doc.setDrawColor(0); doc.line(pad, y, mm - pad, y); doc.setLineDashPattern([], 0); y += lh * 0.9; continue; }
        if (r.c !== undefined) {
          doc.setFont("courier", r.b ? "bold" : "normal"); doc.setFontSize(base + (r.size === 1 ? 2 : r.size === -1 ? -2 : 0));
          doc.text(r.c, mm / 2, y, { align: "center" });
        } else {
          doc.setFont("courier", r.b ? "bold" : "normal"); doc.setFontSize(base + (r.b ? 1 : 0));
          doc.text(String(r.l ?? ""), pad, y);
          doc.text(String(r.r ?? ""), mm - pad, y, { align: "right" });
        }
        y += r.size && r.size > 0 ? lh * 1.2 : lh;
      }
      const file = new File([doc.output("blob")], `struk-${done.id.slice(-6)}.pdf`, { type: "application/pdf" });
      const nav: any = navigator;
      if (nav.canShare?.({ files: [file] })) { await nav.share({ files: [file], title: "Struk" }); return; }
      const url = URL.createObjectURL(file);
      const a = document.createElement("a"); a.href = url; a.download = file.name; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch { (window as any).__showToast?.("err", "Gagal menyiapkan struk"); }
  }
  function printReceipt() {
    if (!done) return;
    if (printMode === "rawbt") { printRawBT(); return; }
    if (printMode === "pdf") { void sharePdf(); return; }
    window.print();
  }
  if (done) return (<>
    <style dangerouslySetInnerHTML={{ __html: `@page{size:${mm}mm auto;margin:0}` }} />
    <div className="card" style={{ maxWidth: 420 }}><h2>Transaksi berhasil</h2><div className="row"><span>ID</span>{done.id}</div>
      <div className="row"><span>Total</span>{rp(done.totalRp)}</div><div className="row"><span>Kembalian</span><b>{rp(done.changeRp)}</b></div><br />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="btn" onClick={reset}>Transaksi baru</button><button className="btn t" onClick={() => printReceipt()}>Cetak struk</button></div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}><span style={{ fontSize: 12, color: "var(--muted)" }}>Metode cetak</span>
        <select className="field" style={{ margin: 0, width: "auto", padding: "6px 8px" }} value={printMode} onChange={(e) => chooseMode(e.target.value as typeof printMode)}>
          <option value="system">Sistem / AirPrint / Driver</option>
          <option value="pdf">PDF (share / simpan)</option>
          {isAndroid && <option value="rawbt">RawBT (Bluetooth)</option>}
        </select></div>
      {isAndroid && printMode === "rawbt" && <div className="portal" style={{ margin: "8px 0 0" }}>Pastikan app RawBT terpasang di tablet Android.</div>}
      {isIOS && printMode !== "pdf" && <div className="portal" style={{ margin: "8px 0 0" }}>Di iPad/iPhone sebaiknya pakai PDF/AirPrint; Bluetooth murni tidak didukung Safari.</div>}</div>
    <div className="receipt" style={{ width: `${mm}mm`, padding: `${rpad}mm`, fontSize: rfs }}>
      {branchLogoUrl ? <div className="r-center"><img src={branchLogoUrl} alt="" style={{ maxWidth: "100%", maxHeight: mm === 80 ? 24 : 18, objectFit: "contain", margin: "0 auto 4px" }} /></div> : <div className="r-center r-bold">TheSystem</div>}
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
{s.loyaltyPoints ? <div style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "50%", background: "#0D652D", color: "#fff", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.loyaltyPoints}</div> : null}
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
