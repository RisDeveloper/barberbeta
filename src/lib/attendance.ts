import { prisma } from "./db"; import { todayLocal } from "./time";
export async function todayState(userId: string, tz: string) {
  const rec = await prisma.attendanceRecord.findUnique({ where: { userId_workDate: { userId, workDate: todayLocal(tz) } } });
  return { rec, label: !rec ? "Belum Absen Datang" : rec.checkOutAt ? "Sudah Absen Pulang" : "Sudah Absen Datang" };
}
