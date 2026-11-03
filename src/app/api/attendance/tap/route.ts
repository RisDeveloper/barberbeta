export const dynamic = "force-dynamic";
import { z } from "zod";
import { prisma } from "@/lib/db"; import { sha256, handle, HttpError } from "@/lib/session";
const Body = z.object({ cardUid: z.string().min(4).max(64) });
function local(d: Date, tz: string) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(d).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: +p.hour * 60 + +p.minute };
}
// Called by a branch kiosk (USB keyboard-wedge reader or network reader) with a device key — not by the employee's own session.
export const POST = (req: Request) => handle(async () => {
  const key = req.headers.get("x-device-key"); if (!key) throw new HttpError(401);
  const device = await prisma.device.findUnique({ where: { keyHash: sha256(key) }, include: { branch: true } });
  if (!device?.active) throw new HttpError(401, "Perangkat tidak dikenal");
  const { cardUid } = Body.parse(await req.json());
  const card = await prisma.employeeCard.findUnique({ where: { tokenHash: sha256(process.env.CARD_PEPPER + cardUid) }, include: { user: true } });
  const u = card?.user;
  if (!card?.active || !u || !u.active || u.deletedAt || u.branchId !== device.branchId) throw new HttpError(403, "Kartu tidak valid untuk cabang ini");
  const now = new Date(), { date, minutes } = local(now, device.branch.timezone);
  const rec = await prisma.attendanceRecord.findUnique({ where: { userId_workDate: { userId: u.id, workDate: date } } });
  const reply = (r: { checkInAt: Date; checkOutAt: Date | null }, state: string, notice: string) =>
    Response.json({ name: u.name, branch: device.branch.name, state, notice, checkInAt: r.checkInAt, checkOutAt: r.checkOutAt });
  if (!rec) {
    const late = minutes > device.branch.shiftStartMin + device.branch.lateGraceMin;
    const r = await prisma.attendanceRecord.create({ data: { userId: u.id, branchId: u.branchId!, workDate: date, checkInAt: now, status: late ? "LATE" : "PRESENT" } });
    return reply(r, "Sudah Absen Datang", "Absen masuk tercatat");
  }
  if (now.getTime() - (rec.checkOutAt ?? rec.checkInAt).getTime() < 5 * 60_000) // anti double-tap
    return reply(rec, rec.checkOutAt ? "Sudah Absen Pulang" : "Sudah Absen Datang", "Tap ganda diabaikan");
  if (rec.checkOutAt) return reply(rec, "Sudah Absen Pulang", "Sudah absen keluar hari ini");
  const r = await prisma.attendanceRecord.update({ where: { id: rec.id }, data: { checkOutAt: now } });
  return reply(r, "Sudah Absen Pulang", "Absen keluar tercatat");
});
