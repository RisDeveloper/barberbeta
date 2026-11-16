import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/session";

export const POST = async (req: Request) => {
  const u = await getUser();
  if (!u || u.role !== "MEMBER") return Response.json({ error: "Silakan masuk" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const oldPin = String(body.oldPin ?? "");
  const newPin = String(body.newPin ?? "");
  if (!/^\d{6}$/.test(newPin)) return Response.json({ error: "PIN baru harus 6 digit" }, { status: 400 });
  if (!(await bcrypt.compare(oldPin, u.pinHash))) return Response.json({ error: "PIN lama salah" }, { status: 401 });
  await prisma.user.update({ where: { id: u.id }, data: { pinHash: await bcrypt.hash(newPin, 12) } });
  return Response.json({ ok: true });
};
