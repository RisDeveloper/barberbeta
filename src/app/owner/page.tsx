import { prisma } from "@/lib/db"; import { ownerCtx, finance, TZ } from "@/lib/owner"; import { resolveRange, type SP } from "@/lib/range"; import RangeFilter from "@/components/RangeFilter"; import BranchSel from "@/components/BranchSel"; import { rp } from "@/lib/time";
export default async function Overview({ searchParams: sp }: { searchParams: SP }) {
  await ownerCtx(); const { gte, lt } = resolveRange(sp, TZ), branchId = sp.branch || undefined;
  const [f, branches, emps] = await Promise.all([finance(gte, lt, branchId), prisma.branch.count({ where: { active: true, deletedAt: null } }), prisma.user.count({ where: { active: true, deletedAt: null, role: { not: "OWNER" }, ...(branchId && { branchId }) } })]);
  const C: [string, string | number][] = [["Total pendapatan", rp(f.revenue)], ["Total transaksi", f.count], ["Cabang aktif", branches], ["Karyawan aktif", emps], ["Total komisi", rp(f.commission)], ["Pendapatan tambahan", rp(f.income)], ["Total pengeluaran", rp(f.expense)], ["Hasil operasional bersih", rp(f.net)]];
  return (<><h1>Ringkasan Bisnis</h1><RangeFilter sp={sp}><BranchSel sp={sp} /></RangeFilter><div className="grid stats">{C.map(([l, v]) => <div className="card stat" key={l}><small>{l}</small><b>{v}</b></div>)}</div></>);
}
