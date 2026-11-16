import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/session";

export const POST = async (req: Request, { params }: { params: { id: string } }) => {
  const u = await getUser();
  if (!u || u.role !== "MEMBER") return Response.json({ error: "Silakan masuk" }, { status: 401 });
  const key = req.headers.get("Idempotency-Key");
  if (!key || key.length > 64) return Response.json({ error: "Permintaan tidak valid" }, { status: 400 });
  const reward = await prisma.reward.findFirst({ where: { id: params.id, active: true } });
  if (!reward) return Response.json({ error: "Hadiah tidak ditemukan" }, { status: 404 });

  const existing = await prisma.voucher.findUnique({ where: { idempotencyKey: `${u.id}:${key}` } });
  if (existing) return Response.json({ ok: true, code: existing.code });

  try {
    const v = await prisma.$transaction(async (db) => {
      const fresh = await db.user.findUniqueOrThrow({ where: { id: u.id }, select: { loyaltyPoints: true } });
      if (fresh.loyaltyPoints < reward.costPoints) throw new Error("POINTS");
      await db.user.update({ where: { id: u.id }, data: { loyaltyPoints: { decrement: reward.costPoints } } });
      return db.voucher.create({ data: {
        code: "TS-" + randomBytes(3).toString("hex").toUpperCase(),
        userId: u.id, rewardId: reward.id, name: reward.name,
        discountRp: reward.discountRp, costPoints: reward.costPoints,
        idempotencyKey: `${u.id}:${key}`,
      } });
    });
    return Response.json({ ok: true, code: v.code });
  } catch (e: any) {
    if (e?.message === "POINTS") return Response.json({ error: "Poin tidak cukup" }, { status: 409 });
    if (e?.code === "P2002") {
      const v = await prisma.voucher.findUnique({ where: { idempotencyKey: `${u.id}:${key}` } });
      if (v) return Response.json({ ok: true, code: v.code });
    }
    return Response.json({ error: "Gagal menukar" }, { status: 500 });
  }
};
