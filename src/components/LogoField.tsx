"use client";
import { useRef, useState } from "react";
const MAX = 400_000; // ~300 KB data URL, keeps server action body small
export default function LogoField({ current, name = "logo" }: { current?: string | null; name?: string }) {
  const [val, setVal] = useState(current ?? ""), [err, setErr] = useState("");
  const input = useRef<HTMLInputElement>(null);
  async function pick(file: File) {
    setErr("");
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return setErr("Format harus PNG, JPG, atau WebP");
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; });
      const c = document.createElement("canvas"); c.width = c.height = 192;
      const s = Math.min(img.width, img.height);
      const x = c.getContext("2d")!;
      x.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 192, 192);
      const data = c.toDataURL("image/png");
      if (data.length > MAX) return setErr("Gambar terlalu besar, pakai file lain");
      setVal(data);
    } catch { setErr("Gagal membaca gambar"); } finally { URL.revokeObjectURL(url); }
  }
  const reset = () => { setVal(""); setErr(""); if (input.current) input.current.value = ""; };
  return (<div className="logoField">
    <input type="hidden" name={name} value={val} />
    <span className="logo">{val ? <img src={val} alt="Logo cabang" /> : "B"}</span>
    <div className="logoPick">
      <div className="logoBtns">
        <button type="button" className="btn s t" onClick={() => input.current?.click()}>{val ? "Ganti logo" : "Pilih logo"}</button>
        {val && <button type="button" className="linkBtn" onClick={reset}>Hapus</button>}
      </div>
      <small className={err ? "err" : undefined} role={err ? "alert" : undefined}>{err || "PNG, JPG, atau WebP · otomatis dipotong persegi"}</small>
      <input ref={input} type="file" hidden accept="image/png,image/jpeg,image/webp" aria-label="Pilih file logo"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); }} />
    </div>
  </div>);
}
