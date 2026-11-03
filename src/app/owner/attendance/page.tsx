import { prisma } from "@/lib/db"; import { ownerCtx, TZ } from "@/lib/owner"; import { resolveRange, type SP } from "@/lib/range"; import RangeFilter from "@/components/RangeFilter"; import BranchSel from "@/components/BranchSel"; import { F } from "@/components/F"; import Tbl from "@/components/Tbl"; import { hm, todayLocal } from "@/lib/time"; import { st } from "@/lib/labels";
export default async function Attendance({ searchParams: sp }: { searchParams: SP }) {
  await ownerCtx(); const R = resolveRange(sp, TZ, "today"), today = todayLocal(TZ), role = ["EMPLOYEE", "CASHIER", "ADMIN"].find((r) => r === sp.role);
  const where: any = { checkInAt: { gte: R.gte, lt: R.lt }, ...(sp.branch && { branchId: sp.branch }), user: { ...(role && { role }), ...(sp.q && { name: { contains: sp.q, mode: "insensitive" } }) } };
  if (sp.status === "INCOMPLETE") { where.checkOutAt = null; where.workDate = { lt: today }; } else if (["PRESENT", "LATE", "ON_LEAVE", "ABSENT"].includes(sp.status ?? "")) where.status = sp.status;
  const rows = await prisma.attendanceRecord.findMany({ where, orderBy: { checkInAt: "desc" }, take: 300, include: { user: { select: { name: true, role: true } }, branch: { select: { name: true } } } });
  return (<><h1>Absensi Karyawan</h1><RangeFilter sp={sp} def="today"><BranchSel sp={sp} /><F l="Karyawan" n="q" d={sp.q} /><F l="Peran" n="role" d={sp.role} o={[["", "Semua"], ["EMPLOYEE", "Barber"], ["CASHIER", "Kasir"], ["ADMIN", "Admin"]]} />
    <F l="Status" n="status" d={sp.status} o={[["", "Semua"], ...["PRESENT", "LATE", "ON_LEAVE", "ABSENT", "INCOMPLETE"].map((s) => [s, st(s)] as [string, string])]} /></RangeFilter>
    <Tbl head={["Cabang", "Karyawan", "Tanggal", "Masuk", "Keluar", "Status", "Jam"]} rows={rows.map((r) => { const inc = !r.checkOutAt && r.workDate < today;
      return [r.branch.name, r.user.name, r.workDate, hm(r.checkInAt, TZ), hm(r.checkOutAt, TZ), <span className={"pill " + (inc ? "bad" : r.status === "LATE" ? "late" : "ok")}>{st(inc ? "INCOMPLETE" : r.status)}</span>, r.checkOutAt ? ((+r.checkOutAt - +r.checkInAt) / 3600000).toFixed(1) : "—"]; })} empty="Belum ada data absensi." /></>);
}
