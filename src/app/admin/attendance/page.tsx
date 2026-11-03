import { prisma } from "@/lib/db"; import { ctx } from "@/lib/admin"; import { resolveRange, qs, type SP } from "@/lib/range"; import RangeFilter from "@/components/RangeFilter"; import { hm, todayLocal } from "@/lib/time"; import { st } from "@/lib/labels";
const ST = ["PRESENT", "LATE", "ON_LEAVE", "ABSENT", "INCOMPLETE"], ROLES = ["EMPLOYEE", "CASHIER"] as const;
export default async function Attendance({ searchParams: sp }: { searchParams: SP }) {
  const { tz, branchId } = await ctx(); const R = resolveRange(sp, tz, "today"), today = todayLocal(tz), role = ROLES.find((r) => r === sp.role);
  const where: any = { branchId, checkInAt: { gte: R.gte, lt: R.lt }, user: { ...(role && { role }), ...(sp.q && { name: { contains: sp.q, mode: "insensitive" } }) }, ...(sp.u && { userId: sp.u }) };
  if (sp.status === "INCOMPLETE") { where.checkOutAt = null; where.workDate = { lt: today }; } else if (ST.includes(sp.status ?? "")) where.status = sp.status;
  const [staff, todayRecs, rows] = await Promise.all([prisma.user.count({ where: { branchId, role: { in: ["EMPLOYEE", "CASHIER"] }, active: true, deletedAt: null } }),
    prisma.attendanceRecord.findMany({ where: { branchId, workDate: today }, select: { status: true, checkOutAt: true } }),
    prisma.attendanceRecord.findMany({ where, orderBy: { checkInAt: "desc" }, take: 200, include: { user: { select: { id: true, name: true, role: true } } } })]);
  const pill = (l: string, c: string, n: number) => <span className={"pill " + c} style={{ marginRight: 8 }}>{l}: {n}</span>;
  return (<><h1>Absensi Karyawan</h1><div className="card" style={{ marginBottom: 16 }}><h2>Hari ini</h2>{pill("Hadir", "ok", todayRecs.length)}{pill("Terlambat", "late", todayRecs.filter((r) => r.status === "LATE").length)}
    {pill("Tidak hadir", "bad", Math.max(0, staff - todayRecs.length))}{pill("Belum keluar", "mute", todayRecs.filter((r) => !r.checkOutAt).length)}</div>
    <RangeFilter sp={sp} def="today"><div><label htmlFor="q">Karyawan</label><input id="q" name="q" className="field" style={{ margin: 0 }} defaultValue={sp.q} /></div>
      <div><label htmlFor="role">Peran</label><select id="role" name="role" className="field" style={{ margin: 0 }} defaultValue={sp.role ?? ""}><option value="">Semua</option><option value="EMPLOYEE">Barber</option><option value="CASHIER">Kasir</option></select></div>
      <div><label htmlFor="status">Status</label><select id="status" name="status" className="field" style={{ margin: 0 }} defaultValue={sp.status ?? ""}><option value="">Semua</option>{ST.map((s) => <option key={s} value={s}>{st(s)}</option>)}</select></div></RangeFilter>
    {sp.u && <p><a href={qs(sp, { u: undefined })}>← Tampilkan semua karyawan</a></p>}
    <div className="card"><table><thead><tr><th>Karyawan</th><th>ID</th><th>Peran</th><th>Tanggal</th><th>Masuk</th><th>Keluar</th><th>Status</th><th>Jam</th></tr></thead><tbody>
      {rows.map((r) => { const inc = !r.checkOutAt && r.workDate < today, hrs = r.checkOutAt ? ((+r.checkOutAt - +r.checkInAt) / 3600000).toFixed(1) : "—";
        return (<tr key={r.id}><td><a href={qs(sp, { u: r.user.id })}>{r.user.name}</a></td><td>{r.user.id.slice(-8).toUpperCase()}</td><td>{r.user.role === "CASHIER" ? "Kasir" : "Barber"}</td><td>{r.workDate}</td><td>{hm(r.checkInAt, tz)}</td><td>{hm(r.checkOutAt, tz)}</td>
          <td><span className={"pill " + (inc ? "bad" : r.status === "LATE" ? "late" : "ok")}>{st(inc ? "INCOMPLETE" : r.status)}</span></td><td>{hrs}</td></tr>); })}
      {!rows.length && <tr><td colSpan={8}>Belum ada data absensi.</td></tr>}</tbody></table>
      <div className="portal" style={{ margin: "10px 0 0" }}>Ketidakhadiran hanya dihitung untuk hari ini; absensi hari lampau memerlukan jadwal kerja (belum tersedia).</div></div></>);
}
