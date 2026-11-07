import { guard } from "@/lib/guard"; import { prisma } from "@/lib/db"; import { startOfLocalDay, startOfLocalWeek, startOfLocalMonth, rp } from "@/lib/time";
import type { SP } from "@/lib/range";
const P = [["day", "Harian"], ["week", "Mingguan"], ["month", "Bulanan"], ["dow", "Per Hari"]] as const;
const D = [["1", "Senin"], ["2", "Selasa"], ["3", "Rabu"], ["4", "Kamis"], ["5", "Jumat"], ["6", "Sabtu"], ["0", "Minggu"]] as const;
export default async function Dashboard({ searchParams: sp }: { searchParams: SP }) {
  const u = await guard("CASHIER"); const b = await prisma.branch.findUniqueOrThrow({ where: { id: u.branchId } });
  const p = P.find(([k]) => k === sp.p)?.[0] ?? "day", today = startOfLocalDay(b.timezone);
  const todayIdx = new Date(new Intl.DateTimeFormat("en-CA", { timeZone: b.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(today) + "T00:00:00Z").getUTCDay();
  const dn = D.find(([k]) => k === sp.d)?.[0] ?? String(todayIdx), dayLabel = D.find(([k]) => k === dn)![1];
  const gte = p === "week" ? startOfLocalWeek(b.timezone) : p === "month" ? startOfLocalMonth(b.timezone) : p === "dow" ? new Date(+today - ((todayIdx - Number(dn) + 7) % 7) * 86400000) : today;
  const lt = p === "dow" ? new Date(+gte + 86400000) : undefined;
  const where = { branchId: u.branchId, cashierId: u.id, status: "COMPLETED" as const, createdAt: lt ? { gte, lt } : { gte } };
  const a = await prisma.transaction.aggregate({ where, _sum: { totalRp: true }, _count: true });
  const label = p === "dow" ? `hari ${dayLabel.toLowerCase()}` : P.find(([k]) => k === p)![1].toLowerCase();
  return (<><h1>Dasbor</h1>
    <form style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end", marginBottom: 16 }}>
      {P.map(([k, l]) => <button key={k} name="p" value={k} className={"btn s" + (p === k ? "" : " t")}>{l}</button>)}
      {p === "dow" && <>
        <div><label htmlFor="d">Hari</label><select id="d" name="d" className="field" style={{ margin: 0 }} defaultValue={dn}>{D.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        <button name="p" value="dow" className="btn s">Terapkan</button>
      </>}
    </form>
    <div className="grid stats">
    <div className="card stat"><small>Pendapatan {label}</small><b>{rp(a._sum.totalRp ?? 0)}</b></div>
    <div className="card stat"><small>Transaksi {label}</small><b>{a._count}</b></div>
    <div className="card stat"><small>Cabang</small><b>{b.name}</b></div></div></>);
}
