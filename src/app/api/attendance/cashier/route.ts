export const dynamic = "force-dynamic";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, handle, HttpError } from "@/lib/session";
import bcrypt from "bcryptjs";
const Body = z.object({ email: z.string().trim().email().toLowerCase(), pin: z.string().regex(/^\d{4,8}$/).optional() });

function local(d: Date, tz: string) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(d).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: +p.hour * 60 + +p.minute };
}

export const POST = (req: Request) => handle(async () => {
  const cashier = await requireUser(["CASHIER"]);
  const branch = await prisma.branch.findUniqueOrThrow({ where: { id: cashier.branchId! } });
  const { email, pin } = Body.parse(await req.json());
  const emp = await prisma.user.findUnique({ where: { email } });
  if (!emp || emp.role !== "EMPLOYEE" || !emp.active || emp.deletedAt || emp.branchId !== cashier.branchId) throw new HttpError(403, "Karyawan tidak valid untuk cabang ini");
  const now = new Date(), { date, minutes } = local(now, branch.timezone);
  const rec = await prisma.attendanceRecord.findUnique({ where: { userId_workDate: { userId: emp.id, workDate: date } } });
  const reply = (r: { checkInAt: Date; checkOutAt: Date | null; status: string }, state: string, notice: string) =>
    Response.json({ name: emp.name, branch: branch.name, state, notice, status: r.status, checkInAt: r.checkInAt, checkOutAt: r.checkOutAt });
  if (!rec) {
    if (!pin) throw new HttpError(400, "PIN wajib untuk absen masuk");
    const ok = await bcrypt.compare(pin, emp.pinHash);
    if (!ok) throw new HttpError(401, "Email atau PIN salah");
    const late = minutes > branch.shiftStartMin + branch.lateGraceMin;
    const r = await prisma.attendanceRecord.create({ data: { userId: emp.id, branchId: emp.branchId!, workDate: date, checkInAt: now, status: late ? "LATE" : "PRESENT" } });
    return reply(r, "Sudah Absen Datang", "Absen masuk tercatat");
  }
  if (rec.checkOutAt) return reply(rec, "Sudah Absen Pulang", "Sudah absen keluar hari ini");
  const r = await prisma.attendanceRecord.update({ where: { id: rec.id }, data: { checkOutAt: now } });
  return reply(r, "Sudah Absen Pulang", "Absen keluar tercatat");
});