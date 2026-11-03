import { prisma } from "./db";
/** Customers = completed transactions assigned to the artist; earnings = commission snapshots (not reversed) of completed transactions. */
export async function stats(userId: string, since: Date) {
  const [customers, sum] = await Promise.all([
    prisma.transaction.count({ where: { artistId: userId, status: "COMPLETED", createdAt: { gte: since } } }),
    prisma.commission.aggregate({ where: { userId, status: { not: "REVERSED" }, transaction: { status: "COMPLETED", createdAt: { gte: since } } }, _sum: { amountRp: true } }) ]);
  return { customers, earningsRp: sum._sum.amountRp ?? 0 };
}
