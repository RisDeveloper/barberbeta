import { prisma } from "@/lib/db";
import { getUser } from "@/lib/session";

const TIERS: [string, number][] = [["Silver", 0], ["Gold", 200], ["Platinum", 500]];

export const GET = async () => {
  const u = await getUser();
  if (!u || u.role !== "MEMBER") return Response.json({ error: "Silakan masuk" }, { status: 401 });
  const [svcs, visits, rewards, vouchers] = await Promise.all([
    prisma.service.findMany({ where: { loyaltyPoints: { gt: 0 }, active: true, deletedAt: null }, select: { name: true, loyaltyPoints: true }, orderBy: { name: "asc" } }),
    prisma.transaction.findMany({ where: { customerId: u.id, status: "COMPLETED" }, orderBy: { createdAt: "desc" }, take: 100,
      select: { id: true, createdAt: true, serviceName: true, totalRp: true, service: { select: { loyaltyPoints: true } } } }),
    prisma.reward.findMany({ where: { active: true }, orderBy: { costPoints: "asc" }, select: { id: true, name: true, costPoints: true, discountRp: true } }),
    prisma.voucher.findMany({ where: { userId: u.id }, orderBy: { createdAt: "desc" }, take: 50, select: { code: true, name: true, status: true, createdAt: true, costPoints: true } }),
  ]);
  const ruleMap = new Map<string, number>();
  for (const s of svcs) if (!ruleMap.has(s.name)) ruleMap.set(s.name, s.loyaltyPoints);
  const points = u.loyaltyPoints;
  const idx = TIERS.reduce((a, t, i) => (points >= t[1] ? i : a), 0);
  const nx = TIERS[idx + 1];
  const since = visits.length ? visits[visits.length - 1].createdAt : new Date();
  const phone = u.email.endsWith("@member.local") ? u.email.split("@")[0] : "";
  return Response.json({
    name: u.name, phone, code: "TS-" + u.id.slice(-4).toUpperCase(), since, points,
    tier: TIERS[idx][0], next: nx ? { name: nx[0], at: nx[1] } : null,
    rules: [...ruleMap].map(([service, pts]) => ({ service, points: pts })),
    rewards: rewards.map((r) => ({ id: r.id, name: r.name, cost: r.costPoints, discountRp: r.discountRp })),
    vouchers: vouchers.map((v) => ({ code: v.code, name: v.name, status: v.status === "ACTIVE" ? "Aktif" : v.status === "USED" ? "Terpakai" : "Kedaluwarsa", date: v.createdAt })),
    visits: visits.map((t) => ({ date: t.createdAt, service: t.serviceName, total: t.totalRp, points: t.service.loyaltyPoints })),
    ledger: [
      ...visits.map((t) => ({ date: t.createdAt, note: t.serviceName, points: t.service.loyaltyPoints })),
      ...vouchers.map((v) => ({ date: v.createdAt, note: "Tukar " + v.name, points: -v.costPoints })),
    ].sort((a, b) => +new Date(b.date) - +new Date(a.date)),
  }, { headers: { "Cache-Control": "no-store" } });
};
