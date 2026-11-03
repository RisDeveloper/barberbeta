import { prisma } from "@/lib/db"; import { ctx } from "@/lib/admin"; import { startOfLocalDay, startOfLocalWeek, startOfLocalMonth, rp } from "@/lib/time";
export default async function Overview() {
  const { tz, branchId } = await ctx();
  const agg = (gte: Date) => prisma.transaction.aggregate({ where: { branchId, status: "COMPLETED", createdAt: { gte } }, _sum: { totalRp: true }, _count: true });
  const [d, w, m] = await Promise.all([agg(startOfLocalDay(tz)), agg(startOfLocalWeek(tz)), agg(startOfLocalMonth(tz))]);
  const dayRev = d._sum.totalRp ?? 0;
  return (<><h1>Ringkasan</h1><div className="grid stats">
    <div className="card stat"><small>Pendapatan harian</small><b>{rp(dayRev)}</b></div><div className="card stat"><small>Pendapatan mingguan</small><b>{rp(w._sum.totalRp ?? 0)}</b></div>
    <div className="card stat"><small>Pendapatan bulanan</small><b>{rp(m._sum.totalRp ?? 0)}</b></div><div className="card stat"><small>Transaksi hari ini</small><b>{d._count}</b></div>
    <div className="card stat"><small>Rata-rata transaksi (hari ini)</small><b>{rp(d._count ? Math.floor(dayRev / d._count) : 0)}</b></div><div className="card stat"><small>Layanan cukur selesai (hari ini)</small><b>{d._count}</b></div></div></>);
}
