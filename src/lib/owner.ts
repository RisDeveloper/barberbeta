import { redirect } from "next/navigation"; import { getUser } from "./session"; import { portalHome } from "./guard"; import { prisma } from "./db";
export const TZ = process.env.DEFAULT_TZ ?? "Asia/Jakarta"; // owner ranges use this; per-branch timezones apply to attendance/POS only
export const INCOME_CATS = ["Pendapatan usaha tambahan", "Penjualan produk", "Pendapatan lain", "Penyesuaian pendapatan operasional"];
export const EXPENSE_CATS = ["Sewa", "Listrik", "Air", "Peralatan", "Perawatan", "Karyawan", "Perlengkapan", "Pemasaran", "Operasional lain"]; // no "Commission": commissions are counted separately
export const PAY = ["Tunai", "Transfer", "Lainnya"];
export async function ownerCtx() { const u = await getUser(); if (!u) redirect(process.env.AUTH_URL ?? "/auth"); if (u.role !== "OWNER") redirect(portalHome(u.role)); return u; }
/** Operating result = net sales + additional income - recorded expenses - commissions. Refunded/cancelled sales are excluded by status; POS sales and manual income stay separate. */
export async function finance(gte: Date, lt: Date, branchId?: string) {
  const tx = { status: "COMPLETED" as const, createdAt: { gte, lt }, ...(branchId && { branchId }) }, rec = { voidedAt: null, date: { gte, lt }, ...(branchId && { branchId }) };
  const [s, i, e, c] = await Promise.all([prisma.transaction.aggregate({ where: tx, _sum: { totalRp: true }, _count: true }), prisma.incomeRecord.aggregate({ where: rec, _sum: { amountRp: true } }),
    prisma.expenseRecord.aggregate({ where: rec, _sum: { amountRp: true } }), prisma.commission.aggregate({ where: { status: { not: "REVERSED" }, transaction: tx }, _sum: { amountRp: true } })]);
  const revenue = s._sum.totalRp ?? 0, income = i._sum.amountRp ?? 0, expense = e._sum.amountRp ?? 0, commission = c._sum.amountRp ?? 0;
  return { revenue, count: s._count, income, expense, commission, net: revenue + income - expense - commission };
}
