import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/session";

export const POST = async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  const phone = String(body.phone ?? "").replace(/\D/g, "");
  const pin = String(body.pin ?? "");
  if (!phone || !pin) return Response.json({ error: "No. HP atau PIN salah" }, { status: 401 });
  const user = await prisma.user.findFirst({ where: { email: `${phone}@member.local`, role: "MEMBER", active: true, deletedAt: null } });
  const ok = await bcrypt.compare(pin, user?.pinHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalid");
  if (!user || !ok) return Response.json({ error: "No. HP atau PIN salah" }, { status: 401 });
  await createSession(user.id);
  return Response.json({ ok: true });
};
