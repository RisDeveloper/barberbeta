import { guard } from "@/lib/guard"; import { prisma } from "@/lib/db"; import { startOfLocalDay, rp } from "@/lib/time";
export default async function Dashboard() {
  const u = await guard("CASHIER"); const b = await prisma.branch.findUniqueOrThrow({ where: { id: u.branchId } });
  const where = { branchId: u.branchId, cashierId: u.id, status: "COMPLETED" as const, createdAt: { gte: startOfLocalDay(b.timezone) } };
  const a = await prisma.transaction.aggregate({ where, _sum: { totalRp: true }, _count: true });
  return (<><h1>Dasbor</h1><div className="grid stats">
    <div className="card stat"><small>Pendapatan hari ini</small><b>{rp(a._sum.totalRp ?? 0)}</b></div>
    <div className="card stat"><small>Transaksi / cukur selesai</small><b>{a._count}</b></div>
    <div className="card stat"><small>Cabang</small><b>{b.name}</b></div></div></>);
}
