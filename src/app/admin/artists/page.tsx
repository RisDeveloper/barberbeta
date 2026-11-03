import { prisma } from "@/lib/db"; import { ctx } from "@/lib/admin"; import { resolveRange, type SP } from "@/lib/range"; import RangeFilter from "@/components/RangeFilter"; import { startOfLocalDay, startOfLocalWeek, todayLocal, rp } from "@/lib/time";
export default async function Artists({ searchParams: sp }: { searchParams: SP }) {
  const { tz, branchId } = await ctx(); const R = resolveRange(sp, tz), d0 = startOfLocalDay(tz), w0 = startOfLocalWeek(tz), end = new Date(+d0 + 86400000);
  const cust = async (gte: Date, lt: Date) => new Map((await prisma.transaction.groupBy({ by: ["artistId"], where: { branchId, status: "COMPLETED", createdAt: { gte, lt } }, _count: true })).map((r) => [r.artistId, r._count]));
  const earn = async (gte: Date, lt: Date) => new Map((await prisma.commission.groupBy({ by: ["userId"], where: { status: { not: "REVERSED" }, user: { role: "EMPLOYEE", branchId }, transaction: { branchId, status: "COMPLETED", createdAt: { gte, lt } } }, _sum: { amountRp: true } })).map((r) => [r.userId, r._sum.amountRp ?? 0]));
  const [users, cT, cW, cP, eT, eW, eP] = await Promise.all([
    prisma.user.findMany({ where: { branchId, role: "EMPLOYEE", deletedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true, attendance: { where: { workDate: todayLocal(tz) }, select: { checkOutAt: true } } } }),
    cust(d0, end), cust(w0, end), cust(R.gte, R.lt), earn(d0, end), earn(w0, end), earn(R.gte, R.lt)]);
  return (<><h1>Barber</h1><RangeFilter sp={sp} /><div className="card"><table><thead><tr><th>Barber</th><th>Ketersediaan</th><th>Pelanggan hari ini</th><th>Pendapatan hari ini</th><th>Pelanggan minggu ini</th><th>Pendapatan minggu ini</th><th>Pelanggan (periode)</th><th>Komisi (periode)</th></tr></thead><tbody>
    {users.map((u) => { const here = u.attendance.length > 0 && !u.attendance[0].checkOutAt; return (<tr key={u.id}><td>{u.name}</td><td><span className={"pill " + (here ? "ok" : "mute")}>{here ? "Tersedia" : "Belum absen"}</span></td>
      <td>{cT.get(u.id) ?? 0}</td><td>{rp(eT.get(u.id) ?? 0)}</td><td>{cW.get(u.id) ?? 0}</td><td>{rp(eW.get(u.id) ?? 0)}</td><td>{cP.get(u.id) ?? 0}</td><td>{rp(eP.get(u.id) ?? 0)}</td></tr>); })}
    {!users.length && <tr><td colSpan={8}>Belum ada barber di cabang ini.</td></tr>}</tbody></table></div></>);
}
