import { prisma } from "./db";
import { localParts } from "./time";

export async function repairLateRecords(where: any) {
  const rows = await prisma.attendanceRecord.findMany({ where: { ...where, status: "LATE" }, include: { user: { include: { shifts: { include: { shift: true } } } }, branch: true } });
  const asMin = (v: any) => (typeof v === "string" && v.includes(":") ? Number(v.split(":")[0]) * 60 + Number(v.split(":")[1]) : Number(v));
  let fixed = 0, kept = 0;
  for (const r of rows) {
    const emp: any = r.user;
    if (emp.role !== "EMPLOYEE" || emp.deletedAt || !emp.active) { kept++; continue; }
    const dow = new Date(r.workDate + "T12:00:00Z").getUTCDay();
    const workDays = (emp.workDays ?? "0,1,2,3,4,5,6").split(",").map((x: string) => parseInt(x.trim(), 10)).filter((n: number) => !isNaN(n));
    if (!workDays.includes(dow)) { kept++; continue; }
    const minutes = localParts(r.checkInAt, r.branch.timezone).minutes;
    const schedule = (emp.shiftSchedule && typeof emp.shiftSchedule === "object") ? emp.shiftSchedule as Record<string, any> : null;
    const entry: any = schedule ? schedule[String(dow)] : null;
    const shiftId = entry && typeof entry === "object" ? (entry.shift ?? null) : (typeof entry === "string" ? entry : null);
    const assigned = (emp.shifts ?? []).map((us: any) => us.shift).filter((s: any) => s && s.active);
    let matched: any = null;
    if (shiftId) matched = assigned.find((s: any) => s.id === shiftId) ?? await prisma.shift.findFirst({ where: { id: shiftId, branchId: r.branchId, active: true } });
    if (!matched && assigned.length) matched = assigned.find((s: any) => minutes >= s.startMin && minutes <= s.endMin) ?? assigned[0];
    const overrideStart = entry && typeof entry === "object" && entry.in != null ? asMin(entry.in) : null;
    const shiftStart = overrideStart != null && !isNaN(overrideStart) ? overrideStart : (matched ? matched.startMin : (emp.shiftStartMin ?? r.branch.shiftStartMin));
    const dayGrace = entry && typeof entry === "object" && entry.grace != null ? Number(entry.grace) : null;
    const grace = dayGrace != null && !isNaN(dayGrace) ? dayGrace : (emp.lateGraceMin ?? 30);
    const meal = matched ? matched.mealAllowanceRp : (emp.mealAllowanceRp ?? 0);
    if (minutes <= shiftStart + grace) {
      await prisma.attendanceRecord.update({ where: { id: r.id }, data: { status: "PRESENT", mealAllowanceRp: meal } });
      fixed++;
    } else kept++;
  }
  return { total: rows.length, fixed, kept };
}
