"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
type E = { id: string; name: string; email: string; state: string };
type R = { name: string; branch: string; state: string; notice: string; checkInAt: string; checkOutAt: string | null };
const clean = (n: string) => n.replace(/^\[.*?\]\s*/, "").trim() || n;
const initial = (n: string) => (clean(n)[0] ?? "B").toUpperCase();
export default function AttendanceCards({ employees }: { employees: E[] }) {
  const router = useRouter();
  const [sel, setSel] = useState<E | null>(null), [pin, setPin] = useState(""), [busy, setBusy] = useState(false);
  const [err, setErr] = useState(""), [res, setRes] = useState<R | null>(null);
  const close = () => { setSel(null); setPin(""); setErr(""); setRes(null); };
  useEffect(() => {
    if (!sel) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [sel]);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!sel) return; setBusy(true); setErr("");
    const r = await fetch("/api/attendance/cashier", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: sel.email, pin }) });
    const d = await r.json(); setBusy(false);
    if (!r.ok) return setErr(d.error ?? "Gagal");
    setRes(d); setPin(""); router.refresh();
  }
  const t = (s: string | null) => (s ? new Date(s).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—");
  return (<>
    <div className="attPeople">{employees.map((e) => (
      <button key={e.id} type="button" className={"attPCard" + (e.state ? " done" : "")} onClick={() => { setSel(e); setPin(""); setErr(""); setRes(null); }}>
        <span className="attPAvatar">{initial(e.name)}</span>
        <b className="attPName">{clean(e.name)}</b>
        <span className={"pill " + (!e.state ? "mute" : e.state === "Terlambat" ? "late" : "ok")}>{e.state || "Belum absen"}</span>
      </button>))}</div>
    {!employees.length && <div className="card">Belum ada karyawan di cabang ini.</div>}
    {sel && (<div className="attModal" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="attModalCard">
        {!res ? (<form onSubmit={submit}>
          <div className="attPHead"><span className="attPAvatar">{initial(sel.name)}</span><div><b>{clean(sel.name)}</b><div className="portal">Masukkan PIN untuk absen</div></div></div>
          <label htmlFor="pin">PIN (4–8 digit)</label>
          <input id="pin" className="field" type="password" inputMode="numeric" autoComplete="off" autoFocus value={pin}
            onChange={(ev) => setPin(ev.target.value.replace(/\D/g, "").slice(0, 8))} />
          {err && <div className="err" role="alert">{err}</div>}
          <button className="btn" disabled={busy || pin.length < 4}>{busy ? "Memproses…" : "Absen"}</button>
          <button type="button" className="btn t" style={{ marginTop: 8 }} onClick={close}>Batal</button>
        </form>) : (<>
          <div style={{ background: "#C4EED0", color: "#0D652D", borderRadius: 16, padding: 16 }}>
            <h2 style={{ margin: 0, color: "inherit" }}>{res.name}</h2>
            <div style={{ fontSize: 20, fontWeight: 600, marginTop: 6 }}>{res.state}</div>
            <div>{res.notice}</div>
            <div className="row" style={{ marginTop: 8 }}><span>Masuk</span><b>{t(res.checkInAt)}</b></div>
            <div className="row"><span>Keluar</span><b>{t(res.checkOutAt)}</b></div>
          </div>
          <button className="btn" style={{ marginTop: 12 }} onClick={close}>Selesai</button>
        </>)}
      </div>
    </div>)}
  </>);
}
