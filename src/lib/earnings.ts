import { prisma } from "./db";
/** Customers = completed transactions assigned to the artist; earnings = commission snapshots (not reversed) of completed transactions. */
export async function stats(userId: string, since: Date) {
  const [customers, sum] = await Promise.all([
    prisma.transaction.count({ where: { artistId: userId, status: "COMPLETED", createdAt: { gte: since } } }),
    prisma.commission.aggregate({ where: { userId, status: { not: "REVERSED" }, transaction: { status: "COMPLETED", createdAt: { gte: since } } }, _sum: { amountRp: true } }) ]);
  return { customers, earningsRp: sum._sum.amountRp ?? 0 };
}
/** Net pay in a period: commission + insentif + bonus - kasbon (only records linked to the employee). */
export async function net(userId: string, gte: Date, lt: Date) {
  const [c, x] = await Promise.all([
    prisma.commission.aggregate({ where: { userId, status: { not: "REVERSED" }, transaction: { status: "COMPLETED", createdAt: { gte, lt } } }, _sum: { amountRp: true } }),
    prisma.expenseRecord.groupBy({ by: ["category"], where: { userId, voidedAt: null, category: { in: ["Kasbon", "Insentif", "Bonus"] }, date: { gte, lt } }, _sum: { amountRp: true } }) ]);
  const amt = (k: string) => x.find((r) => r.category === k)?._sum.amountRp ?? 0;
  return (c._sum.amountRp ?? 0) + amt("Insentif") + amt("Bonus") - amt("Kasbon");
}
