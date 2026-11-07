import { guard } from "@/lib/guard"; import { prisma } from "@/lib/db"; import { startOfLocalDay, startOfLocalWeek, startOfLocalMonth, dayStart, validDate, rp } from "@/lib/time";
import type { SP } from "@/lib/range";
const P = [["day", "Harian"], ["week", "Mingguan"], ["month", "Bulanan"], ["custom", "Rentang"]] as const;
export default async function Dashboard({ searchParams: sp }: { searchParams: SP }) {
  const u = await guard("CASHIER"); const b = await prisma.branch.findUniqueOrThrow({ where: { id: u.branchId } });
  const p = P.find(([k]) => k === sp.p)?.[0] ?? "day", label = P.find(([k]) => k === p)![1].toLowerCase();
  const gte = p === "week" ? startOfLocalWeek(b.timezone) : p === "month" ? startOfLocalMonth(b.timezone) : p === "custom" && validDate(sp.from) ? dayStart(sp.from!, b.timezone) : startOfLocalDay(b.timezone);
  const lt = p === "custom" && validDate(sp.to) ? new Date(+dayStart(sp.to!, b.timezone) + 86400000) : undefined;
  const where = { branchId: u.branchId, cashierId: u.id, status: "COMPLETED" as const, createdAt: lt ? { gte, lt } : { gte } };
  const a = await prisma.transaction.aggregate({ where, _sum: { totalRp: true }, _count: true });
  return (<><h1>Dasbor</h1>
    <form style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end", marginBottom: 16 }}>
      {P.map(([k, l]) => <button key={k} name="p" value={k} className={"btn s" + (p === k ? "" : " t")}>{l}</button>)}
      {p === "custom" && <>
        <div><label htmlFor="from">Dari</label><input id="from" name="from" type="date" className="field" style={{ margin: 0 }} defaultValue={sp.from} /></div>
        <div><label htmlFor="to">Sampai</label><input id="to" name="to" type="date" className="field" style={{ margin: 0 }} defaultValue={sp.to} /></div>
        <button name="p" value="custom" className="btn s">Terapkan</button>
      </>}
    </form>
    <div className="grid stats">
    <div className="card stat"><small>Pendapatan {label}</small><b>{rp(a._sum.totalRp ?? 0)}</b></div>
    <div className="card stat"><small>Transaksi {label}</small><b>{a._count}</b></div>
    <div className="card stat"><small>Cabang</small><b>{b.name}</b></div></div></>);
}
