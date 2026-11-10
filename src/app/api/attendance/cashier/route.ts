export const dynamic = "force-dynamic";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, handle, HttpError } from "@/lib/session";
import bcrypt from "bcryptjs";
const Body = z.object({ email: z.string().trim().email().toLowerCase(), pin: z.string().regex(/^\d{4,8}$/).optional() });

function local(d: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short" }).formatToParts(d);
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  const dowMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: +p.hour * 60 + +p.minute, dow: dowMap[p.weekday] ?? 0 };
}

export const POST = (req: Request) => handle(async () => {
  const cashier = await requireUser(["CASHIER"]);
  const branch = await prisma.branch.findUniqueOrThrow({ where: { id: cashier.branchId! } });
  const { email, pin } = Body.parse(await req.json());
  const emp = await prisma.user.findUnique({ where: { email }, include: { shifts: { include: { shift: true } } } });
  if (!emp || emp.role !== "EMPLOYEE" || !emp.active || emp.deletedAt || emp.branchId !== cashier.branchId) throw new HttpError(403, "Karyawan tidak valid untuk cabang ini");
  const now = new Date(), { date, minutes, dow } = local(now, branch.timezone);
  const workDays = (emp.workDays ?? "0,1,2,3,4,5,6").split(",").map((x) => parseInt(x.trim(), 10)).filter((n) => !isNaN(n));
  if (!workDays.includes(dow)) throw new HttpError(400, "Bukan hari kerja karyawan ini");
  const rec = await prisma.attendanceRecord.findUnique({ where: { userId_workDate: { userId: emp.id, workDate: date } } });
  const reply = (r: { checkInAt: Date; checkOutAt: Date | null; status: string; mealAllowanceRp?: number }, state: string, notice: string) =>
    Response.json({ name: emp.name, branch: branch.name, state, notice, status: r.status, checkInAt: r.checkInAt, checkOutAt: r.checkOutAt, mealAllowanceRp: r.mealAllowanceRp ?? 0 });
  if (!rec) {
    if (!pin) throw new HttpError(400, "PIN wajib untuk absen masuk");
    const ok = await bcrypt.compare(pin, emp.pinHash);
    if (!ok) throw new HttpError(401, "Email atau PIN salah");
    // per-day schedule takes priority
    const schedule = (emp.shiftSchedule && typeof emp.shiftSchedule === "object") ? emp.shiftSchedule as Record<string, string> : null;
    const todayShiftId = schedule ? schedule[String(dow)] : null;
    const assigned = (emp.shifts ?? []).map((us: any) => us.shift).filter((s: any) => s && s.active);
    let matched: any = null;
    if (todayShiftId) matched = assigned.find((s: any) => s.id === todayShiftId) ?? null;
    if (!matched && assigned.length) matched = assigned.find((s: any) => minutes >= s.startMin && minutes <= s.endMin) ?? assigned[0];
    // if schedule exists but no shift for today => off day
    if (schedule && !todayShiftId) throw new HttpError(400, "Bukan hari kerja karyawan ini");
    const shiftStart = matched ? matched.startMin : (emp.shiftStartMin ?? branch.shiftStartMin);
    const grace = matched ? matched.graceMin : (emp.lateGraceMin ?? branch.lateGraceMin);
    const meal = matched ? matched.mealAllowanceRp : (emp.mealAllowanceRp ?? 0);
    const late = minutes > shiftStart + grace;
    const r = await prisma.attendanceRecord.create({ data: { userId: emp.id, branchId: emp.branchId!, workDate: date, checkInAt: now, status: late ? "LATE" : "PRESENT", mealAllowanceRp: late ? 0 : meal } });
    return reply(r, "Sudah Absen Datang", "Absen masuk tercatat");
  }
  if (rec.checkOutAt) return reply(rec, "Sudah Absen Pulang", "Sudah absen keluar hari ini");
  const r = await prisma.attendanceRecord.update({ where: { id: rec.id }, data: { checkOutAt: now } });
  return reply(r, "Sudah Absen Pulang", "Absen keluar tercatat");
});