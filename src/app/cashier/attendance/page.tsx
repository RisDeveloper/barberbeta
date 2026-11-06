import { guard } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { todayLocal } from "@/lib/time";
import AttendanceCards from "./AttendanceCards";

export default async function Attendance() {
  const u = await guard("CASHIER");
  const b = await prisma.branch.findUniqueOrThrow({ where: { id: u.branchId! } });
  const today = todayLocal(b.timezone);
  const [employees, recs] = await Promise.all([
    prisma.user.findMany({ where: { branchId: u.branchId, role: "EMPLOYEE", active: true, deletedAt: null }, select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
    prisma.attendanceRecord.findMany({ where: { branchId: u.branchId, workDate: today }, select: { userId: true, status: true, checkInAt: true, checkOutAt: true } }),
  ]);
  const m = new Map(recs.map((r) => [r.userId, r]));
  return (<><h1>Absensi Karyawan</h1><AttendanceCards employees={employees.map((e) => {
    const r = m.get(e.id);
    return { ...e, state: !r ? "" : r.checkOutAt ? "Selesai" : r.status === "LATE" ? "Terlambat" : "Hadir", inAt: r?.checkInAt.toISOString() ?? null, outAt: r?.checkOutAt?.toISOString() ?? null };
  })} /></>);
}
