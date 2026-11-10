import { prisma } from "@/lib/db"; import { ownerCtx } from "@/lib/owner"; import type { SP } from "@/lib/range"; import BranchSel from "@/components/BranchSel"; import { F } from "@/components/F"; import Tbl from "@/components/Tbl"; import { rp } from "@/lib/time"; import { createUser, updateUser, resetPin, deleteUser } from "../actions";
const RL: [string, string][] = [["ADMIN", "Admin"], ["CASHIER", "Kasir"], ["EMPLOYEE", "Barber"]];
const hm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
export default async function Employees({ searchParams: sp }: { searchParams: SP }) {
  await ownerCtx(); const role = RL.find(([r]) => r === sp.role)?.[0] as any;
  const [bs, us, kasbonAgg, commAgg, payAgg, shifts] = await Promise.all([prisma.branch.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { deletedAt: null, role: role ?? { not: "OWNER" }, ...(sp.branch && { branchId: sp.branch }), ...(sp.q && { name: { contains: sp.q, mode: "insensitive" } }) }, include: { branch: true }, orderBy: [{ branchId: "asc" }, { name: "asc" }], take: 200 }),
    prisma.expenseRecord.groupBy({ by: ["userId"], where: { voidedAt: null, category: "Kasbon", userId: { not: null } }, _sum: { amountRp: true } }),
    prisma.commission.groupBy({ by: ["userId"], where: { status: { not: "REVERSED" }, transaction: { status: "COMPLETED" } }, _sum: { amountRp: true } }),
    prisma.expenseRecord.groupBy({ by: ["userId", "category"], where: { voidedAt: null, category: { in: ["Insentif", "Bonus"] }, userId: { not: null } }, _sum: { amountRp: true } }),
    prisma.shift.findMany({ where: { active: true }, include: { branch: { select: { name: true } } }, orderBy: [{ branch: { name: "asc" } }, { name: "asc" }] })]);
  const B = bs.map((b) => [b.id, b.name] as [string, string]);
  const kasbonOf = (id: string) => kasbonAgg.find((k) => k.userId === id)?._sum.amountRp ?? 0;
  const commOf = (id: string) => commAgg.find((c) => c.userId === id)?._sum.amountRp ?? 0;
  const insOf = (id: string) => payAgg.filter((p) => p.userId === id && p.category === "Insentif").reduce((a, p) => a + (p._sum.amountRp ?? 0), 0);
  const bonOf = (id: string) => payAgg.filter((p) => p.userId === id && p.category === "Bonus").reduce((a, p) => a + (p._sum.amountRp ?? 0), 0);
  const netOf = (id: string) => commOf(id) + insOf(id) + bonOf(id) - kasbonOf(id);
  return (<><h1>Manajemen Karyawan</h1><div className="card" style={{ marginBottom: 16 }}><h2>Tambah karyawan</h2><form action={createUser} className="fr"><F l="Nama" n="name" r /><F l="Email" n="email" t="email" r /><F l="PIN (4-8 digit)" n="pin" t="password" r /><F l="Peran" n="role" o={RL} r /><F l="Cabang" n="branchId" o={B} r />
    <div style={{ flex: "1 1 100%" }}><div style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 8px" }}>Jadwal shift per hari (klik hari untuk atur)</div>
    {["Min","Sen","Sel","Rab","Kam","Jum","Sab"].map((d, i) => (
      <details key={i} style={{ flex: "1 1 100%", marginBottom: 6, border: "1px solid #DADCE0", borderRadius: 8, padding: "4px 8px" }}>
        <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 600, listStyle: "none" }}>{d} — Libur</summary>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
          <label className="shiftBtn"><input type="radio" name={`day_${i}`} value="" defaultChecked style={{ cursor: "pointer" }} /> Libur</label>
          {shifts.map((sh: any) => (
            <label key={sh.id} className="shiftBtn"><input type="radio" name={`day_${i}`} value={sh.id} style={{ cursor: "pointer" }} /> {sh.name}</label>
          ))}
          <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 8 }}>Jam masuk</span>
          <input name={`day_${i}_in`} type="time" className="field" style={{ margin: 0, width: 100, flex: "0 0 100px" }} />
          <span style={{ fontSize: 12, color: "var(--muted)" }}>Jam keluar</span>
          <input name={`day_${i}_out`} type="time" className="field" style={{ margin: 0, width: 100, flex: "0 0 100px" }} />
        </div>
      </details>
    ))}
  </div>
  <button className="btn s">Tambah</button></form></div>
    <form className="fr" style={{ marginBottom: 16 }}><F l="Cari nama" n="q" d={sp.q} /><F l="Peran" n="role" d={sp.role} o={[["", "Semua"], ...RL]} /><BranchSel sp={sp} /><button className="btn s">Saring</button></form>
    <Tbl head={["Nama", "Email", "Peran", "Cabang", "Kasbon", "Bersih", "Status", "Kelola"]} rows={us.map((u) => [u.name, u.email, RL.find(([r]) => r === u.role)?.[1], u.branch?.name ?? "—", rp(kasbonOf(u.id)), rp(netOf(u.id)), <span className={"pill " + (u.active ? "ok" : "mute")}>{u.active ? "Aktif" : "Nonaktif"}</span>,
      <><details><summary>Ubah</summary><form action={updateUser} className="fr"><input type="hidden" name="id" value={u.id} /><F l="Nama" n="name" d={u.name} r /><F l="Peran" n="role" d={u.role} o={RL} /><F l="Cabang" n="branchId" d={u.branchId} o={B} />    <div style={{ flex: "1 1 100%" }}><div style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 8px" }}>Jadwal shift per hari (pilih shift per hari, kosong = libur)</div>
    {["Min","Sen","Sel","Rab","Kam","Jum","Sab"].map((d, i) => {
      const sched = (u.shiftSchedule && typeof u.shiftSchedule === "object") ? u.shiftSchedule as Record<string, any> : {};
      const entry = sched[String(i)];
      const cur = (entry && typeof entry === "object") ? (entry.shift ?? entry.shiftId ?? "") : (typeof entry === "string" ? entry : "");
      const selShift = shifts.find((sh: any) => sh.id === cur);
      const inVal = (entry && typeof entry === "object" && entry.in) ? entry.in : (entry && typeof entry === "object" && entry.startMin != null ? `${String(Math.floor(entry.startMin/60)).padStart(2,"0")}:${String(entry.startMin%60).padStart(2,"0")}` : "");
      const outVal = (entry && typeof entry === "object" && entry.out) ? entry.out : (entry && typeof entry === "object" && entry.endMin != null ? `${String(Math.floor(entry.endMin/60)).padStart(2,"0")}:${String(entry.endMin%60).padStart(2,"0")}` : "");
      const summary = cur === "" ? "Libur" : (selShift ? `${selShift.name} (${inVal || String(Math.floor(selShift.startMin/60)).padStart(2,"0")+":"+String(selShift.startMin%60).padStart(2,"0")} - ${outVal || String(Math.floor(selShift.endMin/60)).padStart(2,"0")+":"+String(selShift.endMin%60).padStart(2,"0")})` : "Shift");
      return (
        <details key={i} style={{ flex: "1 1 100%", marginBottom: 6, border: "1px solid #DADCE0", borderRadius: 8, padding: "4px 8px" }}>
          <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 600, listStyle: "none" }}>{d} — {summary}</summary>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
            <label className="shiftBtn"><input type="radio" name={`day_${i}`} value="" defaultChecked={cur === ""} style={{ cursor: "pointer" }} /> Libur</label>
            {shifts.map((sh: any) => (
              <label key={sh.id} className="shiftBtn"><input type="radio" name={`day_${i}`} value={sh.id} defaultChecked={cur === sh.id} style={{ cursor: "pointer" }} /> {sh.name}</label>
            ))}
            <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 8 }}>Jam masuk</span>
            <input name={`day_${i}_in`} type="time" className="field" style={{ margin: 0, width: 100, flex: "0 0 100px" }} defaultValue={inVal} />
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Jam keluar</span>
            <input name={`day_${i}_out`} type="time" className="field" style={{ margin: 0, width: 100, flex: "0 0 100px" }} defaultValue={outVal} />
          </div>
        </details>
      );
    })}
  </div>
  <label><input type="checkbox" name="active" defaultChecked={u.active} /> Aktif</label><button className="btn s">Simpan</button></form>
        <form action={resetPin} className="fr"><input type="hidden" name="id" value={u.id} /><F l="PIN baru" n="pin" t="password" r /><button className="btn s t">Reset PIN</button></form></details><details><summary className="danger">Hapus</summary><form action={deleteUser}><input type="hidden" name="id" value={u.id} /><div style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 8px" }}>Yakin hapus karyawan ini? Riwayat transaksi tetap tersimpan.</div><button className="btn s danger">Hapus karyawan</button></form></details></>])} />
    <div className="portal" style={{ margin: "8px 0 0" }}>Menyimpan perubahan akan mengeluarkan karyawan dari sesi. PIN disimpan dalam bentuk hash dan tidak pernah ditampilkan.</div></>);
}
