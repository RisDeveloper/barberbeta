"use client";
import { useEffect, useRef, useState } from "react";

type Result = { name: string; discountRp: number; member: string; code: string };
const rp = (n: number) => "Rp" + n.toLocaleString("id-ID");

export default function VoucherScanner() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [cam, setCam] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>();

  async function submit(raw?: string) {
    const c = (raw ?? code).trim().toUpperCase();
    if (!c) return;
    setBusy(true); setErr(""); setResult(null);
    const r = await fetch("/api/cashier/voucher", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: c }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(d.error ?? "Gagal"); return; }
    setResult(d); setCode(""); stopCam();
  }

  function stopCam() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null; setCam(false);
  }

  async function startCam() {
    setErr("");
    const BD = (window as any).BarcodeDetector;
    if (!BD) { setErr("Kamera scanning tidak didukung browser ini. Pakai scanner USB/Bluetooth atau ketik kode."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream; setCam(true);
      await new Promise((res) => setTimeout(res, 50));
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      const detector = new BD({ formats: ["qr_code"] });
      const tick = async () => {
        if (!streamRef.current || !videoRef.current) return;
        try {
          const found = await detector.detect(videoRef.current);
          if (found?.length) { await submit(found[0].rawValue); return; }
        } catch {}
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e: any) { setErr("Tidak bisa membuka kamera: " + (e?.message ?? "ditolak")); }
  }

  useEffect(() => () => stopCam(), []);

  return (<div className="card" style={{ maxWidth: 520 }}>
    <h2>Tukar Voucher</h2>
    <p className="portal" style={{ marginBottom: 12 }}>Scan QR voucher member atau masukkan kodenya.</p>
    <label htmlFor="vc">Kode voucher</label>
    <input id="vc" className="field" value={code} onChange={(e) => setCode(e.target.value)} placeholder="TS-XXXXXX" autoFocus
      onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
      <button className="btn" disabled={busy} onClick={() => submit()}>{busy ? "Memeriksa…" : "Tukar"}</button>
      {!cam && <button className="btn t" type="button" onClick={startCam}>Scan kamera</button>}
    </div>
    {cam && <div style={{ marginTop: 12 }}><video ref={videoRef} playsInline muted style={{ width: "100%", borderRadius: 12 }} /><button className="btn t" style={{ marginTop: 8 }} onClick={stopCam}>Stop kamera</button></div>}
    {err && <div className="err" role="alert">{err}</div>}
    {result && (<div style={{ background: "var(--ok-bg, #C4EED0)", color: "var(--ok-fg, #0D652D)", borderRadius: 16, padding: "14px 16px", marginTop: 12 }}>
      <small>Voucher valid</small>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{result.name}</div>
      <div className="row"><span>Member</span><b>{result.member}</b></div>
      <div className="row"><span>Diskon</span><b>{rp(result.discountRp)}</b></div>
    </div>)}
  </div>);
}
