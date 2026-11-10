import { prisma } from "@/lib/db"; import { ownerCtx } from "@/lib/owner"; import type { SP } from "@/lib/range"; import BranchSel from "@/components/BranchSel"; import { F } from "@/components/F"; import Tbl from "@/components/Tbl"; import { rp } from "@/lib/time"; import { createUser, updateUser, resetPin, deleteUser } from "../actions";
const RL: [string, string][] = [["ADMIN", "Admin"], ["CASHIER", "Kasir"], ["EMPLOYEE", "Barber"]];
const hm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
export default async function Employees({ searchParams: sp }: { searchParams: SP }) {
  await ownerCtx(); const role = RL.find(([r]) => r === sp.role)?.[0] as any;
  const [bs, us, kasbonAgg, commAgg, payAgg] = await Promise.all([prisma.branch.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { deletedAt: null, role: role ?? { not: "OWNER" }, ...(sp.branch && { branchId: sp.branch }), ...(sp.q && { name: { contains: sp.q, mode: "insensitive" } }) }, include: { branch: true, shifts: { include: { shift: true } } }, orderBy: [{ branchId: "asc" }, { name: "asc" }], take: 200 }),
    prisma.expenseRecord.groupBy({ by: ["userId"], where: { voidedAt: null, category: "Kasbon", userId: { not: null } }, _sum: { amountRp: true } }),
    prisma.commission.groupBy({ by: ["userId"], where: { status: { not: "REVERSED" }, transaction: { status: "COMPLETED" } }, _sum: { amountRp: true } }),
    prisma.expenseRecord.groupBy({ by: ["userId", "category"], where: { voidedAt: null, category: { in: ["Insentif", "Bonus"] }, userId: { not: null } }, _sum: { amountRp: true } })]);
  const shifts = await prisma.shift.findMany({ where: { active: true }, include: { branch: { select: { name: true } } }, orderBy: [{ branch: { name: "asc" } }, { name: "asc" }] });
  const B = bs.map((b) => [b.id, b.name] as [string, string]);
  const kasbonOf = (id: string) => kasbonAgg.find((k) => k.userId === id)?._sum.amountRp ?? 0;
  const commOf = (id: string) => commAgg.find((c) => c.userId === id)?._sum.amountRp ?? 0;
  const insOf = (id: string) => payAgg.filter((p) => p.userId === id && p.category === "Insentif").reduce((a, p) => a + (p._sum.amountRp ?? 0), 0);
  const bonOf = (id: string) => payAgg.filter((p) => p.userId === id && p.category === "Bonus").reduce((a, p) => a + (p._sum.amountRp ?? 0), 0);
  const netOf = (id: string) => commOf(id) + insOf(id) + bonOf(id) - kasbonOf(id);
  return (<><h1>Manajemen Karyawan</h1><div className="card" style={{ marginBottom: 16 }}><h2>Tambah karyawan</h2><form action={createUser} className="fr"><F l="Nama" n="name" r /><F l="Email" n="email" t="email" r /><F l="PIN (4-8 digit)" n="pin" t="password" r /><F l="Peran" n="role" o={RL} r /><F l="Cabang" n="branchId" o={B} r />
  <F l="Awal shift (kosong = ikut cabang/shift)" n="shiftStart" t="time" /><F l="Jam selesai (kosong = ikut cabang/shift)" n="shiftEnd" t="time" /><F l="Toleransi terlambat (menit, kosong = ikut cabang)" n="lateGraceMin" t="number" /><F l="Uang makan per shift (Rp)" n="mealAllowanceRp" t="number" />
  <div style={{ flex: "1 1 100%" }}><div style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 8px" }}>Shift yang dijalankan (override)</div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
    {shifts.map((sh: any) => (<label key={sh.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}><input type="checkbox" name={`shift_${sh.id}`} /> {sh.branch?.name} - {sh.name} ({String(Math.floor(sh.startMin/60)).padStart(2,"0")}:{String(sh.startMin%60).padStart(2,"0")}-{String(Math.floor(sh.endMin/60)).padStart(2,"0")}:{String(sh.endMin%60).padStart(2,"0")})</label>))}</div></div>
  <div style={{ flex: "1 1 100%" }}><div style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 8px" }}>Hari kerja</div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
    {["Min","Sen","Sel","Rab","Kam","Jum","Sab"].map((d, i) => (<label key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}><input type="checkbox" name={`wd_${i}`} defaultChecked /> {d}</label>))}</div></div>
  <button className="btn s">Tambah</button></form></div>
    <form className="fr" style={{ marginBottom: 16 }}><F l="Cari nama" n="q" d={sp.q} /><F l="Peran" n="role" d={sp.role} o={[["", "Semua"], ...RL]} /><BranchSel sp={sp} /><button className="btn s">Saring</button></form>
    <Tbl head={["Nama", "Email", "Peran", "Cabang", "Kasbon", "Bersih", "Status", "Kelola"]} rows={us.map((u) => [u.name, u.email, RL.find(([r]) => r === u.role)?.[1], u.branch?.name ?? "—", rp(kasbonOf(u.id)), rp(netOf(u.id)), <span className={"pill " + (u.active ? "ok" : "mute")}>{u.active ? "Aktif" : "Nonaktif"}</span>,
      <><details><summary>Ubah</summary><form action={updateUser} className="fr"><input type="hidden" name="id" value={u.id} /><F l="Nama" n="name" d={u.name} r /><F l="Peran" n="role" d={u.role} o={RL} /><F l="Cabang" n="branchId" d={u.branchId} o={B} />  <F l="Awal shift (kosong = ikut cabang/shift)" n="shiftStart" t="time" d={u.shiftStartMin != null ? hm(u.shiftStartMin) : undefined} /><F l="Jam selesai (kosong = ikut cabang/shift)" n="shiftEnd" t="time" d={u.shiftEndMin != null ? hm(u.shiftEndMin) : undefined} /><F l="Toleransi terlambat (menit, kosong = ikut cabang)" n="lateGraceMin" t="number" d={u.lateGraceMin ?? undefined} /><F l="Uang makan per shift (Rp)" n="mealAllowanceRp" t="number" d={u.mealAllowanceRp ?? 0} />
  <div style={{ flex: "1 1 100%" }}><div style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 8px" }}>Shift yang dijalankan (override)</div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
    {shifts.map((sh: any) => {
      const assigned = (u.shifts ?? []).some((us: any) => us.shiftId === sh.id);
      return (<label key={sh.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}><input type="checkbox" name={`shift_${sh.id}`} defaultChecked={assigned} /> {sh.branch?.name} - {sh.name} ({String(Math.floor(sh.startMin/60)).padStart(2,"0")}:{String(sh.startMin%60).padStart(2,"0")}-{String(Math.floor(sh.endMin/60)).padStart(2,"0")}:{String(sh.endMin%60).padStart(2,"0")})</label>);
    })}</div></div>
  <div style={{ flex: "1 1 100%" }}><div style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 8px" }}>Hari kerja</div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
    {["Min","Sen","Sel","Rab","Kam","Jum","Sab"].map((d, i) => {
      const wd = (u.workDays ?? "0,1,2,3,4,5,6").split(",").map((x: string) => parseInt(x.trim(), 10));
      return (<label key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}><input type="checkbox" name={`wd_${i}`} defaultChecked={wd.includes(i)} /> {d}</label>);
    })}</div></div>
  <label><input type="checkbox" name="active" defaultChecked={u.active} /> Aktif</label><button className="btn s">Simpan</button></form>
        <form action={resetPin} className="fr"><input type="hidden" name="id" value={u.id} /><F l="PIN baru" n="pin" t="password" r /><button className="btn s t">Reset PIN</button></form></details><details><summary className="danger">Hapus</summary><form action={deleteUser}><input type="hidden" name="id" value={u.id} /><div style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 8px" }}>Yakin hapus karyawan ini? Riwayat transaksi tetap tersimpan.</div><button className="btn s danger">Hapus karyawan</button></form></details></>])} />
    <div className="portal" style={{ margin: "8px 0 0" }}>Menyimpan perubahan akan mengeluarkan karyawan dari sesi. PIN disimpan dalam bentuk hash dan tidak pernah ditampilkan.</div></>);
}
