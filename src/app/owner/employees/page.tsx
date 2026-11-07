import { prisma } from "@/lib/db"; import { ownerCtx } from "@/lib/owner"; import type { SP } from "@/lib/range"; import BranchSel from "@/components/BranchSel"; import { F } from "@/components/F"; import Tbl from "@/components/Tbl"; import { createUser, updateUser, resetPin } from "../actions";
const RL: [string, string][] = [["ADMIN", "Admin"], ["CASHIER", "Kasir"], ["EMPLOYEE", "Barber"]];
export default async function Employees({ searchParams: sp }: { searchParams: SP }) {
  await ownerCtx(); const role = RL.find(([r]) => r === sp.role)?.[0] as any;
  const [bs, us] = await Promise.all([prisma.branch.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { deletedAt: null, role: role ?? { not: "OWNER" }, ...(sp.branch && { branchId: sp.branch }), ...(sp.q && { name: { contains: sp.q, mode: "insensitive" } }) }, include: { branch: true }, orderBy: [{ branchId: "asc" }, { name: "asc" }], take: 200 })]);
  const B = bs.map((b) => [b.id, b.name] as [string, string]);
  return (<><h1>Manajemen Karyawan</h1><div className="card" style={{ marginBottom: 16 }}><h2>Tambah karyawan</h2><form action={createUser} className="fr"><F l="Nama" n="name" r /><F l="Email" n="email" t="email" r /><F l="PIN (4-8 digit)" n="pin" t="password" r /><F l="Peran" n="role" o={RL} r /><F l="Cabang" n="branchId" o={B} r /><button className="btn s">Tambah</button></form></div>
    <form className="fr" style={{ marginBottom: 16 }}><F l="Cari nama" n="q" d={sp.q} /><F l="Peran" n="role" d={sp.role} o={[["", "Semua"], ...RL]} /><BranchSel sp={sp} /><button className="btn s">Saring</button></form>
    <Tbl head={["Nama", "Email", "Peran", "Cabang", "Status", "Kelola"]} rows={us.map((u) => [u.name, u.email, RL.find(([r]) => r === u.role)?.[1], u.branch?.name ?? "—", <span className={"pill " + (u.active ? "ok" : "mute")}>{u.active ? "Aktif" : "Nonaktif"}</span>,
      <details><summary>Ubah</summary><form action={updateUser} className="fr"><input type="hidden" name="id" value={u.id} /><F l="Nama" n="name" d={u.name} r /><F l="Peran" n="role" d={u.role} o={RL} /><F l="Cabang" n="branchId" d={u.branchId} o={B} /><label><input type="checkbox" name="active" defaultChecked={u.active} /> Aktif</label><button className="btn s">Simpan</button></form>
        <form action={resetPin} className="fr"><input type="hidden" name="id" value={u.id} /><F l="PIN baru" n="pin" t="password" r /><button className="btn s t">Reset PIN</button></form></details>])} />
    <div className="portal" style={{ margin: "8px 0 0" }}>Menyimpan perubahan akan mengeluarkan karyawan dari sesi. PIN disimpan dalam bentuk hash dan tidak pernah ditampilkan.</div></>);
}
