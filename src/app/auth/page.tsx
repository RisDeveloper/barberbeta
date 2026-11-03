"use client";
import { useState } from "react";
export default function Login() {
  const [email, setEmail] = useState(""), [pin, setPin] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, pin }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return setErr(d.error ?? "Gagal masuk");
      window.location.href = d.redirectTo ?? "/";
    } catch {
      setErr("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }
  return (<div className="center"><form className="card login" onSubmit={submit}>
    <div className="brand" style={{ padding: 0, marginBottom: 18 }}><span className="logo">B</span>BarberStory</div>
    <label htmlFor="e">Email</label><input id="e" className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
    <label htmlFor="p">PIN</label><input id="p" className="field" type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} required />
    {err && <div className="err" role="alert">{err}</div>}
    <button className="btn" disabled={busy}>{busy ? "Sedang masuk…" : "Masuk"}</button></form></div>);
}
