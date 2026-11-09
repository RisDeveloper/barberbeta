export const dynamic = "force-dynamic"; import { guard } from "@/lib/guard"; import { prisma } from "@/lib/db"; import { todayState } from "@/lib/attendance"; import { resolveRange, type SP } from "@/lib/range"; import RangeFilter from "@/components/RangeFilter"; import Tbl from "@/components/Tbl"; import { hm, todayLocal } from "@/lib/time"; import { st } from "@/lib/labels";
export default async function MyAttendance({ searchParams: sp }: { searchParams: SP }) {
  const u = await guard("EMPLOYEE"); const b = await prisma.branch.findUniqueOrThrow({ where: { id: u.branchId } }), tz = b.timezone, { gte, lt } = resolveRange(sp, tz), today = todayLocal(tz);
  const [att, rows] = await Promise.all([todayState(u.id, tz), prisma.attendanceRecord.findMany({ where: { userId: u.id, checkInAt: { gte, lt } }, orderBy: { checkInAt: "desc" }, take: 100 })]); // own records only
  const hrs = rows.reduce((a, r) => a + (r.checkOutAt ? +r.checkOutAt - +r.checkInAt : 0), 0) / 3600000;
  return (<><h1>Absensi Saya</h1><div className="card" style={{ marginBottom: 16, background: att.rec ? "var(--ok-bg, #C4EED0)" : "var(--card, #fff)" }}><small>Hari ini</small><div style={{ fontSize: 24, fontWeight: 600 }}>{att.label}</div>
    <div className="row" style={{ marginTop: 8 }}><span>Masuk</span>{hm(att.rec?.checkInAt ?? null, tz)}</div><div className="row"><span>Keluar</span>{hm(att.rec?.checkOutAt ?? null, tz)}</div><div className="row"><span>Status</span>{att.rec ? st(att.rec.status) : "—"}</div>
    <div className="portal" style={{ margin: "10px 0 0" }}>Absen masuk/keluar dilakukan melalui kasir cabang.</div></div>
    <RangeFilter sp={sp} /><div className="card stat" style={{ marginBottom: 16 }}><small>Total jam kerja (periode, hari yang selesai)</small><b>{hrs.toFixed(1)} h</b></div>
    <Tbl head={["Tanggal", "Masuk", "Keluar", "Status", "Jam"]} rows={rows.map((r) => { const inc = !r.checkOutAt && r.workDate < today;
      return [r.workDate, hm(r.checkInAt, tz), hm(r.checkOutAt, tz), <span className={"pill " + (inc ? "bad" : r.status === "LATE" ? "late" : "ok")}>{st(inc ? "INCOMPLETE" : r.status)}</span>, r.checkOutAt ? ((+r.checkOutAt - +r.checkInAt) / 3600000).toFixed(1) : "—"]; })} empty="Belum ada data absensi pada periode ini." /></>);
}
