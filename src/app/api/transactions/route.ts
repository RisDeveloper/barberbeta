export const dynamic = "force-dynamic";
import { z } from "zod"; import { randomBytes } from "crypto";
import { prisma } from "@/lib/db"; import { requireUser, branchScope, handle, HttpError } from "@/lib/session"; import { commissionFor } from "@/lib/commission";
const Body = z.object({ serviceId: z.string(), artistId: z.string(), discountRp: z.number().int().min(0).default(0),
  cashReceivedRp: z.number().int().min(0), paymentMethod: z.enum(["Tunai", "QRIS"]).default("Tunai"), customerName: z.string().max(80).optional(), idempotencyKey: z.string().min(8).max(64) });

export const POST = (req: Request) => handle(async () => {
  const user = await requireUser(["CASHIER"]); const branchId = branchScope(user)!; // from session, never from the client
  const b = Body.parse(await req.json());
  const tx = await prisma.$transaction(async (db) => {
    const dup = await db.transaction.findUnique({ where: { idempotencyKey: b.idempotencyKey } });
    if (dup) { if (dup.cashierId !== user.id) throw new HttpError(409, "Transaksi duplikat"); return dup; }
    const service = await db.service.findFirst({ where: { id: b.serviceId, active: true, deletedAt: null, OR: [{ branchId }, { branchId: null }] } });
    if (!service) throw new HttpError(404, "Layanan tidak ditemukan");
    const artist = await db.user.findFirst({ where: { id: b.artistId, role: "EMPLOYEE", branchId, active: true, deletedAt: null } });
    if (!artist) throw new HttpError(404, "Barber tidak ditemukan di cabang ini");
    if (b.discountRp > service.priceRp) throw new HttpError(400, "Diskon melebihi harga");
    const totalRp = service.priceRp - b.discountRp;
    if (b.cashReceivedRp < totalRp) throw new HttpError(400, "Tunai diterima kurang dari total");
    const now = new Date();
    const created = await db.transaction.create({ data: { publicId: `TRX-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${randomBytes(3).toString("hex").toUpperCase()}`,
      idempotencyKey: b.idempotencyKey, branchId, cashierId: user.id, artistId: artist.id, serviceId: service.id, serviceName: service.name,
      priceRp: service.priceRp, discountRp: b.discountRp, totalRp, cashReceivedRp: b.cashReceivedRp, changeRp: b.cashReceivedRp - totalRp, paymentMethod: b.paymentMethod,
      customerName: b.customerName, status: "COMPLETED" } });
    // komisi karyawan: pakai override per-karyawan jika ada, lalu komisi per-layanan, fallback ke aturan komisi
    const override = await db.serviceCommission.findUnique({ where: { serviceId_userId: { serviceId: b.serviceId, userId: artist.id } } });
    const empCommission = override?.commissionRp ?? service.commissionRp;
    if (empCommission > 0) {
      await db.commission.create({ data: { transactionId: created.id, userId: artist.id, ruleId: null, amountRp: empCommission } });
    } else {
      const c = await commissionFor(db, artist.id, "EMPLOYEE", branchId, totalRp, now);
      if (c) await db.commission.create({ data: { transactionId: created.id, userId: artist.id, ruleId: c.ruleId, amountRp: c.amountRp } });
    }
    // komisi kasir dari aturan komisi
    const cc = await commissionFor(db, user.id, "CASHIER", branchId, totalRp, now);
    if (cc) await db.commission.create({ data: { transactionId: created.id, userId: user.id, ruleId: cc.ruleId, amountRp: cc.amountRp } });
    await db.auditLog.create({ data: { actorId: user.id, action: "TX_CREATE", entity: "Transaction", entityId: created.id } });
    return created;
  });
  return Response.json({ id: tx.publicId, totalRp: tx.totalRp, cashReceivedRp: tx.cashReceivedRp, changeRp: tx.changeRp }, { status: 201 });
});
