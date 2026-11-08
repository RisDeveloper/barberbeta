"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { guard } from "@/lib/guard";
import { HttpError } from "@/lib/session";

const ReqSchema = z.object({ id: z.string(), reason: z.string().trim().min(3), kind: z.enum(["CANCELLED", "REFUNDED"]) });

const ExpenseSchema = z.object({ description: z.string().trim().min(3), category: z.string().trim().min(1), amountRp: z.coerce.number().int().min(1) });
type FS = { ok?: boolean; error?: string };
export async function addExpense(_: FS, fd: FormData): Promise<FS> {
  const u = await guard("CASHIER");
  try {
    const d = ExpenseSchema.parse(Object.fromEntries(fd));
    const e = await prisma.expenseRecord.create({ data: { date: new Date(), category: d.category, description: d.description, amountRp: d.amountRp, branchId: u.branchId, paymentMethod: "Tunai", createdById: u.id } });
    await prisma.auditLog.create({ data: { actorId: u.id, action: "EXPENSE_CREATE", entity: "ExpenseRecord", entityId: e.id, meta: { amountRp: d.amountRp, category: d.category } } });
    revalidatePath("/cashier/expenses"); revalidatePath("/cashier");
    return { ok: true };
  } catch (e) { return { error: e instanceof Error ? e.message : "Gagal menyimpan" }; }
}

const PaySchema = z.object({ userId: z.string().min(1), kind: z.enum(["Kasbon", "Insentif", "Bonus"]), amountRp: z.coerce.number().int().min(1) });
export async function addEmployeePay(_: FS, fd: FormData): Promise<FS> {
  const u = await guard("CASHIER");
  try {
    const d = PaySchema.parse(Object.fromEntries(fd));
    const emp = await prisma.user.findFirst({ where: { id: d.userId, branchId: u.branchId, deletedAt: null, active: true, role: { not: "OWNER" } } });
    if (!emp) throw new HttpError(400, "Karyawan tidak ditemukan di cabang ini");
    const e = await prisma.expenseRecord.create({ data: { date: new Date(), category: d.kind, description: `${d.kind} - ${emp.name}`, amountRp: d.amountRp, branchId: u.branchId, paymentMethod: "Tunai", createdById: u.id, userId: emp.id } });
    await prisma.auditLog.create({ data: { actorId: u.id, action: "EMPLOYEE_PAY_CREATE", entity: "ExpenseRecord", entityId: e.id, meta: { kind: d.kind, userId: emp.id, name: emp.name, amountRp: d.amountRp } } });
    revalidatePath("/cashier/expenses"); revalidatePath("/cashier");
    return { ok: true };
  } catch (e) { return { error: e instanceof Error ? e.message : "Gagal menyimpan" }; }
}

export async function requestCancel(fd: FormData) {
  const u = await guard("CASHIER");
  const d = ReqSchema.parse({ id: fd.get("id"), reason: fd.get("reason"), kind: fd.get("kind") });
  const t = await prisma.transaction.findFirst({ where: { publicId: d.id, branchId: u.branchId, cashierId: u.id } });
  if (!t || t.status !== "COMPLETED" || t.cancelRequested) throw new HttpError(400, "Transaksi tidak dapat diajukan pembatalan");
  await prisma.transaction.update({ where: { id: t.id }, data: { cancelRequested: true, cancelReason: d.reason, cancelKind: d.kind } });
  await prisma.auditLog.create({ data: { actorId: u.id, action: "TX_CANCEL_REQUEST", entity: "Transaction", entityId: t.id, meta: { reason: d.reason, kind: d.kind, publicId: t.publicId } } });
  revalidatePath("/cashier/history");
}

export async function approveCancel(fd: FormData) {
  const u = await guard("CASHIER");
  const id = String(fd.get("id"));
  const t = await prisma.transaction.findFirst({ where: { publicId: id, branchId: u.branchId, cashierId: u.id } });
  if (!t || !t.cancelRequested || !t.cancelKind || t.status !== "COMPLETED") throw new HttpError(400, "Pengajuan tidak valid");
  await prisma.$transaction([
    prisma.transaction.update({ where: { id: t.id }, data: { status: t.cancelKind, cancelRequested: false } }),
    prisma.commission.updateMany({ where: { transactionId: t.id }, data: { status: "REVERSED" } }),
    prisma.auditLog.create({ data: { actorId: u.id, action: "TX_" + t.cancelKind, entity: "Transaction", entityId: t.id, meta: { reason: t.cancelReason, publicId: t.publicId } } }),
  ]);
  revalidatePath("/cashier/history");
}

export async function rejectCancel(fd: FormData) {
  const u = await guard("CASHIER");
  const id = String(fd.get("id"));
  const t = await prisma.transaction.findFirst({ where: { publicId: id, branchId: u.branchId, cashierId: u.id } });
  if (!t || !t.cancelRequested) throw new HttpError(400, "Pengajuan tidak valid");
  await prisma.transaction.update({ where: { id: t.id }, data: { cancelRequested: false, cancelReason: null, cancelKind: null } });
  await prisma.auditLog.create({ data: { actorId: u.id, action: "TX_CANCEL_REJECT", entity: "Transaction", entityId: t.id, meta: { publicId: t.publicId } } });
  revalidatePath("/cashier/history");
}
