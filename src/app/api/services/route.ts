export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { requireUser, branchScope, handle } from "@/lib/session";

export const GET = () => handle(async () => {
  const u = await requireUser(["CASHIER", "ADMIN", "OWNER"]); const branchId = branchScope(u);
  const services = await prisma.service.findMany({ where: { active: true, deletedAt: null, OR: [{ branchId: null, branchIds: { isEmpty: true } }, { branchId }, { branchIds: { has: branchId } }] },
    select: { id: true, name: true, priceRp: true, commissionRp: true, loyaltyPoints: true }, orderBy: { name: "asc" } });
  const branch = branchId ? await prisma.branch.findUnique({ where: { id: branchId }, select: { name: true, logoUrl: true, address: true, receiptBranding: true, qrisStatic: true, receiptWidthMm: true } }) : null;
  return Response.json({ services, branchName: branch?.name ?? null, branchLogoUrl: branch?.logoUrl ?? null, branchAddress: branch?.address ?? null, branchBranding: branch?.receiptBranding ?? "Powered by The System Pos", qrisStatic: branch?.qrisStatic ?? null, receiptWidthMm: branch?.receiptWidthMm ?? 58 });
});
