"use client";
import { useState } from "react";
export default function QrisField({ current }: { current?: string | null }) {
  const [val, setVal] = useState(current ?? "");
  const [msg, setMsg] = useState("");
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setMsg("Membaca QR...");
    try {
      if (!("BarcodeDetector" in window)) throw new Error("Browser tidak mendukung auto-decode. Tempel manual.");
      const BD = (window as any).BarcodeDetector;
      const det = new BD({ formats: ["qr_code"] });
      const bmp = await createImageBitmap(f);
      const res = await det.detect(bmp);
      if (!res?.length) throw new Error("QR tidak terbaca. Coba foto lebih jelas.");
      setVal(res[0].rawValue ?? "");
      setMsg("QR terbaca otomatis.");
    } catch (err: any) {
      setMsg(err?.message ?? "Gagal membaca QR.");
    }
  }
  return (
    <div style={{ display: "grid", gap: 6, flex: "1 1 100%", minWidth: 0 }}>
      <label style={{ display: "block" }}>QRIS Static (payload merchant)
        <textarea name="qrisStatic" className="field" style={{ margin: 0, minHeight: 60, fontFamily: "monospace", fontSize: 11 }} value={val} onChange={(e) => setVal(e.target.value)} placeholder="Upload gambar QR atau tempel payload 000201..." />
      </label>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="file" accept="image/*" onChange={onFile} />
        {msg && <small style={{ color: "var(--muted)" }}>{msg}</small>}
      </div>
    </div>
  );
}
