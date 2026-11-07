import { guard } from "@/lib/guard"; import { prisma } from "@/lib/db"; import { startOfLocalDay, startOfLocalWeek, startOfLocalMonth, rp } from "@/lib/time";
import type { SP } from "@/lib/range";
const P = [["day", "Harian"], ["week", "Mingguan"], ["month", "Bulanan"]] as const;
export default async function Dashboard({ searchParams: sp }: { searchParams: SP }) {
  const u = await guard("CASHIER"); const b = await prisma.branch.findUniqueOrThrow({ where: { id: u.branchId } });
  const p = P.find(([k]) => k === sp.p)?.[0] ?? "day", label = P.find(([k]) => k === p)![1].toLowerCase();
  const start = p === "week" ? startOfLocalWeek(b.timezone) : p === "month" ? startOfLocalMonth(b.timezone) : startOfLocalDay(b.timezone);
  const where = { branchId: u.branchId, cashierId: u.id, status: "COMPLETED" as const, createdAt: { gte: start } };
  const a = await prisma.transaction.aggregate({ where, _sum: { totalRp: true }, _count: true });
  return (<><h1>Dasbor</h1>
    <form style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
      {P.map(([k, l]) => <button key={k} name="p" value={k} className={"btn s" + (p === k ? "" : " t")}>{l}</button>)}
    </form>
    <div className="grid stats">
    <div className="card stat"><small>Pendapatan {label}</small><b>{rp(a._sum.totalRp ?? 0)}</b></div>
    <div className="card stat"><small>Transaksi {label}</small><b>{a._count}</b></div>
    <div className="card stat"><small>Cabang</small><b>{b.name}</b></div></div></>);
}
