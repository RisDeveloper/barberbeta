import { guard } from "@/lib/guard"; import { prisma } from "@/lib/db"; import { startOfLocalDay, startOfLocalWeek, startOfLocalMonth, dayStart, validDate, rp } from "@/lib/time";
import type { SP } from "@/lib/range";
const P = [["day", "Harian"], ["week", "Mingguan"], ["month", "Bulanan"], ["date", "Per Hari"]] as const;
export default async function Dashboard({ searchParams: sp }: { searchParams: SP }) {
  const u = await guard("CASHIER"); const b = await prisma.branch.findUniqueOrThrow({ where: { id: u.branchId } });
  const p = P.find(([k]) => k === sp.p)?.[0] ?? "day", today = startOfLocalDay(b.timezone);
  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: b.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(today);
  const dstr = validDate(sp.d) ?? todayStr, dateStart = dayStart(dstr, b.timezone);
  const fmt = (d: Date) => new Intl.DateTimeFormat("id-ID", { timeZone: b.timezone, day: "2-digit", month: "2-digit", year: "2-digit" }).format(d);
  const gte = p === "week" ? startOfLocalWeek(b.timezone) : p === "month" ? startOfLocalMonth(b.timezone) : p === "date" ? dateStart : today;
  const lt = p === "date" ? new Date(+gte + 86400000) : undefined;
  const where = { branchId: u.branchId, cashierId: u.id, status: "COMPLETED" as const, createdAt: lt ? { gte, lt } : { gte } };
  const a = await prisma.transaction.aggregate({ where, _sum: { totalRp: true }, _count: true });
  const label = p === "date" ? `hari ${new Intl.DateTimeFormat("id-ID", { timeZone: b.timezone, weekday: "long" }).format(gte).toLowerCase()}, ${fmt(gte)}` : P.find(([k]) => k === p)![1].toLowerCase();
  return (<><h1>Dasbor</h1>
    <form style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {P.map(([k, l]) => <button key={k} name="p" value={k} className={"btn s" + (p === k ? "" : " t")}>{l}</button>)}
      </div>
      {p === "date" && <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <label htmlFor="d" style={{ fontSize: 13 }}>Tanggal</label>
        <input id="d" name="d" type="date" className="field" style={{ margin: 0, width: 170, height: 40 }} defaultValue={dstr} />
        <button name="p" value="date" className="btn s" style={{ height: 40 }}>Terapkan</button>
      </div>}
    </form>
    <div className="grid stats">
    <div className="card stat"><small>Pendapatan {label}</small><b>{rp(a._sum.totalRp ?? 0)}</b></div>
    <div className="card stat"><small>Transaksi {label}</small><b>{a._count}</b></div>
    <div className="card stat"><small>Cabang</small><b>{b.name}</b></div></div></>);
}
