export const dynamic = "force-dynamic";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, handle, HttpError } from "@/lib/session";
const Body = z.object({ email: z.string().trim().email().toLowerCase() });

function localDate(d: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

export const POST = (req: Request) => handle(async () => {
  const cashier = await requireUser(["CASHIER"]);
  const branch = await prisma.branch.findUniqueOrThrow({ where: { id: cashier.branchId! } });
  const { email } = Body.parse(await req.json());
  const emp = await prisma.user.findFirst({ where: { email, role: "EMPLOYEE", branchId: branch.id, deletedAt: null, active: true } });
  if (!emp) throw new HttpError(403, "Karyawan tidak valid untuk cabang ini");
  await prisma.attendanceRecord.deleteMany({ where: { userId: emp.id, workDate: localDate(new Date(), branch.timezone) } });
  return Response.json({ ok: true });
});
