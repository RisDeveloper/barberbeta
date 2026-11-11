"use client";
import { useEffect } from "react";
export default function Error({ reset, error }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { (window as any).__showToast?.("err", error?.message || "Terjadi kesalahan"); }, [error]);
  return (<div className="center"><div className="card login" style={{ textAlign: "center" }}>
    <div className="brand" style={{ justifyContent: "center", padding: 0, marginBottom: 12 }}><span className="logo">B</span>TheSystem</div>
    <h1 style={{ fontSize: 20 }}>Terjadi kesalahan</h1>
    <p className="portal" style={{ margin: "0 0 16px" }}>Halaman tidak dapat dimuat. Coba lagi.</p>
    <button className="btn" onClick={reset}>Coba lagi</button>
    <a href="/" style={{ display: "block", marginTop: 12, fontSize: 13 }}>Kembali ke beranda</a>
  </div></div>);
}
