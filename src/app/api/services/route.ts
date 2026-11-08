export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { requireUser, branchScope, handle } from "@/lib/session";

export const GET = () => handle(async () => {
  const u = await requireUser(["CASHIER", "ADMIN", "OWNER"]); const branchId = branchScope(u);
  const services = await prisma.service.findMany({ where: { active: true, deletedAt: null, OR: [{ branchId }, { branchId: null }] },
    select: { id: true, name: true, description: true, priceRp: true }, orderBy: { name: "asc" } });
  return Response.json({ services });
});
