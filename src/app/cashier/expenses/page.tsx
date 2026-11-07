import { prisma } from "@/lib/db"; import { guard } from "@/lib/guard"; import { EXPENSE_CATS } from "@/lib/owner"; import Tbl from "@/components/Tbl"; import { dt, rp } from "@/lib/time"; import { ExpenseForm, KasbonForm } from "./forms";
export default async function Expenses() {
  const u = await guard("CASHIER"); const b = await prisma.branch.findUniqueOrThrow({ where: { id: u.branchId } });
  const [emps, recs] = await Promise.all([
    prisma.user.findMany({ where: { branchId: u.branchId, deletedAt: null, active: true, role: { not: "OWNER" } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.expenseRecord.findMany({ where: { branchId: u.branchId, voidedAt: null }, orderBy: { date: "desc" }, take: 50 }),
  ]);
  return (<><h1>Pengeluaran</h1>
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", marginBottom: 16 }}>
      <div className="card"><h2>Catat pengeluaran</h2><ExpenseForm cats={EXPENSE_CATS} /></div>
      <div className="card"><h2>Kasbon karyawan</h2><KasbonForm emps={emps.map((e) => [e.id, e.name])} /></div>
    </div>
    <h2>Riwayat pengeluaran & kasbon</h2>
    <Tbl head={["Tanggal", "Kategori", "Keterangan", "Jumlah"]} rows={recs.map((r) => [dt(r.date, b.timezone), r.category, r.description, rp(r.amountRp)])} />
  </>);
}
