import type { Prisma, Role } from "@prisma/client";
/** Picks the most specific active rule (employee > branch > global) and returns an integer-rupiah snapshot. */
export async function commissionFor(db: Prisma.TransactionClient, userId: string, role: Role, branchId: string, totalRp: number, now: Date) {
  const rules = await db.commissionRule.findMany({ where: { role, active: true, effectiveFrom: { lte: now },
    AND: [{ OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }] },
          { OR: [{ userId }, { userId: null, branchId }, { userId: null, branchId: null }] }] } });
  const score = (r: typeof rules[number]) => (r.userId ? 4 : 0) + (r.branchId ? 2 : 0);
  const rule = rules.sort((a, b) => score(b) - score(a) || +b.effectiveFrom - +a.effectiveFrom)[0];
  if (!rule) return null;
  const amountRp = rule.type === "FIXED" ? rule.value : Math.floor((totalRp * rule.value) / 10000);
  return { ruleId: rule.id, amountRp };
}
