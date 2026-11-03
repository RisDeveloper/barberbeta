import { prisma } from "@/lib/db"; import { ctx } from "@/lib/admin"; import { resolveRange, type SP } from "@/lib/range"; import RangeFilter from "@/components/RangeFilter"; import { dt, rp } from "@/lib/time";
export default async function Cashiers({ searchParams: sp }: { searchParams: SP }) {
  const { tz, branchId } = await ctx(); const { gte, lt } = resolveRange(sp, tz);
  const [users, g] = await Promise.all([prisma.user.findMany({ where: { branchId, role: "CASHIER", deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.transaction.groupBy({ by: ["cashierId"], where: { branchId, status: "COMPLETED", createdAt: { gte, lt } }, _count: true, _sum: { totalRp: true }, _max: { createdAt: true } })]);
  return (<><h1>Kasir</h1><RangeFilter sp={sp} /><div className="card"><table><thead><tr><th>Nama</th><th>Akun</th><th>Aktivitas terakhir</th><th>Transaksi</th><th>Pendapatan ditangani</th></tr></thead><tbody>
    {users.map((u) => { const x = g.find((r) => r.cashierId === u.id); return (<tr key={u.id}><td>{u.name}</td><td><span className={"pill " + (u.active ? "ok" : "mute")}>{u.active ? "Aktif" : "Nonaktif"}</span></td>
      <td>{x?._max.createdAt ? dt(x._max.createdAt, tz) : "—"}</td><td>{x?._count ?? 0}</td><td>{rp(x?._sum.totalRp ?? 0)}</td></tr>); })}
    {!users.length && <tr><td colSpan={5}>Belum ada kasir di cabang ini.</td></tr>}</tbody></table></div></>);
}
