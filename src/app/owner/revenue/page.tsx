import { prisma } from "@/lib/db"; import { ownerCtx, TZ } from "@/lib/owner"; import { resolveRange, type SP } from "@/lib/range"; import RangeFilter from "@/components/RangeFilter"; import BranchSel from "@/components/BranchSel"; import Tbl from "@/components/Tbl"; import { localParts, rp } from "@/lib/time";
export default async function Revenue({ searchParams: sp }: { searchParams: SP }) {
  await ownerCtx(); const { gte, lt } = resolveRange(sp, TZ), where = { status: "COMPLETED" as const, createdAt: { gte, lt }, ...(sp.branch && { branchId: sp.branch }) };
  const g = (by: any) => (prisma.transaction.groupBy as any)({ by: [by], where, _sum: { totalRp: true }, _count: true });
  const [byB, byC, byA, byS, rows, users, branches] = await Promise.all([g("branchId"), g("cashierId"), g("artistId"), g("serviceName"), prisma.transaction.findMany({ where, select: { createdAt: true, totalRp: true }, take: 20000 }),
    prisma.user.findMany({ select: { id: true, name: true } }), prisma.branch.findMany({ select: { id: true, name: true } })]);
  const nm = (id: string, l: { id: string; name: string }[]) => l.find((x) => x.id === id)?.name ?? id, days = Array.from({ length: Math.min(92, Math.round((+lt - +gte) / 86400000)) }, (_, i) => ({ k: localParts(new Date(+gte + i * 86400000), TZ).date, v: 0 }));
  for (const r of rows) { const d = days.find((x) => x.k === localParts(r.createdAt, TZ).date); if (d) d.v += r.totalRp; } const max = Math.max(1, ...days.map((d) => d.v));
  const T = (title: string, k: string, rs: any[], l?: any[]) => (<><h2 style={{ margin: "20px 0 8px" }}>{title}</h2><Tbl head={[title.replace("Pendapatan per ", ""), "Transaksi", "Pendapatan"]} rows={rs.sort((a, b) => b._sum.totalRp - a._sum.totalRp).map((r) => [l ? nm(r[k], l) : r[k], r._count, rp(r._sum.totalRp ?? 0)])} /></>);
  return (<><h1>Analisis Pendapatan</h1><RangeFilter sp={sp}><BranchSel sp={sp} /></RangeFilter>
    <div className="card"><h2>Pendapatan harian</h2><div className="bars">{days.map((d) => <i key={d.k} title={`${d.k}: ${rp(d.v)}`} style={{ height: Math.max(2, (d.v / max) * 100) + "%" }} />)}</div></div>
    {T("Pendapatan per cabang", "branchId", byB, branches)}{T("Pendapatan per kasir", "cashierId", byC, users)}{T("Pendapatan per barber", "artistId", byA, users)}{T("Pendapatan per layanan", "serviceName", byS)}</>);
}
