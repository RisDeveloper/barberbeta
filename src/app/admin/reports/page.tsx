import { prisma } from "@/lib/db"; import { ctx } from "@/lib/admin"; import { resolveRange, qs, type SP } from "@/lib/range"; import RangeFilter from "@/components/RangeFilter"; import { rp } from "@/lib/time";
export default async function Reports({ searchParams: sp }: { searchParams: SP }) {
  const { tz, branchId } = await ctx(); const { gte, lt } = resolveRange(sp, tz);
  const [t, c] = await Promise.all([prisma.transaction.aggregate({ where: { branchId, status: "COMPLETED", createdAt: { gte, lt } }, _sum: { totalRp: true }, _count: true }),
    prisma.commission.aggregate({ where: { status: { not: "REVERSED" }, transaction: { branchId, status: "COMPLETED", createdAt: { gte, lt } } }, _sum: { amountRp: true } })]);
  return (<><h1>Laporan</h1><RangeFilter sp={sp} />
    <div className="grid stats"><div className="card stat"><small>Pendapatan</small><b>{rp(t._sum.totalRp ?? 0)}</b></div><div className="card stat"><small>Transaksi</small><b>{t._count}</b></div><div className="card stat"><small>Komisi</small><b>{rp(c._sum.amountRp ?? 0)}</b></div></div>
    <div className="card" style={{ marginTop: 16 }}><h2>Unduh CSV (periode terpilih)</h2><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {([["transactions", "Transaksi"], ["attendance", "Absensi"], ["commissions", "Komisi"]] as const).map(([k, l]) => <a key={k} className="btn t" style={{ width: "auto", display: "inline-grid", placeItems: "center", textDecoration: "none" }} href={"/api/admin/export" + qs({ range: sp.range ?? "month", from: sp.from, to: sp.to }, { type: k })}>{l}</a>)}</div>
      <div className="portal" style={{ margin: "10px 0 0" }}>Ekspor PDF belum tersedia.</div></div></>);
}
