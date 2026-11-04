"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { guard } from "@/lib/guard";
import { HttpError } from "@/lib/session";

const VoidSchema = z.object({ id: z.string(), reason: z.string().trim().min(3), kind: z.enum(["CANCELLED", "REFUNDED"]) });

export async function voidTransaction(fd: FormData) {
  const u = await guard("ADMIN");
  const d = VoidSchema.parse({ id: fd.get("id"), reason: fd.get("reason"), kind: fd.get("kind") });
  const t = await prisma.transaction.findFirst({ where: { publicId: d.id, branchId: u.branchId } });
  if (!t || t.status !== "COMPLETED") throw new HttpError(400, "Transaksi tidak dapat dibatalkan");
  await prisma.$transaction([
    prisma.transaction.update({ where: { id: t.id }, data: { status: d.kind } }),
    prisma.commission.updateMany({ where: { transactionId: t.id }, data: { status: "REVERSED" } }),
    prisma.auditLog.create({ data: { actorId: u.id, action: "TX_" + d.kind, entity: "Transaction", entityId: t.id, meta: { reason: d.reason, publicId: t.publicId } } }),
  ]);
  revalidatePath(`/admin/transactions/${d.id}`);
  revalidatePath("/admin/transactions");
}
