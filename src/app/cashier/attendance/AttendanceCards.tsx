"use client";
import { useEffect, useState } from "react";
type E = { id: string; name: string; email: string; state: string; inAt: string | null; outAt: string | null };
type R = { name: string; branch: string; state: string; notice: string; status?: string; checkInAt: string; checkOutAt: string | null; mealAllowanceRp?: number };
const clean = (n: string) => n.replace(/^\[.*?\]\s*/, "").trim() || n;
const initial = (n: string) => (clean(n)[0] ?? "B").toUpperCase();
export default function AttendanceCards({ employees, tz = "Asia/Jakarta" }: { employees: E[]; tz?: string }) {
  const hm = (s: string | null) => (s ? new Date(s).toLocaleTimeString("id-ID", { timeZone: tz, hour: "2-digit", minute: "2-digit" }) : "—");
  const [sel, setSel] = useState<E | null>(null), [pin, setPin] = useState(""), [busy, setBusy] = useState(false);
  const [err, setErr] = useState(""), [res, setRes] = useState<R | null>(null);
  const [overrides, setOverrides] = useState<Record<string, { state: string; inAt: string | null; outAt: string | null }>>({});
  const close = () => { const hadRes = !!res; setSel(null); setPin(""); setErr(""); setRes(null); if (hadRes) window.location.href = "/cashier/attendance?_=" + Date.now(); };
  useEffect(() => {
    if (!sel) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [sel]);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!sel || busy) return; setBusy(true); setErr("");
    const r = await fetch("/api/attendance/cashier", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: sel.email, pin }) });
    const d = await r.json(); setBusy(false);
    if (!r.ok) return setErr(d.error ?? "Gagal");
    const st = d.status === "LATE" ? "Terlambat" : "Hadir";
    setOverrides((prev) => ({ ...prev, [sel.id]: { state: st, inAt: d.checkInAt, outAt: null } }));
    setRes(d); setPin("");
  }
  async function doCheckout(emp: E) {
    if (busy) return; setBusy(true); setErr("");
    try {
      const r = await fetch("/api/attendance/cashier", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emp.email }) });
      const d = await r.json(); setBusy(false);
      if (!r.ok) {
        if ((d.error ?? "").toLowerCase().includes("pin")) { setSel(emp); setPin(""); setErr(""); setRes(null); return; }
        setSel(emp); setErr(d.error ?? "Gagal"); return;
      }
      window.location.href = "/cashier/attendance?_=" + Date.now();
    } catch { setBusy(false); setSel(emp); setErr("Gagal"); }
  }
  const done = (overrides[sel?.id ?? ""]?.state ?? sel?.state) === "Selesai";
  const out = !!(overrides[sel?.id ?? ""]?.state ?? sel?.state) && !done;
  const isCheckedIn = (overrides[sel?.id ?? ""]?.state ?? sel?.state) === "Hadir" || (overrides[sel?.id ?? ""]?.state ?? sel?.state) === "Terlambat";
  return (<>
    <div className="attPeople">{employees.map((e) => {
      const o = overrides[e.id], state = o?.state ?? e.state, inAt = o?.inAt ?? e.inAt, outAt = o?.outAt ?? e.outAt;
      return (<button key={e.id} type="button" className={"attPCard" + (state ? " done" : "")} disabled={busy} onClick={() => { if (busy) return; setSel(e); setPin(""); setErr(""); setRes(null); }}>
        <span className="attPAvatar">{initial(e.name)}</span>
        <b className="attPName">{clean(e.name)}</b>
        {inAt && <span className="attPTime">Masuk {hm(inAt)}{outAt ? " - Pulang " + hm(outAt) : ""}</span>}
        <span className={"pill " + (!state ? "mute" : state === "Terlambat" ? "late" : "ok")}>{state || "Belum absen"}</span>
      </button>);
    })}</div>
    {!employees.length && <div className="card">Belum ada karyawan di cabang ini.</div>}
    {sel && (<div className="attModal" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="attModalCard">
        {res ? (<>
          <div style={{ background: "var(--ok-bg, #C4EED0)", color: "var(--ok-fg, #0D652D)", borderRadius: 16, padding: 16 }}>
            <h2 style={{ margin: 0, color: "inherit" }}>{res.name}</h2>
            <div style={{ fontSize: 20, fontWeight: 600, marginTop: 6 }}>{res.state}</div>
            <div>{res.notice}</div>
            <div className="row" style={{ marginTop: 8 }}><span>Masuk</span><b>{hm(res.checkInAt)}</b></div>
            <div className="row"><span>Keluar</span><b>{hm(res.checkOutAt)}</b></div>
            <div className="row"><span>Uang makan</span><b>{res.mealAllowanceRp ? "Rp" + res.mealAllowanceRp.toLocaleString("id-ID") : (res.status === "LATE" ? "Hangus (terlambat)" : "Rp0")}</b></div>
          </div>
          <button className="btn" style={{ marginTop: 12 }} onClick={close}>Selesai</button>
        </>) : isCheckedIn ? (<>
          <div className="attPHead"><span className="attPAvatar">{initial(sel.name)}</span><div><b>{clean(sel.name)}</b>
            <div className="attPSub">Klik tombol untuk absen pulang</div></div></div>
          <div style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
            <button type="button" onClick={() => doCheckout(sel)} disabled={busy}
              style={{ width: 120, height: 120, borderRadius: "50%", border: 0, background: busy ? "#FFF3C4" : "#FED950", color: busy ? "#7A5C00" : "#202124", fontSize: 16, fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", userSelect: "none" }}>
              {busy ? "..." : "Pulang"}
            </button>
          </div>
          {err && <div className="err" role="alert">{err}</div>}
          <button type="button" className="btn t" onClick={close}>Batal</button>
        </>) : done ? (<>
          <div className="row"><span>Masuk</span><b>{hm(sel.inAt)}</b></div>
          <div className="row"><span>Keluar</span><b>{hm(sel.outAt)}</b></div>
          <button className="btn" style={{ marginTop: 12 }} onClick={close}>Tutup</button>
        </>) : (<form onSubmit={submit}>
          <label htmlFor="pin">PIN (4-8 digit)</label>
          <input id="pin" className="field" type="password" inputMode="numeric" autoComplete="off" autoFocus value={pin}
            onChange={(ev) => setPin(ev.target.value.replace(/\D/g, "").slice(0, 8))} />
          {err && <div className="err" role="alert">{err}</div>}
          <button className="btn" disabled={busy || pin.length < 4}>{busy ? "Memproses..." : "Absen masuk"}</button>
          <button type="button" className="btn t" style={{ marginTop: 8 }} onClick={close}>Batal</button>
        </form>)}
      </div>
    </div>)}
  </>);
}
